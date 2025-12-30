import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import User from '../models/user';
import { asyncHandler, AppError, validationErrorResponse, successResponse } from '../middleware/handlers';
import { IApiResponse, IAuthRequest, IRegisterRequest, IAuthResponse, UserDocument, IBasePendingInvite, IGroupMember, IUser, IPendingInvitation } from '../types';
import { sendEmailVerification } from '../utils/email';
import { signAccessToken, signRefreshToken, hashToken, verifyRefreshToken } from '../utils/tokens';

export const isMobileClient = (req: Request): boolean => {
  return req.headers['x-client'] === 'mobile';
};

export const setRefreshTokenCookies = (res: Response, refreshToken: string, sessionId: string): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.COOKIE_DOMAIN;
  
  const cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'none' | 'lax';
    path: string;
    expires: Date;
    domain?: string;
  } = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    expires: new Date(Date.now() + (parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS || '30') * 24 * 60 * 60 * 1000)),
  };
  
  if (isProduction && cookieDomain) {
    cookieOptions.domain = cookieDomain;
  }

  res.cookie('refreshToken', refreshToken, cookieOptions);

  res.cookie('sessionId', sessionId, cookieOptions);
};

const clearRefreshTokenCookies = (res: Response): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.COOKIE_DOMAIN;
  
  const cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'none' | 'lax';
    path: string;
    expires: Date;
    domain?: string;
  } = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    expires: new Date(0),
  };
  
  if (isProduction && cookieDomain) {
    cookieOptions.domain = cookieDomain;
  }

  res.cookie('refreshToken', '', cookieOptions);
  res.cookie('sessionId', '', cookieOptions);
};

export const register = asyncHandler(async (req: Request, res: Response<IApiResponse<IAuthResponse | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }
  const { username, email, password, firstName, lastName, inviteCode }: IRegisterRequest & { inviteCode?: string } = req.body;
  
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    throw new AppError('Email is already registered', 400);
  }
  
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    throw new AppError('Username is already taken', 400);
  }
  
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
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
          const inviteExpirationTime = 1000 * 60 * 60 * 24;
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
                  
                  group.pendingInvites = group.pendingInvites.filter((i: IBasePendingInvite) => i.code === inviteCode);
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
  
  const sessionId = crypto.randomUUID();
  const refreshExpiresAt = new Date(Date.now() + (parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS || '30') * 24 * 60 * 60 * 1000));
  
  user.enforceMaxSessions(5);
  
  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString(), sessionId);
  const refreshTokenHash = hashToken(refreshToken);
  
  const sessionData: {
    sessionId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ip?: string;
  } = {
    sessionId,
    refreshTokenHash,
    expiresAt: refreshExpiresAt,
  };
  const userAgentValue = req.headers['user-agent'];
  if (userAgentValue) {
    sessionData.userAgent = userAgentValue;
  }
  const ipValue = req.ip || req.socket.remoteAddress;
  if (ipValue) {
    sessionData.ip = ipValue;
  }
  user.addSession(sessionData);
  
  await user.save();
  
  const userResponse = user.toObject();
  const { password: _password } = userResponse;
  
  const isMobile = isMobileClient(req);
  
  if (!isMobile) {
    setRefreshTokenCookies(res, refreshToken, sessionId);
  }
  
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
    accessToken,
    ...(isMobile && { refreshToken, sessionId }),
    ...(groupJoined && { groupJoined }),
    ...(inviteError && { inviteError })
  };
  
  res.status(201).json(successResponse<IAuthResponse>(
    responseData, 
    message
  ));
});

export const login = asyncHandler(async (req: Request, res: Response<IApiResponse<IAuthResponse | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }
  const { email, password }: IAuthRequest = req.body;
  try {
    const user = await User.findByCredentials(email, password) as UserDocument;

    if (!user.isEmailVerified) {
      throw new AppError('Please verify your email address before logging in. Check your email for verification link.', 403, false);
    }
    
    const sessionId = crypto.randomUUID();
    const refreshExpiresAt = new Date(Date.now() + (parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS || '30') * 24 * 60 * 60 * 1000));
    
    user.enforceMaxSessions(5);
    
    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString(), sessionId);
    const refreshTokenHash = hashToken(refreshToken);
    
    const sessionData: {
      sessionId: string;
      refreshTokenHash: string;
      expiresAt: Date;
      userAgent?: string;
      ip?: string;
    } = {
      sessionId,
      refreshTokenHash,
      expiresAt: refreshExpiresAt,
    };
  const userAgentValue = req.headers['user-agent'];
  if (userAgentValue) {
    sessionData.userAgent = userAgentValue;
  }
  const ipValue = req.ip || req.socket.remoteAddress;
  if (ipValue) {
    sessionData.ip = ipValue;
  }
  user.addSession(sessionData);
  
  await user.save();
  
    const userResponse = user.toObject();
  const { password: _password } = userResponse;
  
  const isMobile = isMobileClient(req);
  
  if (!isMobile) {
    setRefreshTokenCookies(res, refreshToken, sessionId);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Login - Setting cookies:', {
        hasRefreshToken: !!refreshToken,
        hasSessionId: !!sessionId,
        sessionIdLength: sessionId?.length || 0,
        refreshTokenLength: refreshToken?.length || 0
      });
    }
  }
    
    const responseData: IAuthResponse = {
      user: userResponse,
      accessToken,
      ...(isMobile && { refreshToken, sessionId })
    };
    
    res.status(200).json(successResponse<IAuthResponse>(responseData, 'Login successful'));
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid credentials', 400, true);
  }
});

export const logout = asyncHandler(async (req: Request, res: Response<IApiResponse<null>>) => {
  const isMobile = isMobileClient(req);
  let sessionId: string | undefined;

  if (isMobile) {
    sessionId = req.body.sessionId || req.headers['x-session-id'] as string;
  } else {
    sessionId = req.cookies.sessionId;
  }

  if (sessionId) {
    try {
      if (req.userId) {
        const user = await User.findById(req.userId);
        if (user) {
          user.revokeSession(sessionId);
          await user.save();
        }
      } else {
        const user = await User.findOne({ 'refreshSessions.sessionId': sessionId });
        if (user) {
          user.revokeSession(sessionId);
          await user.save();
        }
      }
    } catch (error) {
      console.error('Error revoking session:', error);
    }
  }

  if (!isMobile) {
    clearRefreshTokenCookies(res);
  }

  res.status(200).json(successResponse(null, 'Logout successful'));
});

export const getMe = asyncHandler(async (req: Request, res: Response<IApiResponse<IUser | null | void>>) => {
  const user = await User.findById(req.userId).populate('groups', 'name description avatar membersCount');
  if (!user) throw new AppError('User not found', 404);
  
  if (!user.isEmailVerified) {
    throw new AppError('Please verify your email address to access your account.', 403);
  }
  
  res.status(200).json(successResponse(user, 'User data retrieved'));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response<IApiResponse<IUser | null | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const allowedUpdates: (keyof IUser)[] = ['firstName', 'lastName', 'username', 'email', 'avatar', 'preferences'];
  const updates = Object.keys(req.body);
  const isValidOperation = updates.every((update: string) => allowedUpdates.includes(update as keyof IUser));
  if (!isValidOperation) throw new AppError('Invalid updates', 400);

  const user = await User.findById(req.userId);
  if (!user) throw new AppError('User not found', 404);

  for (const update of updates) {
    if (update === 'preferences') {
      user.preferences = { ...user.preferences, ...req.body.preferences };
    } else {
      switch (update) {
        case 'firstName':
          user.firstName = req.body.firstName;
          break;
        case 'lastName':
          user.lastName = req.body.lastName;
          break;
        case 'username':
          user.username = req.body.username;
          break;
        case 'email':
          user.email = req.body.email;
          break;
        case 'avatar':
          user.avatar = req.body.avatar;
          break;
      }
    }
  }
  await user.save();
  res.status(200).json(successResponse(user, 'Profile updated successfully'));
});

export const updateEmail = asyncHandler(async (req: Request, res: Response<IApiResponse<null | void>>) => {
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
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

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

export const changePassword = asyncHandler(async (req: Request, res: Response<IApiResponse<null | void>>) => {
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

export const refreshToken = asyncHandler(async (req: Request, res: Response<IApiResponse<{ accessToken: string; refreshToken?: string; sessionId?: string }>>) => {
  const isMobile = isMobileClient(req);
  let refreshToken: string | undefined;
  let sessionId: string | undefined;

  if (isMobile) {
    refreshToken = req.body.refreshToken || req.headers['x-refresh-token'] as string;
    sessionId = req.body.sessionId || req.headers['x-session-id'] as string;
  } else {
    refreshToken = req.cookies.refreshToken;
    sessionId = req.cookies.sessionId;
    
    if (process.env.NODE_ENV !== 'production' && (!refreshToken || !sessionId)) {
      console.log('Refresh endpoint - cookies received:', {
        hasRefreshToken: !!refreshToken,
        hasSessionId: !!sessionId,
        allCookies: Object.keys(req.cookies),
        cookieHeader: req.headers.cookie,
        origin: req.headers.origin,
        referer: req.headers.referer
      });
    }
  }

  if (!refreshToken || !sessionId) {
    if (req.cookies.token) {
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieDomain = process.env.COOKIE_DOMAIN;
      const clearOptions: {
        httpOnly: boolean;
        secure: boolean;
        sameSite: 'none' | 'lax';
        path: string;
        expires: Date;
        domain?: string;
      } = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
        expires: new Date(0),
      };
      if (isProduction && cookieDomain) {
        clearOptions.domain = cookieDomain;
      }
      res.cookie('token', '', clearOptions);
    }
    
    throw new AppError('No valid refresh token found. Please log in again.', 401);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  if (decoded.sid !== sessionId) {
    throw new AppError('Session ID mismatch', 401);
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', 401);
  }

  const session = user.refreshSessions.find(s => s.sessionId === sessionId);
  if (!session) {
    throw new AppError('Session not found', 401);
  }

  const providedTokenHash = hashToken(refreshToken);
  if (session.refreshTokenHash !== providedTokenHash) {
    throw new AppError('Invalid refresh token', 401);
  }

  if (session.expiresAt < new Date()) {
    user.revokeSession(sessionId);
    await user.save();
    throw new AppError('Refresh token has expired', 401);
  }

  const newRefreshExpiresAt = new Date(Date.now() + (parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS || '30') * 24 * 60 * 60 * 1000));
  const newRefreshToken = signRefreshToken(user._id.toString(), sessionId);
  const newRefreshTokenHash = hashToken(newRefreshToken);

  user.rotateSession(sessionId, newRefreshTokenHash, newRefreshExpiresAt);
  await user.save();

  const accessToken = signAccessToken(user._id.toString());

  if (!isMobile) {
    setRefreshTokenCookies(res, newRefreshToken, sessionId);
  }

  const responseData: { accessToken: string; refreshToken?: string; sessionId?: string } = {
    accessToken,
    ...(isMobile && { refreshToken: newRefreshToken, sessionId })
  };

  res.status(200).json(successResponse(responseData, 'Token refreshed successfully'));
});

export const checkUsernameAvailability = asyncHandler(async (req: Request, res: Response<IApiResponse<{ available: boolean }>>) => {
  const { username } = req.params;
  if (!username || username.length < 3) throw new AppError('Username must be at least 3 characters', 400);
  const isAvailable = await User.isUsernameAvailable(username);
  res.status(200).json(successResponse({ available: isAvailable }, isAvailable ? 'Username is available' : 'Username is already taken'));
});

export const checkEmailAvailability = asyncHandler(async (req: Request, res: Response<IApiResponse<{ available: boolean }>>) => {
  const { email } = req.params;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('Invalid email format', 400);
  const isAvailable = await User.isEmailAvailable(email);
  res.status(200).json(successResponse({ available: isAvailable }, isAvailable ? 'Email is available' : 'Email is already registered'));
});

export const getMyInvitations = asyncHandler(async (req: Request, res: Response<IApiResponse<IPendingInvitation[]>>) => {
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

export const acceptInvitation = asyncHandler(async (req: Request, res: Response<IApiResponse<null>>) => {
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

export const declineInvitation = asyncHandler(async (req: Request, res: Response<IApiResponse<null>>) => {
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

export const verifyEmail = asyncHandler(async (req: Request, res: Response<IApiResponse<{
  user: IUser
}>>) => {
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

  res.status(200).json(successResponse({ user: userResponse }, 'Email verified successfully'));
});

export const resendVerification = asyncHandler(async (req: Request, res: Response<IApiResponse<null>>) => {
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
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

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

export const resendVerificationForLogin = asyncHandler(async (req: Request, res: Response<IApiResponse<null>>) => {
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
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

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
