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

// All routes require authentication
router.use(authenticateToken);

// Get comprehensive shopping list data (list, items, sessions, stats)
router.get('/list-data/:listId', asyncHandler(getShoppingListData));

// Start shopping session
router.post('/start', asyncHandler(startShopping));

// Stop shopping session
router.post('/stop', asyncHandler(stopShopping));

// Pause shopping session
router.post('/pause', asyncHandler(pauseShopping));

// Resume shopping session
router.post('/resume', asyncHandler(resumeShopping));

// Update shopping location
router.put('/location', asyncHandler(updateShoppingLocation));

// Get current user's shopping session for a list
router.get('/status/:listId', asyncHandler(getCurrentUserSession));

// Get all active shopping sessions for a list
router.get('/sessions/:listId', asyncHandler(getActiveSessions));

// Get shopping statistics for a list
router.get('/stats/:listId', asyncHandler(getShoppingStats));

export default router; 