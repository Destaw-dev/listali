import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/handlers';
import {
  attachCsrfCookie,
  csrfProtection,
  getOrCreateCsrfToken,
} from '../../middleware/csrf';

type MockRequest = Partial<Request> & {
  method: string;
  headers: Record<string, string | undefined>;
  cookies: Record<string, string | undefined>;
};

type MockResponse = Partial<Response> & {
  cookie: jest.Mock;
};

const createReq = (overrides: Partial<MockRequest> = {}): Request =>
  ({
    method: 'POST',
    headers: {},
    cookies: {},
    ...overrides,
  }) as unknown as Request;

const createRes = (): Response =>
  ({
    cookie: jest.fn(),
  }) as unknown as Response;

describe('CSRF middleware', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCookieDomain = process.env.COOKIE_DOMAIN;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.COOKIE_DOMAIN = originalCookieDomain;
    jest.clearAllMocks();
  });

  describe('getOrCreateCsrfToken', () => {
    test('returns existing token when cookie already exists', () => {
      const req = createReq({
        cookies: { csrfToken: 'a'.repeat(32) },
      });
      const res = createRes();

      const token = getOrCreateCsrfToken(req, res);

      expect(token).toBe('a'.repeat(32));
      expect((res as unknown as MockResponse).cookie).not.toHaveBeenCalled();
    });

    test('creates and sets a token when cookie is missing', () => {
      process.env.NODE_ENV = 'development';

      const req = createReq();
      const res = createRes();

      const token = getOrCreateCsrfToken(req, res);

      expect(token).toHaveLength(64);
      expect((res as unknown as MockResponse).cookie).toHaveBeenCalledTimes(1);
      expect((res as unknown as MockResponse).cookie).toHaveBeenCalledWith(
        'csrfToken',
        token,
        expect.objectContaining({
          httpOnly: false,
          secure: false,
          sameSite: 'lax',
          path: '/',
        }),
      );
    });

    test('applies production cookie options including domain', () => {
      process.env.NODE_ENV = 'production';
      process.env.COOKIE_DOMAIN = '.example.com';

      const req = createReq();
      const res = createRes();

      const token = getOrCreateCsrfToken(req, res);

      expect((res as unknown as MockResponse).cookie).toHaveBeenCalledWith(
        'csrfToken',
        token,
        expect.objectContaining({
          secure: true,
          sameSite: 'none',
          domain: '.example.com',
        }),
      );
    });
  });

  describe('attachCsrfCookie', () => {
    test('skips in test environment', () => {
      process.env.NODE_ENV = 'test';

      const req = createReq();
      const res = createRes();
      const next: NextFunction = jest.fn();

      attachCsrfCookie(req, res, next);

      expect((res as unknown as MockResponse).cookie).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    });

    test('attaches csrf cookie for any client (mobile bypass removed)', () => {
      process.env.NODE_ENV = 'development';

      const req = createReq({
        headers: { 'x-client': 'mobile' },
      });
      const res = createRes();
      const next: NextFunction = jest.fn();

      attachCsrfCookie(req, res, next);

      expect((res as unknown as MockResponse).cookie).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(1);
    });

    test('attaches csrf cookie for web client', () => {
      process.env.NODE_ENV = 'development';

      const req = createReq();
      const res = createRes();
      const next: NextFunction = jest.fn();

      attachCsrfCookie(req, res, next);

      expect((res as unknown as MockResponse).cookie).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('csrfProtection', () => {
    test('skips safe methods', () => {
      process.env.NODE_ENV = 'development';

      const req = createReq({ method: 'GET' });
      const next: NextFunction = jest.fn();

      csrfProtection(req, createRes(), next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    test('enforces csrf for any client (mobile bypass removed)', () => {
      process.env.NODE_ENV = 'development';

      const req = createReq({
        method: 'POST',
        headers: { 'x-client': 'mobile' },
        cookies: {},
      });
      const next: NextFunction = jest.fn();

      expect(() => csrfProtection(req, createRes(), next)).toThrow('Invalid CSRF token');
      expect(next).not.toHaveBeenCalled();
    });

    test('throws when csrf token is missing', () => {
      process.env.NODE_ENV = 'development';

      const req = createReq({
        method: 'POST',
        cookies: {},
        headers: {},
      });

      expect(() => csrfProtection(req, createRes(), jest.fn())).toThrow(AppError);
      expect(() => csrfProtection(req, createRes(), jest.fn())).toThrow('Invalid CSRF token');
    });

    test('throws when csrf token lengths differ', () => {
      process.env.NODE_ENV = 'development';

      const req = createReq({
        method: 'POST',
        cookies: { csrfToken: 'abc123' },
        headers: { 'x-csrf-token': 'abc1234567' },
      });

      expect(() => csrfProtection(req, createRes(), jest.fn())).toThrow(AppError);
    });

    test('throws when csrf token value is invalid', () => {
      process.env.NODE_ENV = 'development';

      const req = createReq({
        method: 'POST',
        cookies: { csrfToken: 'abc123' },
        headers: { 'x-csrf-token': 'zzz999' },
      });

      expect(() => csrfProtection(req, createRes(), jest.fn())).toThrow(AppError);
    });

    test('passes when csrf cookie and header match', () => {
      process.env.NODE_ENV = 'development';

      const req = createReq({
        method: 'POST',
        cookies: { csrfToken: 'token123' },
        headers: { 'x-csrf-token': 'token123' },
      });
      const next: NextFunction = jest.fn();

      csrfProtection(req, createRes(), next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
