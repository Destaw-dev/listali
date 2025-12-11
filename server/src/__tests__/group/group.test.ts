// src/__tests__/group/group.test.ts
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../app';
import mongoose from 'mongoose';
import User from '../../models/user';
import Group from '../../models/group';

let mongoServer: MongoMemoryServer;
let token: string;
let userId: string;
let groupId: string;
let inviteCode: string;

const userData = {
  firstName: 'test',
  lastName: 'user',
  username: 'testuser',
  email: 'test@example.com',
  password: 'Password123'
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  await request(app).post('/api/auth/register').send(userData);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: userData.email, password: userData.password });

  token = res.body.data.token;
  userId = res.body.data.user.id;

  const groupRes = await request(app)
    .post('/api/groups')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test Group', description: 'desc' });

  groupId = groupRes.body.data._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('👥 Group API', () => {
  test('POST /api/groups → should create a new group', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Family Group',
        description: 'Groceries and tasks',
        settings: { maxMembers: 5 }
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Family Group');
  });

  test('GET /api/groups → should get user groups', async () => {
    const res = await request(app)
      .get('/api/groups')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/groups/:groupId → should fetch full group details', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(groupId);
  });

  test('GET /api/groups/:groupId/members → should get group members', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /api/groups/:groupId/invite-code → should generate invite code', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/invite-code`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.inviteCode).toBeDefined();
    inviteCode = res.body.data.inviteCode;
  });

  test('POST /api/groups/join/:inviteCode → should join group by invite code', async () => {
    await request(app).post('/api/auth/register').send({
      firstName: 'Second',
      lastName: 'User',
      username: 'seconduser',
      email: 'second@example.com',
      password: 'Password123'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'second@example.com', password: 'Password123' });
    const secondToken = loginRes.body.data.token;

    const res = await request(app)
      .post(`/api/groups/join/${inviteCode}`)
      .set('Authorization', `Bearer ${secondToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.members.length).toBeGreaterThanOrEqual(2);
  });

  test('PUT /api/groups/:groupId → should update group info', async () => {
    const res = await request(app)
      .put(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Group' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Group');
  });

  test('POST /api/groups/:groupId/invite → should invite user to group', async () => {
    await request(app).post('/api/auth/register').send({
      firstName: 'Invited',
      lastName: 'User',
      username: 'inviteduser',
      email: 'invited@example.com',
      password: 'Password123'
    });

    const res = await request(app)
      .post(`/api/groups/${groupId}/invite`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'invited@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/invited successfully/i);
  });

  test('PUT /api/groups/:groupId/members/:userId/role → should update user role in group', async () => {
    const newUserRes = await request(app).post('/api/auth/register').send({
      firstName: 'Change',
      lastName: 'Role',
      username: 'changerole',
      email: 'changerole@example.com',
      password: 'Password123'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'changerole@example.com', password: 'Password123' });
    const newToken = loginRes.body.data.token;

    await request(app)
      .post(`/api/groups/join/${inviteCode}`)
      .set('Authorization', `Bearer ${newToken}`);

    const user = await User.findOne({ email: 'changerole@example.com' });

    const res = await request(app)
      .put(`/api/groups/${groupId}/members/${user!._id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/role updated/i);
  });

  test('DELETE /api/groups/:groupId/members/:userId → should remove user from group', async () => {
    const user = await User.findOne({ email: 'invited@example.com' });

    const res = await request(app)
      .delete(`/api/groups/${groupId}/members/${user!._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/removed successfully/i);
  });

  test('GET /api/groups/:groupId/stats → should return group stats', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/stats`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/statistics retrieved/i);
  });

  test('POST /api/groups/:groupId/leave → should allow owner to leave and deactivate group', async () => {

    const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'second@example.com', password: 'Password123' });
  const secondToken = loginRes.body.data.token;

    const res = await request(app)
      .post(`/api/groups/${groupId}/leave`)
      .set('Authorization', `Bearer ${secondToken}`);

    expect(res.status).toBe(200);
    const group = await Group.findById(groupId);
    expect(res.body.message).toMatch(/Successfully left group/i);
  });

  test('DELETE /api/groups/:groupId → should soft-delete the group', async () => {
    const res = await request(app)
      .delete(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const group = await Group.findById(groupId);
    expect(group?.isActive).toBe(false);
  });
});
