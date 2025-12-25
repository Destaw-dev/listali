import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import User from '../models/user';
import { asyncHandler, AppError, validationErrorResponse, successResponse } from '../middleware/errorHandler';
import { IApiResponse, IAuthRequest, IRegisterRequest, IAuthResponse, UserDocument, IBasePendingInvite, IGroupMember } from '../types';
import { sendEmailVerification } from '../utils/email';

const setAuthCookie = (res: Response, token: string): void => {
  const cookieOptions = {
    expires: new Date(Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE || '7') * 24 * 60 * 60 * 1000)),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const
  };
  res.cookie('token', token, cookieOptions);
};

export const register = asyncHandler(async (req: Request, res: Response<IApiResponse<IAuthResponse>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }
  const { username, email, password, firstName, lastName, inviteCode }: IRegisterRequest & { inviteCode?: string } = req.body;
  
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  const user = await User.create({ 
    username, 
    email, 
    password, 
    firstName, 
    lastName,
    emailVerification: {
      token: verificationToken,
      expiresAt
    }
  });

  const newUser = await User.findById(user._id);
  const language = newUser?.preferences?.language || 'he';
  


  let groupJoined = null;
  let inviteError = null;
  if (inviteCode) {
    try {
      const Group = (await import('../models/group')).default;
      const group = await Group.findOne({
        'pendingInvites.code': inviteCode,
        isActive: true
      });

      if (group) {
        const invite = group.pendingInvites.find((i: IBasePendingInvite) => i.code === inviteCode);
        if (invite) {
          const inviteAge = Date.now() - new Date(invite.invitedAt).getTime();
          const inviteExpirationTime = 1000 * 60 * 60 * 24; // 24 hours in milliseconds
          if (inviteAge > inviteExpirationTime) {
            const hoursExpired = Math.round(inviteAge / (1000 * 60 * 60));
            console.error(`Invitation expired: invite code ${inviteCode} expired ${hoursExpired} hours ago`);
            inviteError = 'This invitation has expired. Please request a new invitation from the group admin.';
          } else {
            if (invite.type === 'email' && invite.email) {
              if (invite.email.toLowerCase() !== email.toLowerCase()) {
                console.error(`Email mismatch: invite email ${invite.email} does not match user email ${email}`);
                inviteError = 'The email address used for registration does not match the email address that received the invitation.';
              } else {
                const alreadyMember = group.members.find((m: IGroupMember) => m.user.toString() === user._id.toString());
                if (!alreadyMember) {
                  await group.addMember(user._id.toString(), invite.role || 'member');
                  
                  group.pendingInvites = group.pendingInvites.filter((i: IBasePendingInvite) => i.code !== inviteCode);
                  await group.save();
                  
                  await User.findByIdAndUpdate(user._id, { 
                    $push: { groups: group._id },
                    $set: { 
                      isEmailVerified: true, 
                      emailVerification: { token: '', expiresAt: new Date() } 
                    }
                  });
                  
                  groupJoined = group._id.toString();
                }
              }
            }
          }
        } else {
          console.error(`Invite code not found: ${inviteCode}`);
          inviteError = 'Invalid invitation code. Please check the invitation link or request a new one.';
        }
      } else {
        console.error(`Group not found for invite code: ${inviteCode}`);
        inviteError = 'Invalid invitation code. The group may not exist or the invitation may have been cancelled.';
      }
    } catch (error) {
      console.error('Failed to join group with invite code:', error);
      inviteError = 'Failed to process the invitation. Please contact the group admin for assistance.';
    }
  }
  
  const token = user.getSignedJwtToken();
  setAuthCookie(res, token);
  const userResponse = user.toObject();
  
  let message = 'User registered successfully! Please check your email for verification link.';
  if (groupJoined) {
    message = 'User registered successfully and joined the group! Please check your email for verification link.';
  } else if (inviteError) {
    message = `User registered successfully! However, ${inviteError}`;
  }
if (!user.isEmailVerified && !groupJoined) {
    try {
      await sendEmailVerification(email, verificationToken, username, language);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }
  }
  
  const responseData: IAuthResponse = {
    user: userResponse,
    token,
    ...(groupJoined && { groupJoined }),
    ...(inviteError && { inviteError })
  };
  
  res.status(201).json(successResponse<IAuthResponse>(
    responseData, 
    message
  ));
});

export const login = asyncHandler(async (req: Request, res: Response<IApiResponse<IAuthResponse>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }
  const { email, password }: IAuthRequest = req.body;
  try {
    const user = await User.findByCredentials(email, password) as UserDocument;

    console.log('user', user);
    if (!user.isEmailVerified) {
      throw new AppError('Please verify your email address before logging in. Check your email for verification link.', 403, false);
    }
    
    const token = user.getSignedJwtToken();
    setAuthCookie(res, token);
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(200).json(successResponse<IAuthResponse>({ user: userResponse, token }, 'Login successful'));
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid credentials', 400, true);
  }
});

export const logout = asyncHandler(async (_req: Request, res: Response<IApiResponse>) => {
  res.cookie('token', '', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json(successResponse(null, 'Logout successful'));
});

export const getMe = asyncHandler(async (req: Request, res: Response<IApiResponse>) => {
  const user = await User.findById(req.userId).populate('groups', 'name description avatar membersCount');
  if (!user) throw new AppError('User not found', 404);
  
  if (!user.isEmailVerified) {
    throw new AppError('Please verify your email address to access your account.', 403);
  }
  
  res.status(200).json(successResponse(user, 'User data retrieved'));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response<IApiResponse>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }
  const allowedUpdates = ['firstName', 'lastName', 'username', 'preferences'];
  const updates = Object.keys(req.body);
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));
  if (!isValidOperation) throw new AppError('Invalid updates', 400);

  const user = await User.findById(req.userId);
  if (!user) throw new AppError('User not found', 404);

  updates.forEach(update => {
    if (update === 'preferences') {
      user.preferences = { ...user.preferences, ...req.body.preferences };
    } else {
      (user as any)[update] = req.body[update];
    }
  });
  await user.save();
  res.status(200).json(successResponse(user, 'Profile updated successfully'));
});

export const updateEmail = asyncHandler(async (req: Request, res: Response<IApiResponse>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }
  
  const { email } = req.body;
  const user = await User.findById(req.userId);
  if (!user) throw new AppError('User not found', 404);

  const existingUser = await User.findOne({ email, _id: { $ne: req.userId } });
  if (existingUser) {
    throw new AppError('Email is already registered by another user', 400);
  }

  if (user.email === email) {
    throw new AppError('This is already your current email', 400);
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  user.email = email;
  user.isEmailVerified = false;
  user.emailVerification = {
    token: verificationToken,
    expiresAt
  };
  await user.save();

  try {
    const language = user.preferences?.language || 'he';
    await sendEmailVerification(email, verificationToken, user.username, language);
    res.status(200).json(successResponse(null, 'Email updated successfully. Please check your email to verify the new address.'));
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
    res.status(500).json({
      success: false,
      message: 'Email updated but failed to send verification email. Please try again.'
    });
  }
});

export const changePassword = asyncHandler(async (req: Request, res: Response<IApiResponse>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.userId).select('+password');
  if (!user) throw new AppError('User not found', 404);
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);
  user.password = newPassword;
  await user.save();
  res.status(200).json(successResponse(null, 'Password updated successfully'));
});

export const refreshToken = asyncHandler(async (req: Request, res: Response<IApiResponse>) => {
  const user = await User.findById(req.userId);
  if (!user) throw new AppError('User not found', 404);
  const token = user.getSignedJwtToken();
  setAuthCookie(res, token);
  res.status(200).json(successResponse({ token }, 'Token refreshed successfully'));
});

export const checkUsernameAvailability = asyncHandler(async (req: Request, res: Response<IApiResponse>) => {
  const { username } = req.params;
  if (!username || username.length < 3) throw new AppError('Username must be at least 3 characters', 400);
  const isAvailable = await User.isUsernameAvailable(username);
  res.status(200).json(successResponse({ available: isAvailable }, isAvailable ? 'Username is available' : 'Username is already taken'));
});

export const checkEmailAvailability = asyncHandler(async (req: Request, res: Response<IApiResponse>) => {
  const { email } = req.params;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('Invalid email format', 400);
  const isAvailable = await User.isEmailAvailable(email);
  res.status(200).json(successResponse({ available: isAvailable }, isAvailable ? 'Email is available' : 'Email is already registered'));
});

export const getMyInvitations = asyncHandler(async (req: Request, res: Response<IApiResponse>) => {
  const user = await User.findById(req.userId)
    .populate({
      path: 'pendingInvitations.group',
      select: 'name description avatar membersCount'
    })
    .populate({
      path: 'pendingInvitations.invitedBy',
      select: 'username firstName lastName avatar'
    });
  
  if (!user) throw new AppError('User not found', 404);
  
  const pendingInvitations = user.pendingInvitations.filter(inv => inv.status === 'pending');
  res.status(200).json(successResponse(pendingInvitations, 'Invitations retrieved successfully'));
});

export const acceptInvitation = asyncHandler(async (req: Request, res: Response<IApiResponse>) => {
  const { invitationId } = req.body;
  const userId = req.userId!;

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const invitation = user.pendingInvitations.find(inv => inv.code === invitationId);
  if (!invitation) throw new AppError('Invitation not found', 404);

  if (invitation.status !== 'pending') {
    throw new AppError('Invitation has already been processed', 400);
  }


  const Group = (await import('../models/group')).default;
  const group = await Group.findById(invitation.group);
  if (!group) throw new AppError('Group not found', 404);

  const invite = group.pendingInvites.find(i => i.code === invitationId);
  if (!invite) {
    throw new AppError('Invalid or expired invite code', 404);
  }

  const alreadyMember = group.members.find(m => m.user.toString() === userId);
  if (alreadyMember) {
    throw new AppError('You are already a member of this group', 400);
  }

  await group.addMember(userId, invite.role);

  group.pendingInvites = group.pendingInvites.filter(i => i.code !== invitationId);
  
  invitation.status = 'accepted';
  await user.save();

  await group.save();

  await User.findByIdAndUpdate(userId, { $push: { groups: invitation.group } });

  res.status(200).json(successResponse(null, 'Invitation accepted successfully'));
});

export const declineInvitation = asyncHandler(async (req: Request, res: Response<IApiResponse>) => {
  const { code } = req.body;
  const userId = req.userId!;

  const user = await User.findById(userId);
  const Group = (await import('../models/group')).default;
  if (!user) throw new AppError('User not found', 404);

  const invitation = user.pendingInvitations.find(inv => inv.code === code);
  if (!invitation) throw new AppError('Invitation not found', 404);

  const group = await Group.findById(invitation.group);
  if (!group) throw new AppError('Group not found', 404);

  if (invitation.status !== 'pending') {
    throw new AppError('Invitation has already been processed', 400);
  }


  const invite = group.pendingInvites.find(i => i.code === code);
  if (!invite) {
    throw new AppError('Invalid or expired invite code', 404);
  }

  const alreadyMember = group.members.find(m => m.user.toString() === userId);
  if (alreadyMember) {
    throw new AppError('You are already a member of this group', 400);
  }

  group.pendingInvites = group.pendingInvites.filter(i => i.code !== code);
  await group.save();

  invitation.status = 'declined';
  await user.save();

  res.status(200).json(successResponse(null, 'Invitation declined successfully'));
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response<IApiResponse>) => {
  const { token, email } = req.body;
  
  if (!token) {
    throw new AppError('Verification token is required', 400);
  }

  if (email) {
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isEmailVerified) {
      throw new AppError('Email is already verified', 400);
    }
  }

  const user = await User.findOne({ 
    'emailVerification.token': token 
  });

  if (!user) {
    throw new AppError('Invalid verification token', 400);
  }

  if (user.isEmailVerified) {
    throw new AppError('Email is already verified', 400);
  }

  if (!user.emailVerification || user.emailVerification.expiresAt < new Date()) {
    throw new AppError('Verification token has expired', 400);
  }

  user.isEmailVerified = true;
  user.emailVerification = {
    token: '',
    expiresAt: new Date()
  };
  await user.save();

  
  const userResponse = user.toObject();

  const publicUser = {
    _id: userResponse._id,
    username: userResponse.username,
    email: userResponse.email,
    firstName: userResponse.firstName,
    lastName: userResponse.lastName,
    avatar: userResponse.avatar,
    isEmailVerified: userResponse.isEmailVerified,
    groups: userResponse.groups,
    preferences: userResponse.preferences
  };
  res.status(200).json(successResponse({ user: publicUser }, 'Email verified successfully'));
});

export const resendVerification = asyncHandler(async (req: Request, res: Response<IApiResponse>) => {
  const { email } = req.body;
  
  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.isEmailVerified) {
    throw new AppError('Email is already verified', 400);
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  user.emailVerification = {
    token: verificationToken,
    expiresAt
  };
  await user.save();

  try {
    const newUser = await User.findById(user._id);
    const language = newUser?.preferences?.language || 'he';
    await sendEmailVerification(email, verificationToken, user.username, language);
    res.status(200).json(successResponse(null, 'Verification email sent successfully'));
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
    res.status(500).json({
      success: false,
      message: 'Verification token generated but failed to send email'
    });
  }
});

export const resendVerificationForLogin = asyncHandler(async (req: Request, res: Response<IApiResponse>) => {
  const { email } = req.body;
  
  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.isEmailVerified) {
    throw new AppError('Email is already verified', 400);
  }

  if (user.emailVerification && user.emailVerification.expiresAt > new Date()) {
    try {
      const newUser = await User.findById(user._id);
      const language = newUser?.preferences?.language || 'he';
      await sendEmailVerification(email, user.emailVerification.token, user.username, language);
      res.status(200).json(successResponse(null, 'Verification email resent successfully'));
    } catch (emailError) {
      console.error('Failed to resend verification email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to resend verification email'
      });
    }
  } else {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerification = {
      token: verificationToken,
      expiresAt
    };
    await user.save();

    try {
      const newUser = await User.findById(user._id);
      const language = newUser?.preferences?.language || 'he';
      await sendEmailVerification(email, verificationToken, user.username, language);
      res.status(200).json(successResponse(null, 'New verification email sent successfully'));
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Verification token generated but failed to send email'
      });
    }
  }
});
