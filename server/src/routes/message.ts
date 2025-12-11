// routes/messageRoutes.ts
import express from 'express';
import {
  getMessages,
  createMessage,
  getMessageById,
  deleteMessage,
  markMessageAsRead,
  updateMessage,
  markAllMessagesAsRead,
  markGroupMessagesAsRead,
  getUnreadMessages,
  searchMessages,
  getMessageStats,
  getMostActiveUsers,
  getMessageReadStatus,
  getMessagesByType,
  getRecentMessages,
  exportMessages,
  getUnreadCountAndLastRead
} from '../controllers/message';

import {
  createMessageValidation,
  validateIdParam,
  validateMessageQuery,
  validateGroupIdQuery,
  validatePaginationQuery,
  validateReadAll,
  validateSearchQuery,
  validateStatsQuery,
  validateByTypeParams,
  validateExportQuery
} from '../middleware/validation';

import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// GET /api/messages
router.get('/', validateMessageQuery, asyncHandler(getMessages));

router.get('/recent', validatePaginationQuery, asyncHandler(getRecentMessages));

// GET /api/messages/export
router.get('/export', validateExportQuery, asyncHandler(exportMessages));

// POST /api/messages
router.post('/', createMessageValidation, asyncHandler(createMessage));

// GET /api/messages/:id

// PUT /api/messages/:id
router.put('/:id', [...validateIdParam, ...createMessageValidation], asyncHandler(updateMessage));

// DELETE /api/messages/:id
router.delete('/:id', validateIdParam, asyncHandler(deleteMessage));

// POST /api/messages/:id/read
router.post('/:id/read', validateIdParam, asyncHandler(markMessageAsRead));

// POST /api/messages/read-all
router.post('/read-all', validateReadAll, asyncHandler(markAllMessagesAsRead));

// GET /api/messages/unread
router.get('/unread', validateGroupIdQuery, asyncHandler(getUnreadMessages));

// GET /api/messages/search
router.get('/search', validateSearchQuery, asyncHandler(searchMessages));

// GET /api/messages/stats
router.get('/stats', validateStatsQuery, asyncHandler(getMessageStats));

// GET /api/messages/active-users
router.get('/active-users', validateStatsQuery, asyncHandler(getMostActiveUsers));

// GET /api/messages/:id/read-status
router.get('/:id/read-status', validateIdParam, asyncHandler(getMessageReadStatus));

// GET /api/messages/by-type/:type
router.get('/by-type/:type', validateByTypeParams, validatePaginationQuery, asyncHandler(getMessagesByType));

// Chat-specific routes for groups
// GET /api/messages/group/:groupId - Get messages for specific group
router.get('/group/:groupId', validateGroupIdQuery, asyncHandler(getMessages));

// GET /api/messages/group/:groupId/unread-info - Get unread count and last read message in one call
router.get('/group/:groupId/unread-info', validateGroupIdQuery, asyncHandler(getUnreadCountAndLastRead));

// POST /api/messages/group/:groupId/mark-read - Mark all messages in group as read
router.post('/group/:groupId/mark-read', validateGroupIdQuery, asyncHandler(markGroupMessagesAsRead));

router.get('/:id', validateIdParam, asyncHandler(getMessageById));



export default router;
