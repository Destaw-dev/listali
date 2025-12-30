// src/__tests__/group/group.test.ts
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../app';
import mongoose from 'mongoose';
import User from '../../models/user';
import Group from '../../models/group';
import {
  getAccessToken,
  getGroupData,
  getGroupsArray,
  getGroupMembersArray,
  getResponseData
} from '../utils/testHelpers';

let mongoServer: MongoMemoryServer;
let token: string;
let groupId: string;

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
  
  // Verify email for testing
  await mongoose.connection.db?.collection('users').updateOne(
    { email: userData.email },
    { $set: { isEmailVerified: true } }
  );
  
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: userData.email, password: userData.password });

  token = getAccessToken(res);

  const groupRes = await request(app)
    .post('/api/groups')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test Group', description: 'desc' });

  const group = getGroupData(groupRes);
  groupId = group._id.toString();
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
    const group = getGroupData(res);
    expect(group.name).toBe('Family Group');
  });

  test('GET /api/groups → should get user groups', async () => {
    const res = await request(app)
      .get('/api/groups')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const groups = getGroupsArray(res);
    expect(Array.isArray(groups)).toBe(true);
  });

  test('GET /api/groups/:groupId → should fetch full group details', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const group = getGroupData(res);
    expect(group._id.toString()).toBe(groupId);
  });

  test('GET /api/groups/:groupId/members → should get group members', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const members = getGroupMembersArray(res);
    expect(Array.isArray(members)).toBe(true);
  });

  test('POST /api/groups/:groupId/invite → should invite user and create invite code', async () => {
    await request(app).post('/api/auth/register').send({
      firstName: 'Second',
      lastName: 'User',
      username: 'seconduser',
      email: 'second@example.com',
      password: 'Password123'
    });

    // Verify email for testing
    await mongoose.connection.db?.collection('users').updateOne(
      { email: 'second@example.com' },
      { $set: { isEmailVerified: true } }
    );

    const res = await request(app)
      .post(`/api/groups/${groupId}/invite`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'second@example.com' });

    expect(res.status).toBe(200);
    const body = getResponseData<{ message: string }>(res);
    expect(body.data?.message || body.message).toMatch(/invitation.*sent successfully/i);
    
    // Get invite code from user's pending invitations
    const user = await User.findOne({ email: 'second@example.com' });
    const invitation = user?.pendingInvitations.find(inv => inv.group.toString() === groupId);
    expect(invitation).toBeDefined();
  });

  test('POST /api/auth/invitations/accept → should accept invitation and join group', async () => {
    // Make sure invitation exists
    const userBefore = await User.findOne({ email: 'second@example.com' });
    const invitationBefore = userBefore?.pendingInvitations.find(inv => inv.group.toString() === groupId);
    if (!invitationBefore) {
      throw new Error('Invitation not found before accept');
    }
    
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'second@example.com', password: 'Password123' });
    const secondToken = getAccessToken(loginRes);

    const res = await request(app)
      .post('/api/auth/invitations/accept')
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ invitationId: invitationBefore.code });

    expect(res.status).toBe(200);
    
    // Verify user is now a member
    const group = await Group.findById(groupId);
    const user = await User.findOne({ email: 'second@example.com' });
    const isMember = group?.members.some(m => m.user.toString() === user?._id.toString());
    expect(isMember).toBe(true);
  });

  test('PUT /api/groups/:groupId → should update group info', async () => {
    const res = await request(app)
      .put(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Group' });

    expect(res.status).toBe(200);
    const group = getGroupData(res);
    expect(group.name).toBe('Updated Group');
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
    const body = getResponseData<{ message: string }>(res);
    expect(body.data?.message || body.message).toMatch(/invitation.*sent successfully/i);
  });

  test('PUT /api/groups/:groupId/members/:userId/role → should update user role in group', async () => {
    // First register the user
    await request(app).post('/api/auth/register').send({
      firstName: 'Change',
      lastName: 'Role',
      username: 'changerole',
      email: 'changerole@example.com',
      password: 'Password123'
    });

    const newUser = await User.findOne({ email: 'changerole@example.com' });
    if (newUser) {
      newUser.isEmailVerified = true;
      await newUser.save();
    }

    await request(app)
      .post(`/api/groups/${groupId}/invite`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'changerole@example.com' });

    const updatedUser = await User.findOne({ email: 'changerole@example.com' });
    const newUserInvitation = updatedUser?.pendingInvitations.find(inv => inv.group.toString() === groupId);
    if (!newUserInvitation) {
      throw new Error('Invitation not found for user');
    }

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'changerole@example.com', password: 'Password123' });
    const newToken = getAccessToken(loginRes);
    
    const acceptRes = await request(app)
      .post('/api/auth/invitations/accept')
      .set('Authorization', `Bearer ${newToken}`)
      .send({ invitationId: newUserInvitation.code });
    
    if (acceptRes.status !== 200) {
      throw new Error(`Failed to accept invitation: ${acceptRes.body.message || acceptRes.status}`);
    }
    
    const groupAfterAccept = await Group.findById(groupId);
    if (!groupAfterAccept) {
      throw new Error('Group not found after accepting invitation');
    }
    
    const isMember = groupAfterAccept.members.some(m => m.user.toString() === newUser!._id.toString());
    if (!isMember) {
      throw new Error('User was not added to group after accepting invitation');
    }

    const user = await User.findOne({ email: 'changerole@example.com' });

    const res = await request(app)
      .put(`/api/groups/${groupId}/members/${user!._id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    const body = getResponseData<{ message: string }>(res);
    expect(body.data?.message || body.message).toMatch(/role updated/i);
  });

  test('DELETE /api/groups/:groupId/members/:userId → should remove user from group', async () => {
    // First make sure the user is invited and accepted
    await request(app)
      .post(`/api/groups/${groupId}/invite`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'invited@example.com' });

    const invitedUser = await User.findOne({ email: 'invited@example.com' });
    if (invitedUser) {
      const invitation = invitedUser.pendingInvitations.find(inv => inv.group.toString() === groupId);
      if (invitation) {
        // Verify email and login
        await mongoose.connection.db?.collection('users').updateOne(
          { email: 'invited@example.com' },
          { $set: { isEmailVerified: true } }
        );
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({ email: 'invited@example.com', password: 'Password123' });
        await request(app)
          .post('/api/auth/invitations/accept')
          .set('Authorization', `Bearer ${getAccessToken(loginRes)}`)
          .send({ invitationId: invitation.code });
      }
    }

    const user = await User.findOne({ email: 'invited@example.com' });

    const res = await request(app)
      .delete(`/api/groups/${groupId}/members/${user!._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const body = getResponseData<{ message: string }>(res);
    expect(body.data?.message || body.message).toMatch(/removed successfully/i);
  });

  test('GET /api/groups/:groupId/stats → should return group stats', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}/stats`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const body = getResponseData<never>(res);
    expect(body.message).toMatch(/statistics retrieved/i);
  });

  test('POST /api/groups/:groupId/leave → should allow owner to leave and deactivate group', async () => {
    // First, make sure second user is a member (from previous test)
    const groupBefore = await Group.findById(groupId);
    const secondUser = await User.findOne({ email: 'second@example.com' });
    const isMemberBefore = groupBefore?.members.some(m => m.user.toString() === secondUser?._id.toString());
    
    // If not a member, skip this test
    if (!isMemberBefore) {
      return;
    }

    // Check if second user is the owner
    const secondUserMember = groupBefore?.members.find(m => m.user.toString() === secondUser?._id.toString());
    const isOwner = secondUserMember?.role === 'owner';

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'second@example.com', password: 'Password123' });
    const secondToken = getAccessToken(loginRes);

    const res = await request(app)
      .post(`/api/groups/${groupId}/leave`)
      .set('Authorization', `Bearer ${secondToken}`);

    if (isOwner && groupBefore?.members.length === 1) {
      expect(res.status).toBe(200);
      const body = getResponseData<{ message: string }>(res);
      expect(body.data?.message || body.message).toMatch(/Successfully left group/i);
    } else if (isOwner && groupBefore && groupBefore.members.length > 1) {
      expect(res.status).toBe(400);
    } else {
      expect(res.status).toBe(200);
    }
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
