import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/handlers';
import { preferencesValidation, notificationSettingsValidation } from '../middleware/validation';
import {
  getUserPreferences,
  updateUserPreferences,
  getUserNotificationSettings,
  updateUserNotificationSettings
} from '../controllers/settings';

const router = express.Router();

router.use(authenticateToken);

router.get('/preferences', asyncHandler(getUserPreferences));
router.put('/preferences', preferencesValidation, asyncHandler(updateUserPreferences));
router.get('/notifications', asyncHandler(getUserNotificationSettings));
router.put('/notifications', notificationSettingsValidation, asyncHandler(updateUserNotificationSettings));

export default router;
