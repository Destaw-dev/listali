// // tests/factories/userFactory.ts
// import request from 'supertest';
// import { faker } from '@faker-js/faker';
// import { app } from '../../app';

// export const createTestUser = async () => {
//   const userData = {
//     username: faker.internet.userName(),
//     email: faker.internet.email(),
//     password: 'Test1234',
//     firstName: faker.name.firstName(),
//     lastName: faker.name.lastName()
//   };

//   const res = await request(app)
//     .post('/api/auth/register')
//     .send(userData)
//     .expect(201);

//   return {
//     token: res.body.data.token,
//     user: res.body.data.user,
//     userData
//   };
// };

import request from 'supertest';
import { app } from '../../app';
import User from '../../models/user';
import Group from '../../models/group';
import ShoppingList from '../../models/shoppingList';
import { faker } from '@faker-js/faker';

// מחזיר: { userId, token }
export const createUserAndAuth = async () => {
  const userData = {
    firstName: 'test',
    lastName: 'user',
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123'
  };

  const registerRes = await request(app).post('/api/auth/register').send(userData);
  const res = await request(app).post('/api/auth/login').send({
    email: userData.email,
    password: userData.password
  });
  
  const token = res.body.data.token;
  const user = await User.findOne({ email: userData.email });
  return { userId: user!._id.toString(), token };
};

// מחזיר: { groupId, shoppingListId }
export const createGroupWithList = async (token: string, userId: string) => {
  // צור קבוצה
  const groupRes = await request(app)
    .post('/api/groups')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'קבוצת טסטים', description: 'לבדיקות' });    

  const groupId = groupRes.body.data._id;

  // צור רשימת קניות
  const listRes = await request(app)
    .post(`/api/shopping-lists/${groupId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'רשימת טסטים', groupId });

  const shoppingListId = listRes.body.data._id;

  return { groupId, shoppingListId };
};
