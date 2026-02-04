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
  markMessagesAsReadBatch,
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
  validateBatchRead,
  validateSearchQuery,
  validateStatsQuery,
  validateByTypeParams,
  validateExportQuery
} from '../middleware/validation';

import { asyncHandler } from '../middleware/handlers';

const router = express.Router();

router.get('/', validateMessageQuery, asyncHandler(getMessages));

router.get('/recent', validatePaginationQuery, asyncHandler(getRecentMessages));

router.get('/export', validateExportQuery, asyncHandler(exportMessages));

router.post('/', createMessageValidation, asyncHandler(createMessage));

router.put('/:id', [...validateIdParam, ...createMessageValidation], asyncHandler(updateMessage));

router.delete('/:id', validateIdParam, asyncHandler(deleteMessage));

router.post('/:id/read', validateIdParam, asyncHandler(markMessageAsRead));

router.post('/read-all', validateReadAll, asyncHandler(markAllMessagesAsRead));

router.post('/batch-read', validateBatchRead, asyncHandler(markMessagesAsReadBatch));

router.get('/unread', validateGroupIdQuery, asyncHandler(getUnreadMessages));

router.get('/search', validateSearchQuery, asyncHandler(searchMessages));

router.get('/stats', validateStatsQuery, asyncHandler(getMessageStats));

router.get('/active-users', validateStatsQuery, asyncHandler(getMostActiveUsers));

router.get('/:id/read-status', validateIdParam, asyncHandler(getMessageReadStatus));

router.get('/by-type/:type', validateByTypeParams, validatePaginationQuery, asyncHandler(getMessagesByType));

router.get('/group/:groupId', validateGroupIdQuery, asyncHandler(getMessages));

router.get('/group/:groupId/unread-info', validateGroupIdQuery, asyncHandler(getUnreadCountAndLastRead));

router.post('/group/:groupId/mark-read', validateGroupIdQuery, asyncHandler(markGroupMessagesAsRead));

router.get('/:id', validateIdParam, asyncHandler(getMessageById));



export default router;
