import request from 'supertest';
import { app } from '../../app';
import User from '../../models/user';
import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';

export const createUserAndAuth = async () => {
  const uniqueId = faker.string.alphanumeric(8);
  const userData = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    username: `testuser_${uniqueId}`,
    email: `test_${uniqueId}@example.com`,
    password: 'Password123'
  };

  const registerRes = await request(app).post('/api/auth/register').send(userData);
  
  if (registerRes.status !== 201) {
    throw new Error(`Failed to register user: ${JSON.stringify(registerRes.body)}`);
  }
  
  const user = await User.findOne({ email: userData.email });
  if (user) {
    user.isEmailVerified = true;
    await user.save();
  } else {
    await mongoose.connection.db?.collection('users').updateOne(
      { email: userData.email },
      { $set: { isEmailVerified: true } }
    );
  }
  
  const res = await request(app).post('/api/auth/login').send({
    email: userData.email,
    password: userData.password
  });
  
  if (res.status !== 200 || !res.body.data?.accessToken) {
    throw new Error(`Failed to login user: ${JSON.stringify(res.body)}`);
  }
  
  const token = res.body.data.accessToken;
  const loggedInUser = await User.findOne({ email: userData.email });
  if (!loggedInUser) {
    throw new Error('User not found after registration');
  }
  return { userId: loggedInUser._id.toString(), token };
};

export const createGroupWithList = async (token: string) => {
  const groupRes = await request(app)
    .post('/api/groups')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'קבוצת טסטים', description: 'לבדיקות' });    

  const groupId = groupRes.body.data._id;

  const listRes = await request(app)
    .post(`/api/shopping-lists/groups/${groupId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'רשימת טסטים', groupId });

  if (!listRes.body.data || !listRes.body.data._id) {
    throw new Error(`Failed to create shopping list: ${JSON.stringify(listRes.body)}`);
  }

  const shoppingListId = listRes.body.data._id;

  return { groupId, shoppingListId };
};
