// controllers/groupController.ts
import express from 'express';
import { validationResult } from 'express-validator';
import Group from '../models/group';
import User from '../models/user';
import { AppError, validationErrorResponse, successResponse, errorResponse } from '../middleware/errorHandler';
import { IApiResponse } from '../types';
import { nanoid } from 'nanoid';
import { sendGroupInviteEmail } from '@/utils/email';
import { getIO, emitToGroupExcept } from '@/socket/socketHandler';

export const getUserGroups = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const groups = await Group.findByUser(req.userId!);
  res.status(200).json(successResponse(groups, 'Groups retrieved successfully'));
};

export const createGroup = async (req: express.Request, res: express.Response<IApiResponse>) => {
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

export const getGroupById = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const group = await Group.findById(req.params.groupId)
    .populate('members.user', 'username firstName lastName avatar lastSeen email')
    .populate('owner', 'username firstName lastName avatar')
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

export const updateGroup = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const allowedUpdates = ['name', 'description', 'settings', 'avatar'];
  const updates = Object.keys(req.body);
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    throw new AppError('Invalid updates', 400);
  }

  const group = await Group.findById(req.params.groupId);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  updates.forEach(update => {
    if (update === 'settings') {
      group.settings = { ...group.settings, ...req.body.settings };
    } else {
      (group as any)[update] = req.body[update];
    }
  });

  await group.save();

  const updatedGroup = await Group.findById(group._id)
    .populate('members.user', 'username firstName lastName avatar')
    .populate('owner', 'username firstName lastName avatar');

  res.status(200).json(successResponse(updatedGroup, 'Group updated successfully'));
};

export const deleteGroup = async (req: express.Request, res: express.Response<IApiResponse>) => {
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

export const joinGroup = async (req: express.Request, res: express.Response<IApiResponse>) => {
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

  // Find the invite by code (no longer user-specific)
  const invite = group.pendingInvites.find(i => i.code === inviteCode);
  if (!invite) {
    throw new AppError('Invalid or expired invite code', 404);
  }

  // Check if user is already a member
  const alreadyMember = group.members.find(m => m.user.toString() === userId);
  if (alreadyMember) {
    throw new AppError('You are already a member of this group', 400);
  }

  // Add user to group
  await group.addMember(userId, invite.role);

  // Remove the invite from pending invites
  group.pendingInvites = group.pendingInvites.filter(i => i.code !== inviteCode);
  await group.save();

  await User.findByIdAndUpdate(userId, { $push: { groups: group._id } });

  const updatedGroup = await Group.findById(group._id)
    .populate('members.user', 'username firstName lastName avatar')
    .populate('owner', 'username firstName lastName avatar');

  res.status(200).json(successResponse(updatedGroup, 'Successfully joined group'));
};


export const leaveGroup = async (req: express.Request, res: express.Response<IApiResponse>) => {
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

export const inviteToGroup = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const { email, role = 'member' } = req.body;
  const group = req.group;

  // Check if user is already a member
  const existingMember = group.members.find((member: any) => 
    member.user.toString() === req.userId
  );
  if (!existingMember) {
    throw new AppError('You must be a member to invite others', 403);
  }

  // Check if user has permission to invite
  if (!existingMember.permissions.canInviteMembers) {
    throw new AppError('You do not have permission to invite members', 403);
  }

  // Find if user is registered
  const user = await User.findOne({ email, isActive: true });
  const inviteCode = nanoid(8);

  // Check if user is already a member of the group
  if (user) {
    const isAlreadyMember = group.members.find((member: any) => 
      member.user.toString() === user._id.toString()
    );
    if (isAlreadyMember) {
      throw new AppError(`המשתמש ${user.firstName} ${user.lastName} כבר חבר בקבוצה`, 400);
    }
  }

  // Check if user already has a pending invite
  const existingInvite = group.pendingInvites.find((invite: any) => 
    invite.email === email || (user && invite.user?.toString() === user._id.toString())
  );
  if (existingInvite) {
    const errorMessage = user 
      ? `המשתמש ${user.firstName} ${user.lastName} כבר קיבל הזמנה`
      : `כתובת האימייל ${email} כבר קיבלה הזמנה`;
    throw new AppError(errorMessage, 400);
  }

  // Send invitation based on user registration status
  if (user) {
    // User is registered - send in-app notification
    const inviteData = {
      user: user._id,
      code: inviteCode,
      role,
      type: 'in-app' as const,
      invitedAt: new Date()
    };

    await group.updateOne({
      $push: { pendingInvites: inviteData }
    });

    // Add invitation to user's pendingInvitations
    await User.findByIdAndUpdate(user._id, {
      $push: {
        pendingInvitations: {
          group: group._id,
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

    res.status(200).json(successResponse({ 
      email, 
      type: 'in-app',
      message: `הזמנה נשלחה בהצלחה למשתמש ${user.firstName} ${user.lastName}`
    }));
  } else {
    // User is not registered - send email
    const inviteData = {
      email,
      code: inviteCode,
      role,
      type: 'email' as const,
      invitedAt: new Date()
    };

    await group.updateOne({
      $push: { pendingInvites: inviteData }
    });

    // Send email invitation
    await sendGroupInviteEmail(email, inviteCode);

    res.status(200).json(successResponse({ 
      email, 
      type: 'email',
      message: `הזמנה נשלחה בהצלחה לאימייל ${email}`
    }));
  }
};

export const removeGroupMember = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const { userId } = req.params;
  const group = req.group;
  const removerId = req.userId!;

  await group.removeMember(userId, removerId);
  await User.findByIdAndUpdate(userId, { $pull: { groups: group._id } });

  res.status(200).json(successResponse(null, 'Member removed successfully'));
};

export const updateMemberRole = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const { userId } = req.params;
  const { role } = req.body;
  const group = req.group;
  const updaterId = req.userId!;

  await group.updateMemberRole(userId, role, updaterId);
  
  // Update real-time notification for the users in the group with socket.io
  const io = getIO();
  if (io) {
    emitToGroupExcept(io, group._id.toString(), updaterId, 'memberRoleUpdated', {
      groupId: group._id.toString(),
      userId,
      role,
      updaterId
    });
  }
  
  res.status(200).json(successResponse(null, 'Member role updated successfully'));
};

export const transferOwnership = async (req: express.Request, res: express.Response<IApiResponse>) => {
  try {
    const { newOwnerId } = req.body;
    const group = req.group;
    const currentOwnerId = req.userId!;

    // Validate input
    if (!newOwnerId) {
      res.status(400).json({ success: false, message: 'מזהה הבעלים החדש נדרש' });
      return;
    }

    // Check if current user is the owner
    const currentOwner = group.members.find(
      (member: any) => member.user.toString() === currentOwnerId && member.role === 'owner'
    );

    if (!currentOwner) {
      res.status(403).json({ success: false, message: 'רק בעלי הקבוצה יכולים להעביר בעלות' });
      return;
    }

    // Check if new owner exists and is a member
    const newOwner = group.members.find(
      (member: any) => member.user.toString() === newOwnerId
    );

    if (!newOwner) {
      res.status(404).json({ success: false, message: 'המשתמש לא נמצא בקבוצה' });
      return;
    }

    if (newOwnerId === currentOwnerId) {
      res.status(400).json({ success: false, message: 'לא ניתן להעביר בעלות לעצמך' });
      return;
    }

    // Transfer ownership
    await group.transferOwnership(currentOwnerId, newOwnerId);

    const updatedGroup = await Group.findById(group._id)
      .populate('members.user', 'firstName lastName email');

    // Update real-time notification for the users in the group with socket.io
    const io = getIO();
    if (io) {
      emitToGroupExcept(io, group._id.toString(), currentOwnerId, 'ownershipTransferred', {
        groupId: group._id.toString(),
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

export const getGroupMembers = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const group = await Group.findById(req.params.groupId)
    .populate('members.user', 'username firstName lastName avatar lastSeen preferences')
    .select('members');

  if (!group) {
    throw new AppError('Group not found', 404);
  }

  res.status(200).json(successResponse(group.members, 'Members retrieved successfully'));
};

// Removed generateInviteCode function - no longer needed since we use individual invite codes per user

export const getGroupStats = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const ShoppingList = (await import('../models/shoppingList')).default;
  const id = req.params.groupId
  if(!id){
    throw new AppError('Group id is required', 404)
  }
  const stats = await ShoppingList.getStatistics(id);
  res.status(200).json(successResponse(stats, 'Statistics retrieved successfully'));
};