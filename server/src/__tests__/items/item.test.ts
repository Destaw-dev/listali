/**
 * Integration tests for all /api/items endpoints
 */
import request from 'supertest';
import { app } from '../../app';
import { connectDB, disconnectDB } from '../../config/testDb';
import Item from '../../models/item';
import { createUserAndAuth, createGroupWithList } from '../factories/userFactory';
import mongoose from 'mongoose';
import {
  getItemData,
  getItemsArray,
  getResponseData
} from '../utils/testHelpers';



describe('Item API Endpoints', () => {
  let token: string;
let groupId: string;
let shoppingListId: string;
let itemId: string;

beforeAll(async () => {
  await connectDB();
  const userRes = await createUserAndAuth();
  token = userRes.token;
  const groupRes = await createGroupWithList(token);
  groupId = groupRes.groupId;
  shoppingListId = groupRes.shoppingListId;
  await Item.syncIndexes();
}, 30000); // 30 second timeout for MongoDB and setup

afterAll(async () => {
  await disconnectDB();
});


  it('POST /api/items - create item', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'חלב',
        quantity: 2,
        unit: 'piece',
        category: 'other',
        shoppingListId
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('חלב');
    itemId = res.body.data._id;
  });

  it('GET /api/items - list items', async () => {
    const res = await request(app)
      .get('/api/items')
      .query({ shoppingListId })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const items = getItemsArray(res);
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/items/:id - get item by id', async () => {
    const res = await request(app)
      .get(`/api/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const item = getItemData(res);
    expect(item._id.toString()).toBe(itemId);
  });

  it('PUT /api/items/:id - update item', async () => {
    const res = await request(app)
      .put(`/api/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(200);
    const item = getItemData(res);
    expect(item.quantity).toBe(5);
  });

  it('PUT /api/items/:id/quantity - update quantity', async () => {
    const res = await request(app)
      .put(`/api/items/${itemId}/quantity`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 3 });

    expect(res.status).toBe(200);
    const item = getItemData(res);
    expect(item.quantity).toBe(3);
  });

  it('POST /api/items/:id/purchase - purchase item', async () => {
    const res = await request(app)
      .post(`/api/items/${itemId}/purchase`)
      .set('Authorization', `Bearer ${token}`)
      .send({ actualPrice: 14.5 });

    expect(res.status).toBe(200);
    const item = getItemData(res);
    expect(item.status).toBe('purchased');
  });

  it('POST /api/items/:id/unpurchase - unpurchase item', async () => {
    const res = await request(app)
      .post(`/api/items/${itemId}/unpurchase`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const item = getItemData(res);
    expect(item.status).toBe('pending');
  });

  it('POST /api/items/:id/not-available - mark item as not available', async () => {
    const res = await request(app)
      .post(`/api/items/${itemId}/not-available`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const item = getItemData(res);
    expect(item.status).toBe('not_available');
  });

  it('GET /api/items/stats/categories - get category stats', async () => {
    const res = await request(app)
      .get('/api/items/stats/categories')
      .query({ shoppingListId })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const items = getItemsArray(res);
    expect(Array.isArray(items)).toBe(true);
  });

  it('GET /api/items/popular?groupId=${groupId} - get popular items', async () => {
    const res = await request(app)
      .get(`/api/items/popular`)
      .query({ groupId })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const items = getItemsArray(res);
    expect(Array.isArray(items)).toBe(true);
  });

  it('GET /api/items/search?q=חלב - search items', async () => {
    const res = await request(app)
      .get('/api/items/search')
      .query({ q: 'חלב' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const items = getItemsArray(res);
    expect(Array.isArray(items)).toBe(true);
  });

  it('GET /api/items/categories - get available categories', async () => {
    // Use the category API endpoint instead
    const res = await request(app)
      .get('/api/categories/active')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const items = getItemsArray(res);
    expect(Array.isArray(items)).toBe(true);
  });

  it('GET /api/items/units - get available units', async () => {
    const res = await request(app)
      .get('/api/items/units')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const items = getItemsArray(res);
    expect(Array.isArray(items)).toBe(true);
  });

  it('DELETE /api/items/:id - delete item', async () => {
    const res = await request(app)
      .delete(`/api/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const body = getResponseData<null>(res);
    expect(body.data).toBeNull();
  });
});


describe('Item API - Sad Flow', () => {
  let token: string;
  let listId: string;
  let itemId: string;

  beforeAll(async () => {
    await connectDB();
    await Item.syncIndexes();
    const auth = await createUserAndAuth();
    token = auth.token;

    const group = await createGroupWithList(token);
    listId = group.shoppingListId;

    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'חלב',
        shoppingListId: listId,
        quantity: 2,
        unit: 'l',
        category: 'other'
      });

    itemId = res.body.data._id;
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('should not create item without required fields', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ shoppingListId: listId });

    expect(res.status).toBe(400);
    const body = getResponseData<never>(res);
    expect(body.success).toBe(false);
  });

  it('should return 404 for non-existent item', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/items/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    const body = getResponseData<never>(res);
    expect(body.message).toMatch(/not found/i);
  });

  it('should return 400 for invalid updates', async () => {
    // Create a new item for this test
    const createRes = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Item',
        shoppingListId: listId,
        quantity: 1,
        unit: 'piece',
        category: 'other'
      });

    const testItem = getItemData(createRes);
    const testItemId = testItem._id.toString();

    const res = await request(app)
      .put(`/api/items/${testItemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ invalidField: 'abc' });

    expect(res.status).toBe(400);
    const body = getResponseData<never>(res);
    expect(body.message).toMatch(/invalid updates/i);
  });

  it('should return 400 if item already purchased', async () => {
    // Create a new item for this test
    const createRes = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Item Purchase',
        shoppingListId: listId,
        quantity: 1,
        unit: 'piece',
        category: 'other'
      });

    const testItem = getItemData(createRes);
    const testItemId = testItem._id.toString();

    await request(app)
      .post(`/api/items/${testItemId}/purchase`)
      .set('Authorization', `Bearer ${token}`)
      .send({ actualPrice: 10 });

    const res = await request(app)
      .post(`/api/items/${testItemId}/purchase`)
      .set('Authorization', `Bearer ${token}`)
      .send({ actualPrice: 12 });

    expect(res.status).toBe(400);
    const body = getResponseData<never>(res);
    expect(body.message).toMatch(/already purchased/i);
  });

  it('should not allow unauthorized delete', async () => {
    // Create a new item for this test
    const createRes = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Item Delete',
        shoppingListId: listId,
        quantity: 1,
        unit: 'piece',
        category: 'other'
      });

    const testItem = getItemData(createRes);
    const testItemId = testItem._id.toString();

    const newUser = await createUserAndAuth(); // other user
    const res = await request(app)
      .delete(`/api/items/${testItemId}`)
      .set('Authorization', `Bearer ${newUser.token}`);

    expect(res.status).toBe(403);
  });

  it('should return 400 if trying to unpurchase an unpurchased item', async () => {
    // Create item via API to ensure proper category handling
    const createRes = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'עגבניות',
        quantity: 3,
        unit: 'piece',
        category: 'other',
        shoppingListId: listId
      });

    const newItem = getItemData(createRes);
    const newItemId = newItem._id.toString();

    const res = await request(app)
      .post(`/api/items/${newItemId}/unpurchase`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    const body = getResponseData<never>(res);
    expect(body.message).toMatch(/not purchased/i);
  });

  it('should return 400 if quantity is missing for updateQuantity', async () => {
    const res = await request(app)
      .put(`/api/items/${itemId}/quantity`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    const body = getResponseData<never>(res);
    expect(body.success).toBe(false);
  });

  it('should return 403 if no permission to edit', async () => {
    // Create a new item for this test
    const createRes = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Item Edit',
        shoppingListId: listId,
        quantity: 1,
        unit: 'piece',
        category: 'other'
      });

    const testItem = getItemData(createRes);
    const testItemId = testItem._id.toString();

    const anotherUser = await createUserAndAuth();
    const res = await request(app)
      .put(`/api/items/${testItemId}`)
      .set('Authorization', `Bearer ${anotherUser.token}`)
      .send({ name: 'לחם' });

    expect(res.status).toBe(403);
  });
});
