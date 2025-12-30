import request from 'supertest';
import { app } from '../../app';
import { connectDB, disconnectDB } from '../../config/testDb';
import { createUserAndAuth, createGroupWithList } from '../factories/userFactory';
import Message from '../../models/message';
import {
  getMessageData,
  getMessagesArray,
  getResponseData
} from '../utils/testHelpers';
import { IMessage } from '@/types';

let token: string;
let groupId: string;

beforeAll(async () => {
  await connectDB();
  await Message.syncIndexes();
  const { userId, token: authToken } = await createUserAndAuth();
  token = authToken

  const { groupId: groupIdRes } = await createGroupWithList(token, userId);

  groupId = groupIdRes
}, 60000); // 60 second timeout for MongoDB and setup

afterAll(async () => {
  await disconnectDB();
});

describe('Message API', () => {
  let messageId: string;

  it('POST /api/messages - create message', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello world!', groupId });

    expect(res.status).toBe(201);
    const message = getMessageData(res);
    messageId = message._id.toString();
  });

  it('GET /api/messages - fetch messages', async () => {
    const res = await request(app)
      .get(`/api/messages/group/${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const body = getResponseData<{ messages: IMessage[]; hasMore: boolean }>(res);
    expect(Array.isArray(body.data?.messages)).toBe(true);
  });

  it('GET /api/messages/:id - get single message', async () => {
    const res = await request(app)
      .get(`/api/messages/${messageId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const message = getMessageData(res);
    expect(message._id.toString()).toBe(messageId);
  });

  it('PUT /api/messages/:id - update message', async () => {
    const res = await request(app)
      .put(`/api/messages/${messageId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated message', groupId });

    expect(res.status).toBe(200);
    const message = getMessageData(res);
    expect(message.content).toBe('Updated message');
  });

  it('POST /api/messages/:id/read - mark message as read', async () => {
    const res = await request(app)
      .post(`/api/messages/${messageId}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('DELETE /api/messages/:id - delete message (Only the sender can delete this message)', async () => {
    const res = await request(app)
      .delete(`/api/messages/${messageId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('POST /api/messages/read-all - mark all as read', async () => {
    const res = await request(app)
      .post(`/api/messages/read-all`)
      .set('Authorization', `Bearer ${token}`)
      .send({ groupId });

    expect(res.status).toBe(200);
  });

  it('GET /api/messages/unread - get unread messages', async () => {
    const res = await request(app)
      .get(`/api/messages/unread?groupId=${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('GET /api/messages/search - search messages', async () => {
    const res = await request(app)
      .get(`/api/messages/search?groupId=${groupId}&q=Hello`)
      .set('Authorization', `Bearer ${token}`);

      console.log(`/api/messages/search?groupId=${groupId}&q=Hello`, res.body)

    expect(res.status).toBe(200);
  });

  it('GET /api/messages/stats - get message stats', async () => {
    const res = await request(app)
      .get(`/api/messages/stats?groupId=${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('GET /api/messages/active-users - most active users', async () => {
    const res = await request(app)
      .get(`/api/messages/active-users?groupId=${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('GET /api/messages/:id/read-status - get read status', async () => {
    const { userId: localUserId, token: localToken } = await createUserAndAuth(); // מייצר יוזר חדש
  
    const { groupId: localGroupId } = await createGroupWithList(localToken, localUserId);
  
    const msg = await Message.create({
      content: 'Read me',
      sender: localUserId,
      group: localGroupId,
      readBy: [{ user: localUserId, readAt: new Date() }]
    });
  
    const res = await request(app)
      .get(`/api/messages/${msg._id}/read-status`)
      .set('Authorization', `Bearer ${token}`);
  
    expect(res.status).toBe(200);
  });
  

  it('GET /api/messages/by-type/text - messages by type', async () => {
    const res = await request(app)
      .get(`/api/messages/by-type/text?groupId=${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('GET /api/messages/recent - recent messages', async () => {
    const res = await request(app)
      .get(`/api/messages/recent?groupId=${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('GET /api/messages/export - export messages', async () => {
    const res = await request(app)
      .get(`/api/messages/export?groupId=${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
