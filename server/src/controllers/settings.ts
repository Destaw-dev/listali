import { Request, Response } from 'express';
import  User  from '../models/user';
import { successResponse, validationErrorResponse } from '../middleware/handlers';
import { validationResult } from 'express-validator';

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
    user.preferences.darkMode = theme === 'dark';
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
