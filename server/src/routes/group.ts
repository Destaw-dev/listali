// routes/groupRoutes.ts
import express from 'express';
import { 
  createGroup,  
  joinGroup, 
  inviteToGroup,
  updateGroup,
  deleteGroup,
  leaveGroup,
  removeGroupMember,
  updateMemberRole,
  getGroupMembers,
  getGroupStats,
  getGroupById,
  getUserGroups,
  transferOwnership
} from '../controllers/group';
import {
  createGroupValidation,
  updateGroupValidation,
  inviteToGroupValidation,
  updateMemberRoleValidation,
  joinGroupValidation,
  validateGroupId,
  validateMemberId
} from '../middleware/validation';
import { authenticateToken, checkGroupMembership, checkOwnership } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Group routes
router.get('/', asyncHandler(getUserGroups));
router.post('/', createGroupValidation, asyncHandler(createGroup));
router.get('/:groupId', validateGroupId, checkGroupMembership(), asyncHandler(getGroupById));
router.put('/:groupId', validateGroupId, updateGroupValidation, checkGroupMembership('canManageMembers'), asyncHandler(updateGroup));
router.delete('/:groupId', validateGroupId, checkOwnership('group'), asyncHandler(deleteGroup));
// router.post('/join/:inviteCode', joinGroupValidation, asyncHandler(joinGroup));
router.post('/:groupId/leave', validateGroupId, checkGroupMembership(), asyncHandler(leaveGroup));
router.post('/:groupId/invite', validateGroupId, inviteToGroupValidation, checkGroupMembership('canInviteMembers'), asyncHandler(inviteToGroup));
router.delete('/:groupId/members/:userId', validateGroupId, validateMemberId, checkGroupMembership('canManageMembers'), asyncHandler(removeGroupMember));
router.put('/:groupId/members/:userId/role', validateGroupId, validateMemberId, updateMemberRoleValidation, checkGroupMembership('canManageMembers'), asyncHandler(updateMemberRole));
router.post('/:groupId/transfer-ownership', validateGroupId, checkGroupMembership('canManageMembers'), asyncHandler(transferOwnership));
router.get('/:groupId/members', validateGroupId, checkGroupMembership(), asyncHandler(getGroupMembers));
router.get('/:groupId/stats', validateGroupId, checkGroupMembership(), asyncHandler(getGroupStats));

export default router;
