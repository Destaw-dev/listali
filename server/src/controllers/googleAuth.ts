import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import axios from 'axios';
import crypto from 'crypto';
import User from '../models/user';
import { Response, Request } from 'express';
import { errorResponse, successResponse } from '../middleware/handlers';
import { IBasePendingInvite, IGroupMember } from '../types';
import { signAccessToken, signRefreshToken, hashToken } from '../utils/tokens';
import { isMobileClient, setRefreshTokenCookies } from './auth';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req: Request, res: Response) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json(errorResponse('Missing Google credential', 400, 'Missing Google credential'));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
if (!clientId) {
  throw new Error("Missing GOOGLE_CLIENT_ID in environment variables");
}

const ticket = await client.verifyIdToken({
  idToken: credential,
  audience: clientId,
  maxExpiry: 300000
});

  const payload = ticket.getPayload();
  if (!payload || !payload.email || !payload.sub) {
    return res.status(401).json(errorResponse('Invalid Google token', 401, 'Invalid Google token'));
  }

  const { email, name, picture, given_name, family_name, sub } = payload;

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      username: email.split('@')[0],
      firstName: given_name || name?.split(' ')[0] || email.split('@')[0],
      lastName: family_name || name?.split(' ')[1] || '',
      googleId: sub,
      avatar: picture,
      isEmailVerified: true,
    });
  }

  if(!user.isEmailVerified) {
    user.isEmailVerified = true;
    await user.save();
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

  const isMobile = isMobileClient(req);
  
  if (!isMobile) {
    setRefreshTokenCookies(res, refreshToken, sessionId);
  }

  const userResponse = user.toObject();
  const { password: _password } = userResponse;

  return res.status(200).json(successResponse({ 
    user: userResponse, 
    accessToken,
    ...(isMobile && { refreshToken, sessionId })
  }, 'Login with Google successful'));
};

export const googleCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json(errorResponse('Missing Google code', 400, 'Missing Google code'));
  }

  try {
    const client_id = process.env.GOOGLE_CLIENT_ID!;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirect_uri = process.env.GOOGLE_REDIRECT_URI!;

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: 'authorization_code'
      }
    });

    const { id_token } = tokenResponse.data;

    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: client_id,
      maxExpiry: 300000
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return res.status(401).json(errorResponse('Invalid Google payload', 401, 'Invalid Google payload'));
    }

    const { email, name, picture, given_name, family_name, sub } = payload;

    let user = await User.findOne({ email });
    const isNewUser = !user;
    
    if (!user) {
      user = await User.create({
        email,
        username: email.split('@')[0],
        firstName: given_name || name?.split(' ')[0] || email.split('@')[0],
        lastName: family_name || name?.split(' ')[1] || '',
        googleId: sub,
        avatar: picture,
        isEmailVerified: true,
      });
    }
    if(!user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
    }

    let groupJoined = null;
    let inviteError = null;
    if (isNewUser && state) {
      try {
        const frontendCallback = decodeURIComponent(state as string);
        const callbackUrl = new URL(frontendCallback);
        const inviteCode = callbackUrl.searchParams.get('inviteCode');

        if (inviteCode) {
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

    const isMobile = isMobileClient(req);
    
    if (!isMobile) {
      setRefreshTokenCookies(res, refreshToken, sessionId);
    }

    const frontendCallback = state ? decodeURIComponent(state as string) : `${process.env.CLIENT_URL}/he/auth/callback`;
    
    const userData = {
      _id: user._id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      googleId: user.googleId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isEmailVerified: user.isEmailVerified,
    };

    const redirectUrl = new URL(frontendCallback);
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify(userData)));
    redirectUrl.searchParams.set('google', 'true');
    if (groupJoined) {
      redirectUrl.searchParams.set('groupJoined', groupJoined);
    }
    if (inviteError) {
      redirectUrl.searchParams.set('inviteError', encodeURIComponent(inviteError));
    }

    return res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('Google login failed:', error instanceof Error ? error.message : 'Failed to login with Google');
    return res.status(500).json(errorResponse('Google login failed', 500, error instanceof Error ? error.message : 'Failed to login with Google'));
  }
};



export const googleUrl = async (req: Request, res: Response) => {
  try {
    const { callback } = req.query;
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const authUrlOptions: {
      access_type: 'offline';
      prompt: 'consent';
      scope: string[];
      state?: string;
    } = {
      access_type: 'offline',
      prompt: 'consent',
      scope: ['profile', 'email', 'openid']
    };

    if (callback) {
      authUrlOptions.state = encodeURIComponent(callback as string);
    }

    const url = client.generateAuthUrl(authUrlOptions);

    return res.status(200).json(successResponse({ url }, 'Google URL generated successfully'));
  } catch (error) {
    console.error('Error generating Google URL:', error);
    return res.status(500).json(errorResponse('Failed to generate Google URL', 500, error instanceof Error ? error.message : 'Failed to generate Google URL'));
  }
};