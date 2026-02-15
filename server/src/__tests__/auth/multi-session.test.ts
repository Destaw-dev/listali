
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../../models/user';
import {
  getAuthResponse,
  getAccessToken,
  getRefreshToken,
  getSessionId,
  getRefreshTokenCookie,
  getSessionIdCookie,
  getCookieValue,
  getUserData,
  getCookies
} from '../utils/testHelpers';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'test'
    }
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  const db = mongoose.connection.db;
  if (!db) return;

  const collections = await db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

const user = {
  firstName: 'test',
  lastName: 'user',
  username: 'testuser',
  email: 'test@example.com',
  password: 'NewPasswordSafe123!'
};

const verifyUserEmail = async (email: string) => {
  await mongoose.connection.db?.collection('users').updateOne(
    { email },
    { $set: { isEmailVerified: true } }
  );
};

describe('🔐 Multi-Session Auth API', () => {
  describe('WEB Flow', () => {
    test('POST /api/auth/login → should set HttpOnly cookies (refreshToken, sessionId) and return accessToken', async () => {
      await request(app).post('/api/auth/register').send(user);
      
      await mongoose.connection.db?.collection('users').updateOne(
        { email: user.email },
        { $set: { isEmailVerified: true } }
      );
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: user.password
        });

      expect(res.status).toBe(200);
      const authData = getAuthResponse(res);
      expect(authData.accessToken).toBeDefined();
      expect(authData).not.toHaveProperty('token');
      expect(authData).not.toHaveProperty('refreshToken');
      expect(authData).not.toHaveProperty('sessionId');
      
      const refreshTokenCookie = getCookieValue(res, 'refreshToken');
      const sessionIdCookie = getCookieValue(res, 'sessionId');
      expect(refreshTokenCookie).toBeDefined();
      expect(sessionIdCookie).toBeDefined();
      const cookies = getCookies(res);
      const refreshTokenCookieFull = cookies.find((c: string) => c.startsWith('refreshToken='));
      const sessionIdCookieFull = cookies.find((c: string) => c.startsWith('sessionId='));
      if (refreshTokenCookieFull && sessionIdCookieFull) {
        expect(refreshTokenCookieFull).toContain('HttpOnly');
        expect(sessionIdCookieFull).toContain('HttpOnly');
      }
    });

    test('GET /api/auth/me → should work with Bearer accessToken', async () => {
      await request(app).post('/api/auth/register').send(user);
      await verifyUserEmail(user.email);
      
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: user.password
        });

      const accessToken = getAccessToken(loginRes);
      
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      const userData = getUserData(res);
      expect(userData.email).toBe(user.email);
    });

    test('POST /api/auth/refresh → should refresh tokens and rotate refreshToken cookie', async () => {
      await request(app).post('/api/auth/register').send(user);
      await verifyUserEmail(user.email);
      
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: user.password
        });

      const cookies = loginRes.headers['set-cookie'];
      const cookiesArray: string[] = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
      const refreshTokenCookie = cookiesArray.find((c: string) => c.startsWith('refreshToken='));
      const sessionIdCookie = cookiesArray.find((c: string) => c.startsWith('sessionId='));
      
      expect(refreshTokenCookie).toBeDefined();
      expect(sessionIdCookie).toBeDefined();
      
      if (!refreshTokenCookie || !sessionIdCookie) {
        throw new Error('Cookies not found');
      }
      const refreshTokenParts = refreshTokenCookie.split(';')[0]?.split('=');
      const sessionIdParts = sessionIdCookie.split(';')[0]?.split('=');
      if (!refreshTokenParts || !sessionIdParts || !refreshTokenParts[1] || !sessionIdParts[1]) {
        throw new Error('Invalid cookie format');
      }
      const refreshTokenValue = refreshTokenParts[1];
      const sessionIdValue = sessionIdParts[1];

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshTokenValue}`, `sessionId=${sessionIdValue}`]);

      expect(refreshRes.status).toBe(200);
      const refreshData = getAuthResponse(refreshRes);
      expect(refreshData.accessToken).toBeDefined();
      expect(refreshData).not.toHaveProperty('refreshToken');
      
      const newRefreshTokenValue = getRefreshTokenCookie(refreshRes);
      expect(newRefreshTokenValue).not.toBe(refreshTokenValue);
    });

    test('POST /api/auth/logout → should clear cookies and revoke session', async () => {
      await request(app).post('/api/auth/register').send(user);
      await verifyUserEmail(user.email);
      
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: user.password
        });

      const refreshTokenValue = getRefreshTokenCookie(loginRes);
      const sessionIdValue = getSessionIdCookie(loginRes);

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [`refreshToken=${refreshTokenValue}`, `sessionId=${sessionIdValue}`]);

      expect(logoutRes.status).toBe(200);
      
      const clearedRefreshCookie = getCookieValue(logoutRes, 'refreshToken');
      const clearedSessionCookie = getCookieValue(logoutRes, 'sessionId');
      expect(clearedRefreshCookie).toBeDefined();
      expect(clearedSessionCookie).toBeDefined();
      const logoutCookies = getCookies(logoutRes);
      const clearedRefreshCookieFull = logoutCookies.find((c: string) => c.startsWith('refreshToken='));
      const clearedSessionCookieFull = logoutCookies.find((c: string) => c.startsWith('sessionId='));
      if (clearedRefreshCookieFull && clearedSessionCookieFull) {
        expect(clearedRefreshCookieFull.toLowerCase()).toContain('expires=');
        expect(clearedSessionCookieFull.toLowerCase()).toContain('expires=');
      }

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshTokenValue}`, `sessionId=${sessionIdValue}`]);

      expect(refreshRes.status).toBe(401);
    });
  });

  describe('MOBILE Flow', () => {
    test('POST /api/auth/login with x-client=mobile → should return accessToken, refreshToken, sessionId (NO cookies)', async () => {
      await request(app).post('/api/auth/register').send(user);
      await verifyUserEmail(user.email);
      
      const res = await request(app)
        .post('/api/auth/login')
        .set('x-client', 'mobile')
        .send({
          email: user.email,
          password: user.password
        });

      expect(res.status).toBe(200);
      const authData = getAuthResponse(res);
      expect(authData.accessToken).toBeDefined();
      expect(authData.refreshToken).toBeDefined();
      expect(authData.sessionId).toBeDefined();
      
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeUndefined();
    });

    test('POST /api/auth/refresh with body → should return rotated refreshToken + new accessToken', async () => {
      await request(app).post('/api/auth/register').send(user);
      await verifyUserEmail(user.email);
      
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('x-client', 'mobile')
        .send({
          email: user.email,
          password: user.password
        });

      const authData = getAuthResponse(loginRes);
      const refreshToken = authData.refreshToken;
      const sessionId = authData.sessionId;
      if (!refreshToken || !sessionId) {
        throw new Error('Refresh token or session ID not found');
      }

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('x-client', 'mobile')
        .send({
          refreshToken,
          sessionId
        });

      expect(refreshRes.status).toBe(200);
      const refreshData = getAuthResponse(refreshRes);
      expect(refreshData.accessToken).toBeDefined();
      expect(refreshData.refreshToken).toBeDefined();
      expect(refreshData.sessionId).toBeDefined();
      if (refreshData.refreshToken && refreshData.sessionId) {
        expect(refreshData.refreshToken).not.toBe(refreshToken);
        expect(refreshData.sessionId).toBe(sessionId);
      }
    });

    test('POST /api/auth/logout with sessionId → should revoke session', async () => {
      await request(app).post('/api/auth/register').send(user);
      await verifyUserEmail(user.email);
      
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('x-client', 'mobile')
        .send({
          email: user.email,
          password: user.password
        });

      const sessionId = getSessionId(loginRes);

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('x-client', 'mobile')
        .send({ sessionId });

      expect(logoutRes.status).toBe(200);

      const oldRefreshToken = getRefreshToken(loginRes);
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('x-client', 'mobile')
        .send({
          refreshToken: oldRefreshToken,
          sessionId
        });

      expect(refreshRes.status).toBe(401);
    });
  });

  describe('Device Limit (MAX 5 sessions)', () => {
    test('Login 6 times → should keep only 5 sessions, oldest removed', async () => {
      await request(app).post('/api/auth/register').send(user);
      await verifyUserEmail(user.email);
      
      const sessionIds: string[] = [];
      const refreshTokens: string[] = [];

      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .set('x-client', 'mobile')
          .send({
            email: user.email,
            password: user.password
          });

        const authData = getAuthResponse(res);
        if (authData.sessionId && authData.refreshToken) {
          sessionIds.push(authData.sessionId);
          refreshTokens.push(authData.refreshToken);
        }
      }

      const dbUser = await User.findOne({ email: user.email });
      expect(dbUser).toBeDefined();
      expect(dbUser!.refreshSessions.length).toBe(5);

      const firstSessionId = sessionIds[0];
      const firstRefreshToken = refreshTokens[0];

      const sixthRes = await request(app)
        .post('/api/auth/login')
        .set('x-client', 'mobile')
        .send({
          email: user.email,
          password: user.password
        });

      const dbUserAfter = await User.findOne({ email: user.email });
      expect(dbUserAfter!.refreshSessions.length).toBe(5);

      const firstSessionStillExists = dbUserAfter!.refreshSessions.some(
        s => s.sessionId === firstSessionId
      );
      expect(firstSessionStillExists).toBe(false);

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('x-client', 'mobile')
        .send({
          refreshToken: firstRefreshToken,
          sessionId: firstSessionId
        });

      expect(refreshRes.status).toBe(401);

      const latestRefreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('x-client', 'mobile')
        .send({
          refreshToken: getRefreshToken(sixthRes),
          sessionId: getSessionId(sixthRes)
        });

      expect(latestRefreshRes.status).toBe(200);
    });
  });

  describe('Token Rotation', () => {
    test('Refresh token should rotate on each refresh', async () => {
      await request(app).post('/api/auth/register').send(user);
      await verifyUserEmail(user.email);
      
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('x-client', 'mobile')
        .send({
          email: user.email,
          password: user.password
        });

      const authData = getAuthResponse(loginRes);
      const initialRefreshToken = authData.refreshToken;
      const sessionId = authData.sessionId;
      if (!initialRefreshToken || !sessionId) {
        throw new Error('Refresh token or session ID not found');
      }

      const refresh1Res = await request(app)
        .post('/api/auth/refresh')
        .set('x-client', 'mobile')
        .send({
          refreshToken: initialRefreshToken,
          sessionId
        });

      expect(refresh1Res.status).toBe(200);
      const refresh1Data = getAuthResponse(refresh1Res);
      const refreshToken1 = refresh1Data.refreshToken;
      if (!refreshToken1) {
        throw new Error('Refresh token not found in response');
      }
      expect(refreshToken1).not.toBe(initialRefreshToken);

      const refresh2Res = await request(app)
        .post('/api/auth/refresh')
        .set('x-client', 'mobile')
        .send({
          refreshToken: refreshToken1,
          sessionId
        });

      expect(refresh2Res.status).toBe(200);
      const refresh2Data = getAuthResponse(refresh2Res);
      const refreshToken2 = refresh2Data.refreshToken;
      if (!refreshToken2) {
        throw new Error('Refresh token not found in response');
      }
      expect(refreshToken2).not.toBe(refreshToken1);

      const oldTokenRes = await request(app)
        .post('/api/auth/refresh')
        .set('x-client', 'mobile')
        .send({
          refreshToken: initialRefreshToken,
          sessionId
        });

      expect(oldTokenRes.status).toBe(401);
    });
  });

  describe('Error Cases', () => {
    test('POST /api/auth/refresh without token → should return 401', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(res.status).toBe(401);
    });

    test('POST /api/auth/refresh with invalid token → should return 401', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('x-client', 'mobile')
        .send({
          refreshToken: 'invalid-token',
          sessionId: 'invalid-session'
        });

      expect(res.status).toBe(401);
    });

    test('POST /api/auth/refresh with expired token → should return 401', async () => {
      await request(app).post('/api/auth/register').send(user);
      await verifyUserEmail(user.email);
      
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('x-client', 'mobile')
        .send({
          email: user.email,
          password: user.password
        });

      const dbUser = await User.findOne({ email: user.email });
      dbUser!.revokeSession(getSessionId(loginRes));
      await dbUser!.save();

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('x-client', 'mobile')
        .send({
          refreshToken: getRefreshToken(loginRes),
          sessionId: getSessionId(loginRes)
        });

      expect(refreshRes.status).toBe(401);
    });
  });
});

