import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import  User  from '../models/user';
import { successResponse, validationErrorResponse } from '../middleware/handlers';
import { sendPushNotificationToUser } from '../utils/pushNotifications';

export const getUserPreferences = async (req: Request, res: Response) => {
  const user = await User.findById(req.userId).select('preferences');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  return res.status(200).json(successResponse(user.preferences, 'User preferences retrieved successfully'));
};

export const updateUserPreferences = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(validationErrorResponse(errors.array()));
  }

  const { language, theme } = req.body;
  const user = await User.findById(req.userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (language) {
    user.preferences.language = language;
  }
  if (theme) {
    user.preferences.theme = theme;
  }

  await user.save();

  return res.status(200).json(successResponse(user.preferences, 'Preferences updated successfully'));
};

export const getUserNotificationSettings = async (req: Request, res: Response) => {
  const user = await User.findById(req.userId).select('preferences');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const notificationSettings = {
    pushNotifications: user.preferences.pushNotifications,
    emailNotifications: user.preferences.emailNotifications,
    newMessageNotifications: user.preferences.newMessageNotifications,
    shoppingListUpdates: user.preferences.shoppingListUpdates,
    groupInvitations: user.preferences.groupInvitations
  };

  return res.status(200).json(successResponse(notificationSettings, 'Notification settings retrieved successfully'));
};

export const updateUserNotificationSettings = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(validationErrorResponse(errors.array()));
  }

  const {
    pushNotifications,
    emailNotifications,
    newMessageNotifications: _newMessageNotifications,
    shoppingListUpdates: _shoppingListUpdates,
    groupInvitations: _groupInvitations
  } = req.body;

  const user = await User.findById(req.userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (pushNotifications !== undefined) {
    user.preferences.pushNotifications = pushNotifications;
  }
  if (emailNotifications !== undefined) {
    user.preferences.emailNotifications = emailNotifications;
  }

  await user.save();

  const notificationSettings = {
    pushNotifications: user.preferences.pushNotifications,
    emailNotifications: user.preferences.emailNotifications,
    newMessageNotifications: user.preferences.newMessageNotifications,
    shoppingListUpdates: user.preferences.shoppingListUpdates,
    groupInvitations: user.preferences.groupInvitations
  };

  return res.status(200).json(successResponse(notificationSettings, 'Notification settings updated successfully'));
};

export const savePushSubscription = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(validationErrorResponse(errors.array()));
  }

  const { endpoint, keys } = req.body;
  const userAgent = req.get('user-agent') || 'unknown';

  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return res.status(400).json({
      success: false,
      message: 'Invalid push subscription data'
    });
  }

  const user = await User.findById(req.userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const existingIndex = user.pushSubscriptions.findIndex(
    (sub: { endpoint: string }) => sub.endpoint === endpoint
  );

  const subscriptionData = {
    endpoint,
    keys: {
      p256dh: keys.p256dh,
      auth: keys.auth
    },
    userAgent,
    createdAt: new Date()
  };

  if (existingIndex >= 0) {
    user.pushSubscriptions[existingIndex] = subscriptionData;
  } else {
    user.pushSubscriptions.push(subscriptionData);
  }

  await user.save();

  return res.status(200).json(successResponse(null, 'Push subscription saved successfully'));
};

export const removePushSubscription = async (req: Request, res: Response) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({
      success: false,
      message: 'Endpoint is required'
    });
  }

  const user = await User.findById(req.userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.pushSubscriptions = user.pushSubscriptions.filter(
    (sub: { endpoint: string }) => sub.endpoint !== endpoint
  );

  await user.save();

  return res.status(200).json(successResponse(null, 'Push subscription removed successfully'));
};

export const testPushNotification = async (req: Request, res: Response) => {
  const userId = req.userId!;
  
  try {
    await sendPushNotificationToUser(userId, {
      title: '🧪 בדיקת התראה',
      body: 'זוהי התראה לבדיקה! אם אתה רואה את זה, הכל עובד מצוין 🎉',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      data: {
        url: '/dashboard',
        test: true,
        timestamp: new Date().toISOString()
      },
      tag: 'test-notification',
      requireInteraction: false
    });

    return res.status(200).json(successResponse(null, 'Test push notification sent successfully'));
  } catch (error) {
    console.error('Error sending test push notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test push notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
