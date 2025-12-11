// tests/auth/auth.test.ts

import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
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

let token: string;

describe('🔐 Auth API', () => {
  test('POST /api/auth/register → should register new user', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe(user.email);
  });

  test('POST /api/auth/register → duplicate email should fail', async () => {
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('POST /api/auth/login → should login successfully', async () => {
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    token = res.body.data.token;
  });

  test('GET /api/auth/me → should return current user', async () => {
    await request(app).post('/api/auth/register').send(user);
    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password
    });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(user.email);
  });

  test('PUT /api/auth/profile → should update user profile', async () => {
    await request(app).post('/api/auth/register').send(user);
    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password
    });

    
    const res = await request(app)
    .put('/api/auth/profile')
    .set('Authorization', `Bearer ${loginRes.body.data.token}`)
    .send({ username: 'UpdatedName' });
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('UpdatedName');
  });

  test('PUT /api/auth/password → should change user password', async () => {
    await request(app).post('/api/auth/register').send(user);
    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password
    });

    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`)
      .send({
        currentPassword: user.password,
        newPassword: 'NewPassword123'
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);

    // Confirm login with new password works
    const loginRes2 = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'NewPassword123'
    });
    expect(loginRes2.status).toBe(200);
  });

  test('POST /api/auth/logout → should clear the auth cookie', async () => {
    await request(app).post('/api/auth/register').send(user);
    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password
    });

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Logout successful/i);
  });

  test('POST /api/auth/refresh → should return new token', async () => {
    await request(app).post('/api/auth/register').send(user);
    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
  });

  test('GET /api/auth/check-username/:username → check if username is taken', async () => {
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).get(`/api/auth/check-username/${user.username}`);
    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(false);
  });

  test('GET /api/auth/check-email/:email → check if email is taken', async () => {
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).get(`/api/auth/check-email/${user.email}`);
    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(false);
  });
});
