import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/handlers';
import { preferencesValidation, notificationSettingsValidation, pushSubscriptionValidation } from '../middleware/validation';
import {
  getUserPreferences,
  updateUserPreferences,
  getUserNotificationSettings,
  updateUserNotificationSettings,
  savePushSubscription,
  removePushSubscription,
  testPushNotification
} from '../controllers/settings';

const router = express.Router();

router.use(authenticateToken);

router.get('/preferences', asyncHandler(getUserPreferences));
router.put('/preferences', preferencesValidation, asyncHandler(updateUserPreferences));
router.get('/notifications', asyncHandler(getUserNotificationSettings));
router.put('/notifications', notificationSettingsValidation, asyncHandler(updateUserNotificationSettings));
router.post('/push-subscription', pushSubscriptionValidation, asyncHandler(savePushSubscription));
router.delete('/push-subscription', asyncHandler(removePushSubscription));
router.post('/test-push', asyncHandler(testPushNotification));

export default router;
