import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { IApiResponse, IAuthResponse, IUser } from '../../types';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 30000); // 30 second timeout for MongoDB binary download

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
  password: 'Password123'
};

const verifyUserEmail = async (email: string) => {
  await mongoose.connection.db?.collection('users').updateOne(
    { email },
    { $set: { isEmailVerified: true } }
  );
};


describe('🔐 Auth API', () => {
  test('POST /api/auth/register → should register new user', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(201);
    const body = res.body as IApiResponse<IAuthResponse>;
    expect(body.data).toBeDefined();
    expect(body.data?.accessToken).toBeDefined();
    expect(body.data?.user.email).toBe(user.email);
  });

  test('POST /api/auth/register → duplicate email should fail', async () => {
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(400);
    const body = res.body as IApiResponse<never>;
    expect(body.message).toMatch(/already registered|already exists/i);
  });

  test('POST /api/auth/login → should login successfully', async () => {
    await request(app).post('/api/auth/register').send(user);
    await verifyUserEmail(user.email);
    
    const res = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password
    });
    expect(res.status).toBe(200);
    const body = res.body as IApiResponse<IAuthResponse>;
    expect(body.data).toBeDefined();
    expect(body.data?.accessToken).toBeDefined();
  });

  test('GET /api/auth/me → should return current user', async () => {
    await request(app).post('/api/auth/register').send(user);
    await verifyUserEmail(user.email);
    
    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password
    });
    const loginBody = loginRes.body as IApiResponse<IAuthResponse>;
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginBody.data?.accessToken || ''}`);
    expect(res.status).toBe(200);
    const body = res.body as IApiResponse<Omit<IUser, 'password' | 'refreshSessions'>>;
    expect(body.data?.email).toBe(user.email);
  });

  test('PUT /api/auth/profile → should update user profile', async () => {
    await request(app).post('/api/auth/register').send(user);
    await verifyUserEmail(user.email);
    
    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password
    });
    const loginBody = loginRes.body as IApiResponse<IAuthResponse>;

    const res = await request(app)
    .put('/api/auth/profile')
    .set('Authorization', `Bearer ${loginBody.data?.accessToken || ''}`)
    .send({ username: 'UpdatedName' });
    expect(res.status).toBe(200);
    const body = res.body as IApiResponse<Omit<IUser, 'password' | 'refreshSessions'>>;
    expect(body.data?.username).toBe('UpdatedName');
  });

  test('PUT /api/auth/password → should change user password', async () => {
    await request(app).post('/api/auth/register').send(user);
    await verifyUserEmail(user.email);
    
    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password
    });
    const loginBody = loginRes.body as IApiResponse<IAuthResponse>;

    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${loginBody.data?.accessToken || ''}`)
      .send({
        currentPassword: user.password,
        newPassword: 'NewPassword123'
      });

    expect(res.status).toBe(200);
    const body = res.body as IApiResponse<void>;
    expect(body.message).toMatch(/updated/i);

    // Confirm login with new password works
    const loginRes2 = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'NewPassword123'
    });
    expect(loginRes2.status).toBe(200);
  });

  test('POST /api/auth/logout → should clear the auth cookie', async () => {
    await request(app).post('/api/auth/register').send(user);
    await verifyUserEmail(user.email);
    
    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password
    });
    const loginBody = loginRes.body as IApiResponse<IAuthResponse>;

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${loginBody.data?.accessToken || ''}`);
    expect(res.status).toBe(200);
    const body = res.body as IApiResponse<void>;
    expect(body.message).toMatch(/Logout successful/i);
  });

  test('POST /api/auth/refresh → should return new accessToken', async () => {
    await request(app).post('/api/auth/register').send(user);
    await verifyUserEmail(user.email);
    
    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password
    });

    // Get cookies from login response
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

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshTokenValue}`, `sessionId=${sessionIdValue}`]);

    expect(res.status).toBe(200);
    const body = res.body as IApiResponse<{ accessToken: string }>;
    expect(body.data?.accessToken).toBeDefined();
  });

  test('GET /api/auth/check-username/:username → check if username is taken', async () => {
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).get(`/api/auth/check-username/${user.username}`);
    expect(res.status).toBe(200);
    const body = res.body as IApiResponse<{ available: boolean }>;
    expect(body.data).toBeDefined();
    expect(body.data?.available).toBe(false);
  });

  test('GET /api/auth/check-email/:email → check if email is taken', async () => {
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).get(`/api/auth/check-email/${user.email}`);
    expect(res.status).toBe(200);
    const body = res.body as IApiResponse<{ available: boolean }>;
    expect(body.data).toBeDefined();
    expect(body.data?.available).toBe(false);
  });
});
