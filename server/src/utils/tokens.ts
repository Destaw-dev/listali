import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';


export const signAccessToken = (userId: string): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not configured');
  }

  const payload = {
    sub: userId,
  };

  const expireMinutes = parseInt(process.env.JWT_ACCESS_EXPIRE_MINUTES || '15', 10);
  const options: SignOptions = {
    expiresIn: `${expireMinutes}m`,
    issuer: 'smart-group-shopping',
    audience: 'smart-group-shopping-users',
  };

  return jwt.sign(payload, secret, options);
};

export const signRefreshToken = (userId: string, sessionId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }

  const payload = {
    sub: userId,
    sid: sessionId,
    rnd: Math.random().toString(36).substring(2, 15),
  };

  const expireDays = parseInt(process.env.JWT_REFRESH_EXPIRE_DAYS || '30', 10);
  const options: SignOptions = {
    expiresIn: `${expireDays}d`,
    issuer: 'smart-group-shopping',
    audience: 'smart-group-shopping-users',
  };

  return jwt.sign(payload, secret, options);
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const verifyAccessToken = (token: string): { sub: string } => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not configured');
  }

  try {
    const decoded = jwt.verify(token, secret) as { sub: string };
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw error;
  }
};

export const verifyRefreshToken = (token: string): { sub: string; sid: string } => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }

  try {
    const decoded = jwt.verify(token, secret) as { sub: string; sid: string };
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

