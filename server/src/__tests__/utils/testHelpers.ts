import { Response } from 'supertest';
import {
  IApiResponse,
  IAuthResponse,
  IUser,
  IGroup,
  IItem,
  IMessage,
  IShoppingList,
  IGroupMember,
  PopulatedMessage
} from '../../types';

/**
 * Helper function to extract typed API response data
 */
export const getResponseData = <T>(res: Response): IApiResponse<T> => {
  return res.body as IApiResponse<T>;
};

/**
 * Helper function to get auth response data
 */
export const getAuthResponse = (res: Response): IAuthResponse => {
  const body = getResponseData<IAuthResponse>(res);
  if (!body.data) {
    throw new Error('Auth response data is missing');
  }
  return body.data;
};

/**
 * Helper function to get user data from auth response
 */
export const getUserFromAuth = (res: Response): Omit<IUser, 'password' | 'refreshSessions'> => {
  const authData = getAuthResponse(res);
  if (!authData.user) {
    throw new Error('User data is missing from auth response');
  }
  return authData.user;
};

/**
 * Helper function to get access token from auth response
 */
export const getAccessToken = (res: Response): string => {
  const authData = getAuthResponse(res);
  if (!authData.accessToken) {
    throw new Error('Access token is missing from auth response');
  }
  return authData.accessToken;
};

/**
 * Helper function to get refresh token from auth response (mobile mode)
 */
export const getRefreshToken = (res: Response): string => {
  const authData = getAuthResponse(res);
  if (!authData.refreshToken) {
    throw new Error('Refresh token is missing from auth response');
  }
  return authData.refreshToken;
};

/**
 * Helper function to get session ID from auth response (mobile mode)
 */
export const getSessionId = (res: Response): string => {
  const authData = getAuthResponse(res);
  if (!authData.sessionId) {
    throw new Error('Session ID is missing from auth response');
  }
  return authData.sessionId;
};

/**
 * Helper function to extract cookies from response headers
 */
export const getCookies = (res: Response): string[] => {
  const cookies = res.headers['set-cookie'];
  return Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
};

/**
 * Helper function to extract specific cookie value
 */
export const getCookieValue = (res: Response, cookieName: string): string | null => {
  const cookies = getCookies(res);
  const cookie = cookies.find((c: string) => c.startsWith(`${cookieName}=`));
  if (!cookie) {
    return null;
  }
  const parts = cookie.split(';')[0]?.split('=');
  if (!parts || !parts[1]) {
    return null;
  }
  return parts[1];
};

/**
 * Helper function to get refresh token cookie value
 */
export const getRefreshTokenCookie = (res: Response): string => {
  const value = getCookieValue(res, 'refreshToken');
  if (!value) {
    throw new Error('Refresh token cookie not found');
  }
  return value;
};

/**
 * Helper function to get session ID cookie value
 */
export const getSessionIdCookie = (res: Response): string => {
  const value = getCookieValue(res, 'sessionId');
  if (!value) {
    throw new Error('Session ID cookie not found');
  }
  return value;
};

/**
 * Helper function to get group data from response
 */
export const getGroupData = (res: Response): IGroup => {
  const body = getResponseData<IGroup>(res);
  if (!body.data) {
    throw new Error('Group data is missing from response');
  }
  return body.data;
};

/**
 * Helper function to get groups array from response
 */
export const getGroupsArray = (res: Response): IGroup[] => {
  const body = getResponseData<IGroup[] | null>(res);
  if (!body.data || !Array.isArray(body.data)) {
    throw new Error('Groups array is missing from response');
  }
  return body.data;
};

/**
 * Helper function to get item data from response
 */
export const getItemData = (res: Response): IItem => {
  const body = getResponseData<IItem | null | void>(res);
  if (!body.data) {
    throw new Error('Item data is missing from response');
  }
  return body.data as IItem;
};

/**
 * Helper function to get items array from response
 */
export const getItemsArray = (res: Response): IItem[] => {
  const body = getResponseData<IItem[] | null>(res);
  if (!body.data || !Array.isArray(body.data)) {
    throw new Error('Items array is missing from response');
  }
  return body.data;
};

/**
 * Helper function to get message data from response
 */
export const getMessageData = (res: Response): PopulatedMessage => {
  const body = getResponseData<PopulatedMessage | null | void>(res);
  if (!body.data) {
    throw new Error('Message data is missing from response');
  }
  return body.data as PopulatedMessage;
};

/**
 * Helper function to get messages array from response
 */
export const getMessagesArray = (res: Response): IMessage[] => {
  const body = getResponseData<IMessage[] | null>(res);
  if (!body.data || !Array.isArray(body.data)) {
    throw new Error('Messages array is missing from response');
  }
  return body.data;
};

/**
 * Helper function to get shopping list data from response
 */
export const getShoppingListData = (res: Response): IShoppingList => {
  const body = getResponseData<IShoppingList | null | void>(res);
  if (!body.data) {
    throw new Error('Shopping list data is missing from response');
  }
  return body.data as IShoppingList;
};

/**
 * Helper function to get shopping lists array from response
 */
export const getShoppingListsArray = (res: Response): IShoppingList[] => {
  const body = getResponseData<IShoppingList[] | null>(res);
  if (!body.data || !Array.isArray(body.data)) {
    throw new Error('Shopping lists array is missing from response');
  }
  return body.data;
};

/**
 * Helper function to get group members array from response
 */
export const getGroupMembersArray = (res: Response): IGroupMember[] => {
  const body = getResponseData<IGroupMember[] | null>(res);
  if (!body.data || !Array.isArray(body.data)) {
    throw new Error('Group members array is missing from response');
  }
  return body.data;
};

/**
 * Helper function to get user data from response (for /api/auth/me)
 */
export const getUserData = (res: Response): Omit<IUser, 'password' | 'refreshSessions'> => {
  const body = getResponseData<Omit<IUser, 'password' | 'refreshSessions'>>(res);
  if (!body.data) {
    throw new Error('User data is missing from response');
  }
  return body.data;
};

/**
 * Helper function to check if response has success property
 */
export const isSuccessResponse = (res: Response): boolean => {
  const body = getResponseData<never>(res);
  return body.success === true;
};

/**
 * Helper function to get response message
 */
export const getResponseMessage = (res: Response): string | undefined => {
  const body = getResponseData<never>(res);
  return body.message;
};

