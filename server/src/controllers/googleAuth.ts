import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import axios from 'axios';
import User from '@/models/user';
import jwt from 'jsonwebtoken';
import { Response, Request } from 'express';
import { successResponse } from '@/middleware/errorHandler';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req: Request, res: Response) => {
  const { credential } = req.body; // token מ-Google
  if (!credential) {
    return res.status(400).json({ success: false, error: 'Missing Google credential' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
if (!clientId) {
  throw new Error("Missing GOOGLE_CLIENT_ID in environment variables");
}

const ticket = await client.verifyIdToken({
  idToken: credential,
  audience: clientId // now it's guaranteed to be string
});

  const payload = ticket.getPayload();
  if (!payload || !payload.email || !payload.sub) {
    return res.status(401).json({ success: false, error: 'Invalid Google token' });
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

  const token = user.getSignedJwtToken();
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  return res.status(200).json(successResponse({ user, token }, 'Login with Google successful'));
};

export const googleCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing Google code' });
  }

  try {
    const client_id = process.env.GOOGLE_CLIENT_ID!;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirect_uri = process.env.GOOGLE_REDIRECT_URI!;

    // 1. Exchange code for token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: 'authorization_code'
      }
    });

    const { id_token, access_token } = tokenResponse.data;

    // 2. Verify the ID token and get user info
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: client_id
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return res.status(401).json({ success: false, message: 'Invalid Google payload' });
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
        isEmailVerified: true, // Google users are automatically verified
      });
    }

    const token = user.getSignedJwtToken();
    
    // Set cookie for server-side auth
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Get the frontend callback URL from state parameter
    const frontendCallback = state ? decodeURIComponent(state as string) : `${process.env.CLIENT_URL}/he/auth/callback`;
    
    // Prepare user data for frontend
    const userData = {
      _id: user._id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      googleId: user.googleId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Redirect to frontend with token and user data
    const redirectUrl = new URL(frontendCallback);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify(userData)));
    redirectUrl.searchParams.set('google', 'true');

    return res.redirect(redirectUrl.toString());

  } catch (err: any) {
    console.error('Google login failed:', err.response?.data || err.message);
    return res.status(500).json({ success: false, message: 'Google login failed' });
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

    const authUrlOptions: any = {
      access_type: 'offline',
      prompt: 'consent',
      scope: ['profile', 'email', 'openid']
    };

    if (callback) {
      authUrlOptions.state = encodeURIComponent(callback as string);
    }

    const url = client.generateAuthUrl(authUrlOptions);

    res.json({ success: true, url });
  } catch (error: any) {
    console.error('Error generating Google URL:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Google URL' });
  }
}



