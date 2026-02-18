import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { AppError } from './handlers';

const CSRF_COOKIE_NAME = 'csrfToken';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.COOKIE_DOMAIN;

  const options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'none' | 'lax';
    path: string;
    domain?: string;
  } = {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };

  if (isProduction && cookieDomain) {
    options.domain = cookieDomain;
  }

  return options;
};

export const getOrCreateCsrfToken = (req: Request, res: Response): string => {
  const existingToken = req.cookies[CSRF_COOKIE_NAME];
  if (typeof existingToken === 'string' && existingToken.length >= 32) {
    return existingToken;
  }

  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, token, getCookieOptions());
  return token;
};

export const attachCsrfCookie = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  getOrCreateCsrfToken(req, res);
  next();
};

export const csrfProtection = (req: Request, _res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (typeof cookieToken !== 'string' || typeof headerToken !== 'string') {
    throw new AppError('Invalid CSRF token', 403);
  }

  const cookieBuffer = Buffer.from(cookieToken, 'utf8');
  const headerBuffer = Buffer.from(headerToken, 'utf8');

  if (cookieBuffer.length !== headerBuffer.length) {
    throw new AppError('Invalid CSRF token', 403);
  }

  if (!crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
    throw new AppError('Invalid CSRF token', 403);
  }

  next();
};
