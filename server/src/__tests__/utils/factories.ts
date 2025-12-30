import User from '../../models/user';
import Group from '../../models/group';
import { signAccessToken } from '../../utils/tokens';

export const createUser = async (overrides = {}) => {
  const user = await User.create({
    username: 'testuser' + Math.random().toString(36).substring(7),
    email: 'test' + Date.now() + '@mail.com',
    password: 'Pass1234',
    firstName: 'Test',
    lastName: 'User',
    ...overrides
  });
  const token = signAccessToken(user._id.toString());
  return { user, token };
};

export const createGroup = async (ownerId: string, overrides = {}) => {
  const group = await Group.create({
    name: 'Test Group',
    owner: ownerId,
    members: [],
    ...overrides
  });
  return group;
};
