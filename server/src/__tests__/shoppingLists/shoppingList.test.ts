import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../app';
import { connectDB, disconnectDB } from '../../config/testDb';
import User from '../../models/user';
import Group from '../../models/group';
import ShoppingList from '../../models/shoppingList';
import {
  getAuthResponse,
  getAccessToken,
  getUserFromAuth,
  getShoppingListData,
  getShoppingListsArray,
  getGroupData,
  getResponseData
} from '../utils/testHelpers';

let mongoServer: MongoMemoryServer;
let token: string;
let userId: string;
let groupId: string;
let shoppingListId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'test'
    }
  });
  await mongoose.connect(mongoServer.getUri());

  const registerRes = await request(app).post('/api/auth/register').send({
    username: 'listuser',
    email: 'list@example.com',
    password: 'Password123',
    firstName: 'List',
    lastName: 'User'
  });

  // Verify email for testing
  await mongoose.connection.db?.collection('users').updateOne(
    { email: 'list@example.com' },
    { $set: { isEmailVerified: true } }
  );

  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'list@example.com',
    password: 'Password123'
  });

  token = getAccessToken(loginRes);
  const user = getUserFromAuth(loginRes);
  userId = user.id || user._id?.toString() || '';

  const groupRes = await request(app)
    .post('/api/groups')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'List Group' });

  const group = getGroupData(groupRes);
  groupId = group._id.toString();
}, 60000); // 60 second timeout for MongoDB and setup

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('📝 Shopping List API', () => {
  test('POST /api/shopping-lists/groups/:groupId → should create a shopping list', async () => {
    const res = await request(app)
      .post(`/api/shopping-lists/groups/${groupId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Groceries',
        groupId,
        description: 'Weekly shopping',
        priority: 'high'
      });

    expect(res.status).toBe(201);
    const shoppingList = getShoppingListData(res);
    expect(shoppingList.name).toBe('Groceries');
    shoppingListId = shoppingList._id.toString();
  });

  test('GET /api/shopping-lists/groups/:groupId → should get lists for group', async () => {
    const res = await request(app)
      .get(`/api/shopping-lists/groups/${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const shoppingLists = getShoppingListsArray(res);
    expect(Array.isArray(shoppingLists)).toBe(true);
  });

  test('GET /api/shopping-lists/:id → should get list by ID', async () => {
    const res = await request(app)
      .get(`/api/shopping-lists/${shoppingListId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.shoppingList._id).toBe(shoppingListId);
  });

  test('PUT /api/shopping-lists/:id → should update list', async () => {
    const res = await request(app)
      .put(`/api/shopping-lists/${shoppingListId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Groceries' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Groceries');
  });

  test('PUT /api/shopping-lists/:id → should assign shopping list to user via update', async () => {
    // Register second user
    const newUserRes = await request(app).post('/api/auth/register').send({
      username: 'assignUser',
      email: 'assign@example.com',
      password: 'Password123',
      firstName: 'Assign',
      lastName: 'User',
    });
  
    // Verify email for testing
    await mongoose.connection.db?.collection('users').updateOne(
      { email: 'assign@example.com' },
      { $set: { isEmailVerified: true } }
    );
  
    const newUserId = newUserRes.body.data.user.id;
  
    // הוספת המשתמש לקבוצה
    await request(app)
      .post(`/api/groups/${groupId}/invite`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'assign@example.com' });
  
    // Get invitation and accept it
    const newUserLogin = await request(app).post('/api/auth/login').send({
      email: 'assign@example.com',
      password: 'Password123'
    });
    const newUser = await User.findOne({ email: 'assign@example.com' });
    const invitation = newUser?.pendingInvitations.find(inv => inv.group.toString() === groupId);
    if (invitation) {
      await request(app)
        .post('/api/auth/invitations/accept')
        .set('Authorization', `Bearer ${newUserLogin.body.data.accessToken}`)
        .send({ invitationId: invitation.code });
    }
  
    // Assign the shopping list to new user via update
    const res = await request(app)
      .put(`/api/shopping-lists/${shoppingListId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assignedTo: newUserId });
  
    expect(res.status).toBe(200);
    expect(res.body.data.assignedTo._id).toBe(newUserId);
  });
  
  test('PUT /api/shopping-lists/:id → should unassign user via update', async () => {
    // Make sure shoppingListId is defined
    if (!shoppingListId) {
      throw new Error('shoppingListId is not defined');
    }

    const res = await request(app)
      .put(`/api/shopping-lists/${shoppingListId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assignedTo: null });

    expect(res.status).toBe(200);
    expect(res.body.data.assignedTo).toBeNull();
  });

  test('POST /api/shopping-lists/:id/complete → should complete list', async () => {
    const res = await request(app)
      .post(`/api/shopping-lists/${shoppingListId}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/completed/i);
  });

  test('DELETE /api/shopping-lists/:id → should delete list', async () => {
    const res = await request(app)
      .delete(`/api/shopping-lists/${shoppingListId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    const check = await ShoppingList.findById(shoppingListId);
    expect(check).toBeNull();
  });
});


