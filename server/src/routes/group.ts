import express from 'express';
import { 
  createGroup,  
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
  transferOwnership,
  cancelGroupInvitation,
  joinGroup,
  approveJoinRequest,
  rejectJoinRequest
} from '../controllers/group';
import {
  createGroupValidation,
  updateGroupValidation,
  inviteToGroupValidation,
  updateMemberRoleValidation,
  cancelGroupInvitationValidation,
  validateGroupId,
  validateMemberId
} from '../middleware/validation';
import { authenticateToken, checkGroupMembership, checkOwnership } from '../middleware/auth';
import { asyncHandler } from '../middleware/handlers';

const router = express.Router();

router.use(authenticateToken);

router.get('/', asyncHandler(getUserGroups));
router.post('/', createGroupValidation, asyncHandler(createGroup));
router.get('/:groupId', validateGroupId, checkGroupMembership(), asyncHandler(getGroupById));
router.put('/:groupId', validateGroupId, updateGroupValidation, checkGroupMembership('canManageMembers'), asyncHandler(updateGroup));
router.delete('/:groupId', validateGroupId, checkOwnership('group'), asyncHandler(deleteGroup));
router.post('/:groupId/leave', validateGroupId, checkGroupMembership(), asyncHandler(leaveGroup));
router.post('/:groupId/invite', validateGroupId, inviteToGroupValidation, checkGroupMembership('canInviteMembers'), asyncHandler(inviteToGroup));
router.post('/:groupId/join', validateGroupId, asyncHandler(joinGroup));
router.delete('/:groupId/invitations/:inviteCode', cancelGroupInvitationValidation, checkGroupMembership('canInviteMembers'), asyncHandler(cancelGroupInvitation));
router.delete('/:groupId/members/:userId', validateGroupId, validateMemberId, checkGroupMembership('canManageMembers'), asyncHandler(removeGroupMember));
router.put('/:groupId/members/:userId/role', validateGroupId, validateMemberId, updateMemberRoleValidation, checkGroupMembership('canManageMembers'), asyncHandler(updateMemberRole));
router.post('/:groupId/transfer-ownership', validateGroupId, checkGroupMembership('canManageMembers'), asyncHandler(transferOwnership));
router.get('/:groupId/members', validateGroupId, checkGroupMembership(), asyncHandler(getGroupMembers));
router.get('/:groupId/stats', validateGroupId, checkGroupMembership(), asyncHandler(getGroupStats));
router.post('/:groupId/join-requests/:requestId/approve', validateGroupId, checkGroupMembership('canManageMembers'), asyncHandler(approveJoinRequest));
router.post('/:groupId/join-requests/:requestId/reject', validateGroupId, checkGroupMembership('canManageMembers'), asyncHandler(rejectJoinRequest));

export default router;
