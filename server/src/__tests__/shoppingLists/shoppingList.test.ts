import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../app';
import { connectDB, disconnectDB } from '../../config/testDb';
import User from '../../models/user';
import Group from '../../models/group';
import ShoppingList from '../../models/shoppingList';

let mongoServer: MongoMemoryServer;
let token: string;
let userId: string;
let groupId: string;
let shoppingListId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const registerRes = await request(app).post('/api/auth/register').send({
    username: 'listuser',
    email: 'list@example.com',
    password: 'Password123',
    firstName: 'List',
    lastName: 'User'
  });

  token = registerRes.body.data.token;
  userId = registerRes.body.data.user.id;

  const groupRes = await request(app)
    .post('/api/groups')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'List Group' });

  groupId = groupRes.body.data._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('📝 Shopping List API', () => {
  test('POST /api/shopping-lists/groupId → should create a shopping list', async () => {
    const res = await request(app)
      .post(`/api/shopping-lists/${groupId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Groceries',
        groupId,
        description: 'Weekly shopping',
        priority: 'high'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Groceries');
    shoppingListId = res.body.data._id;
  });

  test('GET /api/shopping-lists?groupId= → should get lists for group', async () => {
    const res = await request(app)
      .get(`/api/shopping-lists/${groupId}?groupId=${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.lists)).toBe(true);
  });

  test('GET /api/shopping-lists/:id → should get list by ID', async () => {
    const res = await request(app)
      .get(`/api/shopping-lists/${groupId}/${shoppingListId}`)
      .set('Authorization', `Bearer ${token}`);

      console.log(`/api/shopping-lists/${groupId}/${shoppingListId}`, res.body)

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(shoppingListId);
  });

  test('PUT /api/shopping-lists/:id → should update list', async () => {
    const res = await request(app)
      .put(`/api/shopping-lists/${groupId}/${shoppingListId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Groceries' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Groceries');
  });

  test('POST /api/shopping-lists/:id/assign → should assign shopping list to user', async () => {
    // Register second user
    const newUserRes = await request(app).post('/api/auth/register').send({
      username: 'assignUser',
      email: 'assign@example.com',
      password: 'Password123',
      firstName: 'Assign',
      lastName: 'User',
    });
  
    const newUserId = newUserRes.body.data.user.id;
  
    // הוספת המשתמש לקבוצה
    const inviteRes = await request(app)
      .post(`/api/groups/${groupId}/invite`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'assign@example.com' });
  
    // Assign the shopping list to new user
    const res = await request(app)
      .post(`/api/shopping-lists/${groupId}/${shoppingListId}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: newUserId });
  
    expect(res.status).toBe(200);
    expect(res.body.data.assignedTo._id).toBe(newUserId);
  });
  
  test('POST /api/shopping-lists/:id/unassign → should unassign user', async () => {
    const res = await request(app)
      .post(`/api/shopping-lists/${groupId}/${shoppingListId}/unassign`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/unassigned/i);
  });

  test('POST /api/shopping-lists/:id/complete → should complete list', async () => {
    const res = await request(app)
      .post(`/api/shopping-lists/${groupId}/${shoppingListId}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/completed/i);
  });

  test('POST /api/shopping-lists/:id/reopen → should reopen list', async () => {
    const res = await request(app)
      .post(`/api/shopping-lists/${groupId}/${shoppingListId}/reopen`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reopened/i);
  });

  test('POST /api/shopping-lists/:id/archive → should archive list', async () => {
    const res = await request(app)
      .post(`/api/shopping-lists/${groupId}/${shoppingListId}/archive`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/archived/i);
  });

  test('GET /api/shopping-lists/:id/overdue?groupId → should get overdue lists', async () => {
    const res = await request(app)
      .get(`/api/shopping-lists/${groupId}/${shoppingListId}/overdue?groupId=${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('DELETE /api/shopping-lists/:id → should delete list', async () => {
    const res = await request(app)
      .delete(`/api/shopping-lists/${groupId}/${shoppingListId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    const check = await ShoppingList.findById(shoppingListId);
    expect(check).toBeNull();
  });
});


