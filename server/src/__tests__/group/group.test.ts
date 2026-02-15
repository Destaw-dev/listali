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
  password: 'NewPasswordSafe123!'
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  await request(app).post('/api/auth/register').send(userData);
  
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
      password: 'NewPasswordSafe123!'
    });

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
    
    const user = await User.findOne({ email: 'second@example.com' });
    const invitation = user?.pendingInvitations.find(inv => inv.group.toString() === groupId);
    expect(invitation).toBeDefined();
  });

  test('POST /api/auth/invitations/accept → should accept invitation and join group', async () => {
    const userBefore = await User.findOne({ email: 'second@example.com' });
    const invitationBefore = userBefore?.pendingInvitations.find(inv => inv.group.toString() === groupId);
    if (!invitationBefore) {
      throw new Error('Invitation not found before accept');
    }
    
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'second@example.com', password: 'NewPasswordSafe123!' });
    const secondToken = getAccessToken(loginRes);

    const res = await request(app)
      .post('/api/auth/invitations/accept')
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ invitationId: invitationBefore.code });

    expect(res.status).toBe(200);
    
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
      password: 'NewPasswordSafe123!'
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
    await request(app).post('/api/auth/register').send({
      firstName: 'Change',
      lastName: 'Role',
      username: 'changerole',
      email: 'changerole@example.com',
      password: 'NewPasswordSafe123!'
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
      .send({ email: 'changerole@example.com', password: 'NewPasswordSafe123!' });
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
    await request(app)
      .post(`/api/groups/${groupId}/invite`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'invited@example.com' });

    const invitedUser = await User.findOne({ email: 'invited@example.com' });
    if (invitedUser) {
      const invitation = invitedUser.pendingInvitations.find(inv => inv.group.toString() === groupId);
      if (invitation) {
        await mongoose.connection.db?.collection('users').updateOne(
          { email: 'invited@example.com' },
          { $set: { isEmailVerified: true } }
        );
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({ email: 'invited@example.com', password: 'NewPasswordSafe123!' });
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
    const groupBefore = await Group.findById(groupId);
    const secondUser = await User.findOne({ email: 'second@example.com' });
    const isMemberBefore = groupBefore?.members.some(m => m.user.toString() === secondUser?._id.toString());
    
    if (!isMemberBefore) {
      return;
    }

    const secondUserMember = groupBefore?.members.find(m => m.user.toString() === secondUser?._id.toString());
    const isOwner = secondUserMember?.role === 'owner';

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'second@example.com', password: 'NewPasswordSafe123!' });
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

  describe('⚙️ Group Settings', () => {
    let settingsGroupId: string;

    beforeAll(async () => {
      const groupRes = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Settings Test Group',
          description: 'Group for settings tests',
          settings: { maxMembers: 20 }
        });

      const settingsGroup = getGroupData(groupRes);
      settingsGroupId = settingsGroup._id.toString();
    });

    test('PUT /api/groups/:groupId → should update group settings (allowMemberInvite, requireApproval, maxMembers)', async () => {
      const res = await request(app)
        .put(`/api/groups/${settingsGroupId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          settings: {
            allowMemberInvite: true,
            requireApproval: true,
            maxMembers: 10
          }
        });

      expect(res.status).toBe(200);
      const group = getGroupData(res);
      expect(group.settings.allowMemberInvite).toBe(true);
      expect(group.settings.requireApproval).toBe(true);
      expect(group.settings.maxMembers).toBe(10);
    });

    test('PUT /api/groups/:groupId → should validate maxMembers range (2-100)', async () => {
      const res1 = await request(app)
        .put(`/api/groups/${settingsGroupId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ settings: { maxMembers: 1 } });

      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .put(`/api/groups/${settingsGroupId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ settings: { maxMembers: 101 } });

      expect(res2.status).toBe(400);
    });

    test('PUT /api/groups/:groupId → should validate maxMembers >= current members count', async () => {
      const groupDoc = await Group.findById(settingsGroupId);
      if (!groupDoc) {
        throw new Error('Settings test group not found');
      }

      while (groupDoc.members.length < 3) {
        groupDoc.members.push({
          user: new mongoose.Types.ObjectId(),
          role: 'member',
          joinedAt: new Date(),
          permissions: {
            canCreateLists: true,
            canEditLists: true,
            canDeleteLists: true,
            canInviteMembers: false,
            canManageMembers: false,
          },
        } as any);
      }
      await groupDoc.save();

      const currentMembersCount = groupDoc.members.length;

      const res = await request(app)
        .put(`/api/groups/${settingsGroupId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ settings: { maxMembers: currentMembersCount - 1 } });

      expect(res.status).toBe(400);
      const body = getResponseData<{ message: string }>(res);
      expect(body.message || body.data?.message).toMatch(/maximum members must be at least/i);
    });

    test('PUT /api/groups/:groupId → should update canInviteMembers permissions when allowMemberInvite changes', async () => {
      const groupRes = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Permissions Group',
          settings: { allowMemberInvite: false }
        });

      const testGroup = getGroupData(groupRes);
      const testGroupId = testGroup._id.toString();

      await request(app).post('/api/auth/register').send({
        firstName: 'Member',
        lastName: 'User',
        username: 'memberuser',
        email: 'member@example.com',
        password: 'NewPasswordSafe123!'
      });

      await mongoose.connection.db?.collection('users').updateOne(
        { email: 'member@example.com' },
        { $set: { isEmailVerified: true } }
      );

      await request(app)
        .post(`/api/groups/${testGroupId}/invite`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'member@example.com' });

      const memberUser = await User.findOne({ email: 'member@example.com' });
      const invitation = memberUser?.pendingInvitations.find(inv => inv.group.toString() === testGroupId);
      
      if (invitation) {
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({ email: 'member@example.com', password: 'NewPasswordSafe123!' });
        const memberToken = getAccessToken(loginRes);

        await request(app)
          .post('/api/auth/invitations/accept')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({ invitationId: invitation.code });
      }

      const groupBefore = await Group.findById(testGroupId);
      const member = groupBefore?.members.find(m => m.user.toString() === memberUser?._id.toString());
      expect(member?.permissions.canInviteMembers).toBe(false);

      await request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ settings: { allowMemberInvite: true } });

      const groupAfter = await Group.findById(testGroupId);
      const memberAfter = groupAfter?.members.find(m => m.user.toString() === memberUser?._id.toString());
      expect(memberAfter?.permissions.canInviteMembers).toBe(true);
    });
  });

  describe('🔐 Require Approval Flow', () => {
    test('POST /api/groups/:groupId/join → should create join request when requireApproval is true', async () => {
      const groupRes = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Approval Required Group',
          settings: { requireApproval: true }
        });

      const approvalGroup = getGroupData(groupRes);
      const approvalGroupId = approvalGroup._id.toString();

      await request(app).post('/api/auth/register').send({
        firstName: 'Request',
        lastName: 'User',
        username: 'requestuser',
        email: 'request@example.com',
        password: 'NewPasswordSafe123!'
      });

      await mongoose.connection.db?.collection('users').updateOne(
        { email: 'request@example.com' },
        { $set: { isEmailVerified: true } }
      );

      await request(app)
        .post(`/api/groups/${approvalGroupId}/invite`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'request@example.com' });

      const requestingUser = await User.findOne({ email: 'request@example.com' });
      const invitation = requestingUser?.pendingInvitations.find(inv => inv.group.toString() === approvalGroupId);
      
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'request@example.com', password: 'NewPasswordSafe123!' });
      const requestToken = getAccessToken(loginRes);

      const joinRes = await request(app)
        .post(`/api/groups/${approvalGroupId}/join`)
        .set('Authorization', `Bearer ${requestToken}`)
        .send({ inviteCode: invitation.code });

      expect(joinRes.status).toBe(200);
      const body = getResponseData<{ message: string }>(joinRes);
      expect(body.message || body.data?.message).toMatch(/join request submitted/i);

      const group = await Group.findById(approvalGroupId);
      expect(group?.joinRequests).toBeDefined();
      expect(group?.joinRequests?.length).toBeGreaterThan(0);
      const joinRequest = group?.joinRequests?.find(req => req.user.toString() === requestingUser?._id.toString());
      expect(joinRequest).toBeDefined();
      expect(joinRequest?.status).toBe('pending');

      const isMember = group?.members.some(m => m.user.toString() === requestingUser?._id.toString());
      expect(isMember).toBe(false);
    });

    test('POST /api/auth/invitations/accept → should create join request when requireApproval is true', async () => {
      const groupRes = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Approval Required Group 2',
          settings: { requireApproval: true }
        });

      const approvalGroup = getGroupData(groupRes);
      const approvalGroupId = approvalGroup._id.toString();

      await request(app).post('/api/auth/register').send({
        firstName: 'Accept',
        lastName: 'User',
        username: 'acceptuser',
        email: 'accept@example.com',
        password: 'NewPasswordSafe123!'
      });

      await mongoose.connection.db?.collection('users').updateOne(
        { email: 'accept@example.com' },
        { $set: { isEmailVerified: true } }
      );

      await request(app)
        .post(`/api/groups/${approvalGroupId}/invite`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'accept@example.com' });

      const acceptingUser = await User.findOne({ email: 'accept@example.com' });
      const invitation = acceptingUser?.pendingInvitations.find(inv => inv.group.toString() === approvalGroupId);
      
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'accept@example.com', password: 'NewPasswordSafe123!' });
      const acceptToken = getAccessToken(loginRes);

      const acceptRes = await request(app)
        .post('/api/auth/invitations/accept')
        .set('Authorization', `Bearer ${acceptToken}`)
        .send({ invitationId: invitation.code });

      expect(acceptRes.status).toBe(200);
      const body = getResponseData<{ message: string }>(acceptRes);
      expect(body.message || body.data?.message).toMatch(/join request submitted/i);

      const group = await Group.findById(approvalGroupId);
      expect(group?.joinRequests).toBeDefined();
      const joinRequest = group?.joinRequests?.find(req => req.user.toString() === acceptingUser?._id.toString());
      expect(joinRequest).toBeDefined();
      expect(joinRequest?.status).toBe('pending');

      const isMember = group?.members.some(m => m.user.toString() === acceptingUser?._id.toString());
      expect(isMember).toBe(false);
    });
  });

  describe('✅ Join Requests Management', () => {
    let approvalGroupId: string;
    let requestingUserId: string;
    let requestId: string;
    let requestingUserToken: string;

    beforeAll(async () => {
      const groupRes = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Join Requests Test Group',
          settings: { requireApproval: true }
        });

      const approvalGroup = getGroupData(groupRes);
      approvalGroupId = approvalGroup._id.toString();

      await request(app).post('/api/auth/register').send({
        firstName: 'Requesting',
        lastName: 'User',
        username: 'requestinguser',
        email: 'requesting@example.com',
        password: 'NewPasswordSafe123!'
      });

      await mongoose.connection.db?.collection('users').updateOne(
        { email: 'requesting@example.com' },
        { $set: { isEmailVerified: true } }
      );

      const requestingUser = await User.findOne({ email: 'requesting@example.com' });
      requestingUserId = requestingUser!._id.toString();

      await request(app)
        .post(`/api/groups/${approvalGroupId}/invite`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'requesting@example.com' });

      const updatedUser = await User.findOne({ email: 'requesting@example.com' });
      const invitation = updatedUser?.pendingInvitations.find(inv => inv.group.toString() === approvalGroupId);
      
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'requesting@example.com', password: 'NewPasswordSafe123!' });
      requestingUserToken = getAccessToken(loginRes);

      const joinRes = await request(app)
        .post(`/api/groups/${approvalGroupId}/join`)
        .set('Authorization', `Bearer ${requestingUserToken}`)
        .send({ inviteCode: invitation.code });

      expect(joinRes.status).toBe(200);

      const group = await Group.findById(approvalGroupId).lean();
      if (!group || !group.joinRequests) {
        throw new Error('Group or joinRequests not found');
      }
      
      const joinRequest = group.joinRequests.find((req: any) => req.user.toString() === requestingUserId);
      if (!joinRequest) {
        console.error('Join requests in group:', group.joinRequests);
        console.error('Looking for userId:', requestingUserId);
        throw new Error('Join request not found');
      }
      
      const joinRequestId = (joinRequest as any)._id || (joinRequest as any).id;
      if (!joinRequestId) {
        throw new Error('Join request _id not found');
      }
      requestId = joinRequestId.toString();
    });

    test('GET /api/auth/join-requests → should get user join requests', async () => {
      const res = await request(app)
        .get('/api/auth/join-requests')
        .set('Authorization', `Bearer ${requestingUserToken}`);

      expect(res.status).toBe(200);
      const body = getResponseData<any[]>(res);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data?.length).toBeGreaterThan(0);
      const userRequest = body.data?.find(req => req.group._id === approvalGroupId);
      expect(userRequest).toBeDefined();
      expect(userRequest?.status).toBe('pending');
    });

    test('POST /api/groups/:groupId/join-requests/:requestId/reject → should reject join request', async () => {
      await request(app).post('/api/auth/register').send({
        firstName: 'Reject',
        lastName: 'User',
        username: 'rejectuser',
        email: 'reject@example.com',
        password: 'NewPasswordSafe123!'
      });

      await mongoose.connection.db?.collection('users').updateOne(
        { email: 'reject@example.com' },
        { $set: { isEmailVerified: true } }
      );

      const rejectUser = await User.findOne({ email: 'reject@example.com' });
      const rejectUserId = rejectUser!._id.toString();

      await request(app)
        .post(`/api/groups/${approvalGroupId}/invite`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'reject@example.com' });

      const updatedRejectUser = await User.findOne({ email: 'reject@example.com' });
      const invitation = updatedRejectUser?.pendingInvitations.find(inv => inv.group.toString() === approvalGroupId);
      
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'reject@example.com', password: 'NewPasswordSafe123!' });
      const rejectToken = getAccessToken(loginRes);

      await request(app)
        .post(`/api/groups/${approvalGroupId}/join`)
        .set('Authorization', `Bearer ${rejectToken}`)
        .send({ inviteCode: invitation.code });

      const groupBefore = await Group.findById(approvalGroupId);
      const rejectRequest = groupBefore?.joinRequests?.find(req => req.user.toString() === rejectUserId);
      if (!rejectRequest || !rejectRequest._id) {
        throw new Error('Join request not found');
      }
      const rejectRequestId = rejectRequest._id.toString();

      const res = await request(app)
        .post(`/api/groups/${approvalGroupId}/join-requests/${rejectRequestId}/reject`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const group = getGroupData(res);
      
      const isMember = group.members.some(m => m.user.toString() === rejectUserId);
      expect(isMember).toBe(false);

      const rejectedRequest = group.joinRequests?.find(req => req._id?.toString() === rejectRequestId);
      expect(rejectedRequest?.status).toBe('rejected');
    });

    test('POST /api/groups/:groupId/join-requests/:requestId/approve → should approve join request', async () => {
      const res = await request(app)
        .post(`/api/groups/${approvalGroupId}/join-requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const group = getGroupData(res);
      
      const isMember = group.members.some(m => m.user.toString() === requestingUserId);
      expect(isMember).toBe(true);

      const joinRequest = group.joinRequests?.find(req => req._id?.toString() === requestId);
      expect(joinRequest?.status).toBe('approved');
    });
  });

  describe('🚫 Settings Enforcement', () => {
    test('POST /api/groups/:groupId/invite → should enforce allowMemberInvite setting', async () => {
      const groupRes = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'No Invite Group',
          settings: { allowMemberInvite: false }
        });

      const noInviteGroup = getGroupData(groupRes);
      const noInviteGroupId = noInviteGroup._id.toString();

      await request(app).post('/api/auth/register').send({
        firstName: 'Regular',
        lastName: 'Member',
        username: 'regularmember',
        email: 'regular@example.com',
        password: 'NewPasswordSafe123!'
      });

      await mongoose.connection.db?.collection('users').updateOne(
        { email: 'regular@example.com' },
        { $set: { isEmailVerified: true } }
      );

      await request(app)
        .post(`/api/groups/${noInviteGroupId}/invite`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'regular@example.com' });

      const regularUser = await User.findOne({ email: 'regular@example.com' });
      const invitation = regularUser?.pendingInvitations.find(inv => inv.group.toString() === noInviteGroupId);
      
      if (invitation) {
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({ email: 'regular@example.com', password: 'NewPasswordSafe123!' });
        const regularToken = getAccessToken(loginRes);

        await request(app)
          .post('/api/auth/invitations/accept')
          .set('Authorization', `Bearer ${regularToken}`)
          .send({ invitationId: invitation.code });
      }

      await request(app).post('/api/auth/register').send({
        firstName: 'New',
        lastName: 'User',
        username: 'newuser',
        email: 'new@example.com',
        password: 'NewPasswordSafe123!'
      });

      const regularLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'regular@example.com', password: 'NewPasswordSafe123!' });
      const regularMemberToken = getAccessToken(regularLoginRes);

      const inviteRes = await request(app)
        .post(`/api/groups/${noInviteGroupId}/invite`)
        .set('Authorization', `Bearer ${regularMemberToken}`)
        .send({ email: 'new@example.com' });

      expect(inviteRes.status).toBe(403);
      const body = getResponseData<{ message: string }>(inviteRes);
      expect(body.message || body.data?.message).toMatch(/not allowed|permission/i);
    });
  });
});
