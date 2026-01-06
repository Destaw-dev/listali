import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/handlers';
import {
  startShopping,
  stopShopping,
  pauseShopping,
  resumeShopping,
  updateShoppingLocation,
  getCurrentUserSession,
  getActiveSessions,
  getShoppingStats,
  getShoppingListData
} from '../controllers/shopping';

const router = express.Router();

router.use(authenticateToken);

router.get('/list-data/:listId', asyncHandler(getShoppingListData));

router.post('/start', asyncHandler(startShopping));

router.post('/stop', asyncHandler(stopShopping));

router.post('/pause', asyncHandler(pauseShopping));

router.post('/resume', asyncHandler(resumeShopping));

router.put('/location', asyncHandler(updateShoppingLocation));

router.get('/status/:listId', asyncHandler(getCurrentUserSession));

router.get('/sessions/:listId', asyncHandler(getActiveSessions));

router.get('/stats/:listId', asyncHandler(getShoppingStats));

export default router; 