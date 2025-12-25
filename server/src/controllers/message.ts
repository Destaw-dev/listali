import express from 'express';
import { validationResult } from 'express-validator';
import Message from '../models/message';
import Group from '../models/group';
import { io } from '../app';
import { AppError, validationErrorResponse, successResponse } from '../middleware/errorHandler';
import { IApiResponse, IGroupMember, IUser } from '../types';

export const getMessages = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const { page = 1, limit = 50, before, after, messageType, search, includeDeleted = false } = req.query;
  const groupId = req.params.groupId;
  const group = await Group.findById(groupId);
  if (!group || !group.members.some((m: any) => m.user.toString() === req.userId)) throw new AppError('Access denied to this group', 403);

  const options = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    before: before as string,
    after: after as string,
    messageType: messageType as string,
    search: search as string,
    includeDeleted: includeDeleted === 'true'
  };

  const messages = await Message.findByGroup(groupId as string, options);

  res.status(200).json(successResponse({ messages, hasMore: messages.length === options.limit }, 'Messages retrieved successfully'));
};

export const createMessage = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const { content, groupId, messageType = 'text', metadata = {} } = req.body;
  const userId = req.userId!;

  const group = await Group.findById(groupId);
  if (!group || !group.members.some((m: any) => m.user.toString() === userId)) throw new AppError('Access denied to this group', 403);

  const message = await Message.create({
    content,
    sender: userId,
    group: groupId,
    messageType,
    metadata,
    readBy: [{ user: userId, readAt: new Date() }]
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'username firstName lastName avatar')
    .populate('metadata.itemId', 'name')
    .populate('metadata.listId', 'name');

  await Message.markAllAsRead(userId, groupId);

  try {
    if (io && populatedMessage) {
      io.to(`group:${groupId}`).emit('chat:message', {
        groupId,
        message: {
          id: populatedMessage._id.toString(),
          content: populatedMessage.content,
          senderId: (populatedMessage.sender as any)._id.toString(),
          senderName: (populatedMessage.sender as any).username,
          senderAvatar: (populatedMessage.sender as any).avatar,
          timestamp: populatedMessage.createdAt,
          type: populatedMessage.messageType,
          status: "delivered",
        }
      });
    }
  } catch (error) {
    console.error('Error sending WebSocket event:', error);
  }

  res.status(201).json(successResponse(populatedMessage, 'Message created successfully'));
};

export const getMessageById = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const message = await Message.findById(req.params.id)
    .populate('sender', 'username firstName lastName avatar')
    .populate('group', 'name members')
    .populate('metadata.itemId', 'name')
    .populate('metadata.listId', 'name')
    .populate('readBy.user', 'username firstName lastName');

  if (!message) throw new AppError('Message not found', 404);

  const group = message.group as any;
  if (!group.members.some((m: any) => m.user.toString() === req.userId)) throw new AppError('Access denied to this message', 403);

  // Note: Messages are now marked as read via separate API endpoint

  res.status(200).json(successResponse(message, 'Message retrieved successfully'));
};

export const editMessage = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const message = await Message.findById(req.params.id).populate('group', 'members');
  if (!message) throw new AppError('Message not found', 404);

  const group = message.group as any;
  if (!group.members.some((m: any) => m.user.toString() === req.userId)) throw new AppError('Access denied to this message', 403);

  const { content } = req.body;
  await message.editMessage(content, req.userId!);

  const updatedMessage = await Message.findById(message._id)
    .populate('sender', 'username firstName lastName avatar')
    .populate('metadata.itemId', 'name')
    .populate('metadata.listId', 'name');

  try {
    if (io && updatedMessage) {
      io.to(`group:${group._id.toString()}`).emit('chat:message', {
        groupId: group._id.toString(),
        message: {
          id: updatedMessage._id.toString(),
          content: updatedMessage.content,
          senderId: (updatedMessage.sender as any)._id.toString(),
          senderName: (updatedMessage.sender as any).username,
          senderAvatar: (updatedMessage.sender as any).avatar,
          timestamp: updatedMessage.createdAt,
          type: updatedMessage.messageType,
          status: "delivered",
        }
      });
    }
  } catch (error) {
    console.error('Error sending WebSocket event:', error);
  }

  res.status(200).json(successResponse(updatedMessage, 'Message updated successfully'));
};

export const deleteMessage = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const message = await Message.findById(req.params.id).populate('group', 'members');
  if (!message) throw new AppError('Message not found', 404);

  const group = message.group as any;
  if (!group.members.some((m: any) => m.user.toString() === req.userId)) throw new AppError('Access denied to this message', 403);

  await message.deleteMessage(req.userId!);

  try {
    if (io) {
      io.to(`group:${group._id.toString()}`).emit('chat:message', {
        groupId: group._id.toString(),
        message: {
          id: message._id.toString(),
          content: 'הודעה זו נמחקה',
          senderId: (message.sender as any)._id.toString(),
          senderName: (message.sender as unknown as IUser).username,
          senderAvatar: (message.sender as unknown as IUser).avatar,
          timestamp: message.createdAt,
          type: message.messageType,
          status: "deleted",
        }
      });
    }
  } catch (error) {
    console.error('Error sending WebSocket event:', error);
  }

  res.status(200).json(successResponse(null, 'Message deleted successfully'));
};

export const markMessageAsRead = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw new AppError('Message not found', 404);
  await message.markAsRead(req.userId!);
  res.status(200).json(successResponse(null, 'Message marked as read'));
};

export const updateMessage = editMessage;

export const markAllMessagesAsRead = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const groupId = req.body.groupId;
  if (!groupId) throw new AppError('Missing groupId parameter', 400);
  const count = await Message.markAllAsRead(req.userId!, groupId);
  res.status(200).json(successResponse({ count }, 'All messages marked as read'));
};

export const markGroupMessagesAsRead = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const { groupId } = req.params;
  const userId = req.userId!;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const group = await Group.findById(groupId);
  if (!group || !group.members.some((m: IGroupMember) => m.user.toString() === userId)) {
    res.status(403).json({ success: false, message: 'Access denied' });
    return;
  }

  const result = await Message.updateMany(
    {
      group: groupId,
      isDeleted: false,
      sender: { $ne: userId },
      $or: [
        { readBy: { $exists: false } },
        { readBy: { $not: { $elemMatch: { user: userId } } } }
      ]
    },
    {
      $addToSet: {
        readBy: {
          user: userId,
          readAt: new Date()
        }
      }
    }
  );

  res.json({
    success: true,
    data: { 
      modifiedCount: result.modifiedCount,
      message: 'Messages marked as read'
    }
  });
};

export const getUnreadMessages = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const messages = await Message.getUnreadMessages(req.userId!, req.query.groupId as string);
  res.status(200).json(successResponse(messages, 'Unread messages retrieved'));
};

export const searchMessages = async (req: express.Request, res: express.Response<IApiResponse>) => {
  try {
    const { groupId, q } = req.query;
    const messages = await Message.searchMessages(groupId as string, q as string, req.query);
    res.status(200).json(successResponse(messages, 'Search results'));
  } catch (error) {
    console.error('searchMessages error:', error);
  }
};

export const getMessageStats = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const groupId = req.query.groupId;
  if (!groupId) throw new AppError('Missing groupId parameter', 400);
  const stats = await Message.getStatistics(groupId as string);
  res.status(200).json(successResponse(stats, 'Message statistics retrieved'));
};

export const getMostActiveUsers = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const groupId = req.query.groupId;
  if (!groupId) throw new AppError('Missing groupId parameter', 400);
  const users = await Message.getMostActiveUsers(groupId as string);
  res.status(200).json(successResponse(users, 'Most active users retrieved'));
};

export const getMessageReadStatus = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const message = await Message.findById(req.params.id).populate('readBy.user', 'username firstName lastName avatar');
  if (!message) throw new AppError('Message not found', 404);
  res.status(200).json(successResponse(message.readBy, 'Read status retrieved'));
};

export const getMessagesByType = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const messages = await Message.find({
    group: req.params.groupId,
    messageType: req.params.type,
    isDeleted: false
  }).sort({ createdAt: -1 });
  res.status(200).json(successResponse(messages, 'Messages by type retrieved'));
};

export const getRecentMessages = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const messages = await Message.find({
    group: req.params.groupId,
    isDeleted: false
  }).sort({ createdAt: -1 }).limit(10);
  res.status(200).json(successResponse(messages, 'Recent messages retrieved'));
};

export const exportMessages = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const messages = await Message.find({
    group: req.params.groupId,
    isDeleted: false
  }).sort({ createdAt: 1 });
  res.status(200).json(successResponse(messages, 'Messages exported'));
};

// New function: Get unread count and last read message in one call
export const getUnreadCountAndLastRead = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const { groupId } = req.params;
  const userId = req.userId!;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  // Check if user is member of the group
  const group = await Group.findById(groupId);
  if (!group || !group.members.some((m: IGroupMember) => m.user.toString() === userId)) {
    res.status(403).json({ success: false, message: 'Access denied' });
    return;
  }

  // Get unread count
  const unreadCount = await Message.countDocuments({
    group: groupId,
    isDeleted: false,
    sender: { $ne: userId },
    $or: [
      { readBy: { $exists: false } },                    // Messages with no readBy array
      { readBy: { $not: { $elemMatch: { user: userId } } } }  // Messages where current user is not in readBy
    ]
  });


  // Get last read message - find the message with the latest createdAt that the user has read
  const lastReadMessage = await Message.findOne({
    group: groupId,
    isDeleted: false,
    'readBy.user': userId
  })
  .sort({ createdAt: -1 })
  .select('_id content createdAt readBy')
  .populate('sender', 'username firstName lastName avatar');

  res.json({
    success: true,
    data: { 
      unreadCount,
      lastReadMessage
    }
  });
};
