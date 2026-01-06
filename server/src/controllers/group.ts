import express from 'express';
import { validationResult } from 'express-validator';
import Group from '../models/group';
import User from '../models/user';
import { AppError, validationErrorResponse, successResponse, errorResponse } from '../middleware/handlers';
import { IApiResponse, IGroupMember, IGroup, IBasePendingInvite, IGroupStatistics, Language } from '../types';
import { nanoid } from 'nanoid';
import { sendGroupInviteEmail } from '../utils/email';
import { getIO, emitToGroupExcept } from '../socket/socketHandler';

export const getUserGroups = async (req: express.Request, res: express.Response<IApiResponse<IGroup[] | null>>) => {
  const groups = await Group.findByUser(req.userId!);
  res.status(200).json(successResponse(groups, 'Groups retrieved successfully'));
};

export const createGroup = async (req: express.Request, res: express.Response<IApiResponse<IGroup | null | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const { name, description, settings } = req.body;
  const userId = req.userId!;

  const group = await Group.create({
    name,
    description,
    owner: userId,
    settings: settings || {},
    members: [{
      user: userId,
      role: 'owner',
      joinedAt: new Date(),
      permissions: {
        canCreateLists: true,
        canEditLists: true,
        canDeleteLists: true,
        canInviteMembers: true,
        canManageMembers: true
      }
    }]
  });

  await User.findByIdAndUpdate(userId, { $push: { groups: group._id } });

  const populatedGroup = await Group.findById(group._id)
    .populate('members.user', 'username firstName lastName avatar')
    .populate('owner', 'username firstName lastName avatar');

  res.status(201).json(successResponse(populatedGroup, 'Group created successfully'));
};

export const getGroupById = async (req: express.Request, res: express.Response<IApiResponse<IGroup | null>>) => {
  const group = await Group.findById(req.params.groupId)
    .populate('members.user', 'username firstName lastName avatar lastSeen email')
    .populate('owner', 'username firstName lastName avatar')
    .populate({
      path: 'pendingInvites.user',
      select: 'username firstName lastName avatar email'
    })
    .populate({
      path: 'shoppingLists',
      select: 'name status priority createdAt metadata createdBy',
      options: { sort: { createdAt: -1 }, limit: 10 },
      populate: {
        path: 'createdBy',
        select: 'username firstName lastName avatar'
      }
    });


  if (!group || !group.isActive) {
    throw new AppError('Group not found', 404);
  }

  res.status(200).json(successResponse(group, 'Group retrieved successfully'));
};

export const updateGroup = async (req: express.Request, res: express.Response<IApiResponse<IGroup | null | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const allowedUpdates: (keyof IGroup)[] = ['name', 'description', 'avatar', 'settings'];
  const updates = Object.keys(req.body);
  const isValidOperation = updates.every((update: string) => allowedUpdates.includes(update as keyof IGroup));

  if (!isValidOperation) {
    throw new AppError('Invalid updates', 400);
  }

  const group = await Group.findById(req.params.groupId);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  for (const update of updates) {
    if (update === 'settings') {
      group.settings = { ...group.settings, ...req.body.settings };
    } else if (allowedUpdates.includes(update as keyof IGroup)) {
      switch (update) {
        case 'name':
          group.name = req.body.name;
          break;
        case 'description':
          group.description = req.body.description;
          break;
        case 'avatar':
          group.avatar = req.body.avatar;
          break;
      }
    }
  }

  await group.save();

  const updatedGroup = await Group.findById(group._id)
    .populate('members.user', 'username firstName lastName avatar')
    .populate('owner', 'username firstName lastName avatar');

  res.status(200).json(successResponse(updatedGroup, 'Group updated successfully'));
};

export const deleteGroup = async (req: express.Request, res: express.Response<IApiResponse<null>>) => {
  const group = await Group.findById(req.params.groupId);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  group.isActive = false;
  await group.save();

  const memberIds = group.members.map(member => member.user);
  await User.updateMany(
    { _id: { $in: memberIds } },
    { $pull: { groups: group._id } }
  );

  res.status(200).json(successResponse(null, 'Group deleted successfully'));
};

export const joinGroup = async (req: express.Request, res: express.Response<IApiResponse<IGroup | null>>) => {
  const { inviteCode } = req.params;
  const userId = req.userId!;

  if (!inviteCode) {
    throw new AppError('Missing invite code', 400);
  }

  const group = await Group.findOne({
    'pendingInvites.code': inviteCode,
    isActive: true
  });

  if (!group) {
    throw new AppError('Invalid or expired invite code', 404);
  }

  const invite = group.pendingInvites.find(i => i.code === inviteCode);
  if (!invite) {
    throw new AppError('Invalid or expired invite code', 404);
  }

  const alreadyMember = group.members.find(m => m.user.toString() === userId);
  if (alreadyMember) {
    throw new AppError('You are already a member of this group', 400);
  }

  await group.addMember(userId, invite.role);

  group.pendingInvites = group.pendingInvites.filter(i => i.code !== inviteCode);
  await group.save();

  await User.findByIdAndUpdate(userId, { $push: { groups: group._id } });

  const updatedGroup = await Group.findById(group._id)
    .populate('members.user', 'username firstName lastName avatar')
    .populate('owner', 'username firstName lastName avatar');

  res.status(200).json(successResponse(updatedGroup, 'Successfully joined group'));
};


export const leaveGroup = async (req: express.Request, res: express.Response<IApiResponse<null>>) => {
  const groupId = req.params.groupId;
  const userId = req.userId!;


  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  const member = group.members.find(m => m.user.toString() === userId);
  if (member?.role === 'owner' && group.members.length > 1) {
    throw new AppError('Cannot leave group as owner. Transfer ownership first.', 400);
  }

  await group.removeMember(userId, userId);
  await User.findByIdAndUpdate(userId, { $pull: { groups: group._id } });
  
  if (member?.role === 'owner' && group.members.length === 1) {
    group.isActive = false;
    await group.save();
  }

  res.status(200).json(successResponse(null, 'Successfully left group'));
};

export const inviteToGroup = async (req: express.Request, res: express.Response<IApiResponse<null | { email: string, type: string, message: string }>>) => {
  const { email, role = 'member' } = req.body;
  const group = req.group;

  const existingMember = group?.members.find((member: IGroupMember) => 
    member.user.toString() === req.userId
  );
  if (!existingMember) {
    throw new AppError('You must be a member to invite others', 403);
  }

  if (!existingMember.permissions.canInviteMembers) {
    throw new AppError('You do not have permission to invite members', 403);
  }

  const user = await User.findOne({ email, isActive: true });
  const inviteCode = nanoid(8);

  if (user) {
    const isAlreadyMember = group?.members.find((member: IGroupMember) => 
      member.user.toString() === user._id.toString()
    );
    if (isAlreadyMember) {
      throw new AppError(`the user ${user.firstName} ${user.lastName} is already a member of the group`, 400);
    }
  }

  const existingInvite = group?.pendingInvites.find((invite: IBasePendingInvite) => 
    invite.email === email || (user && 'user' in invite && invite.user?.toString() === user._id.toString())
  );

  if (existingInvite) {
    if (existingInvite.status === 'pending' && existingInvite.invitedAt < new Date(Date.now() - 1000 * 60 * 60 * 24)) {
      await group?.updateOne({
        $set: {
          pendingInvites: group?.pendingInvites.filter((invite: { code: string }) => invite.code !== existingInvite.code)
        }
      });
      await sendGroupInviteEmail({to: email, code: inviteCode, inviterName: req.user?.firstName || 'A friend', groupName: group?.name || 'A group', language: req.user?.preferences?.language as Language || 'he', isNewUser: true, inviteType: 'friend'});
      return res.status(200).json(successResponse(null, 'New invite sent successfully'));
    } else {
      const errorMessage = user 
        ? `the user ${user.firstName} ${user.lastName} has already received an invitation`
        : `the email ${email} has already received an invitation`;
      throw new AppError(errorMessage, 400);
    }
  }

  if (user) {
    const inviteData = {
      user: user._id,
      code: inviteCode,
      role,
      type: 'in-app' as const,
      invitedAt: new Date()
    };

    await group?.updateOne({
      $push: { pendingInvites: inviteData }
    });

    await User.findByIdAndUpdate(user._id, {
      $push: {
        pendingInvitations: {
          group: group?._id,
          invitedBy: req.userId,
          role,
          code: inviteCode,
          invitedAt: new Date(),
          status: 'pending'
        }
      }
    });

    // TODO: Send in-app notification to user
    // This would typically be done via Socket.IO or push notification

    return res.status(200).json(successResponse({ 
      email, 
      type: 'in-app',
      message: `the invitation has been sent successfully to the user ${user.firstName} ${user.lastName}`
    }));
  } else {
    const inviteData = {
      email,
      code: inviteCode,
      role,
      type: 'email' as const,
      invitedAt: new Date()
    };

    await group?.updateOne({
      $push: { pendingInvites: inviteData }
    });

    await sendGroupInviteEmail({to: email, code: inviteCode, inviterName: req.user?.firstName || 'A friend', groupName: group?.name || 'A group', language: req.user?.preferences?.language as Language || 'he', isNewUser: true, inviteType: 'friend'});

    return res.status(200).json(successResponse({ 
      email, 
      type: 'email',
      message: `the invitation has been sent successfully to the email ${email}`
    }));
  }
};

export const cancelGroupInvitation = async (req: express.Request, res: express.Response<IApiResponse<null>>) => {
  const { inviteCode } = req.params;
  const group = req.group;
  const userId = req.userId!;

  if (!inviteCode) {
    throw new AppError('Invite code is required', 400);
  }

  const member = group?.members.find((m: IGroupMember) => m.user.toString() === userId);
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    throw new AppError('You do not have permission to cancel invitations', 403);
  }

  const invite = group?.pendingInvites.find((inv: IBasePendingInvite) => inv.code === inviteCode);
  if (!invite) {
    throw new AppError('Invitation not found', 404);
  }

  await group?.updateOne({
    $pull: { pendingInvites: { code: inviteCode } }
  });

  if (invite.type === 'in-app' && invite.user) {
    await User.findByIdAndUpdate(invite.user, {
      $pull: {
        pendingInvitations: { code: inviteCode }
      }
    });
  }

  res.status(200).json(successResponse(null, 'Invitation cancelled successfully'));
};

export const removeGroupMember = async (req: express.Request, res: express.Response<IApiResponse<null>>) => {
  const { userId } = req.params;
  const group = req.group;
  const removerId = req.userId!;

  await group?.removeMember(userId!, removerId);
  await User.findByIdAndUpdate(userId, { $pull: { groups: group?._id } });

  return res.status(200).json(successResponse(null, 'Member removed successfully'));
};

export const updateMemberRole = async (req: express.Request, res: express.Response<IApiResponse<null>>) => {
  const { userId } = req.params;
  const { role } = req.body;
  const group = req.group;
  const updaterId = req.userId!;

  if (!group) {
    throw new AppError('Group not found', 404);
  }

  const freshGroup = await Group.findById(group._id);
  if (!freshGroup) {
    throw new AppError('Group not found', 404);
  }

  await freshGroup.updateMemberRole(userId!, role, updaterId);
  
  const io = getIO();
  if (io) {
    emitToGroupExcept(io, freshGroup._id.toString(), updaterId, 'memberRoleUpdated', {
      groupId: freshGroup._id.toString(),
      userId,
      role,
      updaterId
    });
  }
  
  return res.status(200).json(successResponse(null, 'Member role updated successfully'));
};

export const transferOwnership = async (req: express.Request, res: express.Response<IApiResponse<IGroup | null>>) => {
  try {
    const { newOwnerId } = req.body;
    const group = req.group;
    const currentOwnerId = req.userId!;

    if (!newOwnerId) {
      res.status(400).json(errorResponse('new owner id is required', 400));
      return;
    }

    const currentOwner = group?.members.find(
      (member: IGroupMember) => member.user.toString() === currentOwnerId && member.role === 'owner'
    );

    if (!currentOwner) {
      res.status(403).json(errorResponse('only owners can transfer ownership', 403));
      return;
    }

    const newOwner = group?.members.find(
      (member: IGroupMember) => member.user.toString() === newOwnerId
    );

    if (!newOwner) {
      res.status(404).json(errorResponse('user not found in group', 404));
      return;
    }

    if (newOwnerId === currentOwnerId) {
      res.status(400).json(errorResponse('cannot transfer ownership to yourself', 400));
      return;
    }

    await group?.transferOwnership(currentOwnerId, newOwnerId);

    const updatedGroup = await Group.findById(group?._id)
      .populate('members.user', 'firstName lastName email');

    const io = getIO();
    if (io) {
      emitToGroupExcept(io, group?._id.toString() || '', currentOwnerId, 'ownershipTransferred', {
        groupId: group?._id.toString(),
        previousOwnerId: currentOwnerId,
        newOwnerId,
        transferredBy: currentOwnerId
      });
    }

    res.status(200).json(successResponse(updatedGroup, 'Ownership transferred successfully'));
  } catch (error) {
    console.error('Error transferring ownership:', error);
    res.status(500).json(errorResponse('Error transferring ownership', 500));
  }
};

export const getGroupMembers = async (req: express.Request, res: express.Response<IApiResponse<IGroupMember[] | null>>) => {
  const group = await Group.findById(req.params.groupId)
    .populate('members.user', 'username firstName lastName avatar lastSeen preferences')
    .select('members');

  if (!group) {
    throw new AppError('Group not found', 404);
  }

  res.status(200).json(successResponse(group.members, 'Members retrieved successfully'));
};

export const getGroupStats = async (req: express.Request, res: express.Response<IApiResponse<IGroupStatistics | null>>) => {
  const ShoppingList = (await import('../models/shoppingList')).default;
  const id = req.params.groupId
  if(!id){
    throw new AppError('Group id is required', 404)
  }
  const stats = await ShoppingList.getStatistics(id);
  res.status(200).json(successResponse(stats, 'Statistics retrieved successfully'));
};