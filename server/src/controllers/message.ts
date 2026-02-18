import express from 'express';
import { validationResult } from 'express-validator';
import Message from '../models/message';

const stripHtml = (str: string): string => str.replace(/<[^>]*>/g, '').trim();
import Group from '../models/group';
import { io } from '../app';
import { AppError, validationErrorResponse, successResponse } from '../middleware/handlers';
import { IApiResponse, IGroupMember, PopulatedSender, IGroup, IMessage, PopulatedMessage, PopulatedMessageWithGroup, IReadStatus, IBaseMessage, IMessageStatistic } from '../types';
import { errorResponse } from '../middleware/handlers';
import { sendLocalizedPushToGroupExceptUserWithPreference } from '../utils/pushNotifications';

export const getMessages = async (req: express.Request, res: express.Response<IApiResponse<{ messages: IMessage[]; hasMore: boolean } | null | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const { page = 1, limit = 50, before, after, messageType, search, includeDeleted = false } = req.query;
  const groupId = req.params.groupId;
  const group = await Group.findById(groupId);
  if (!group || !group.members.some((m: IGroupMember) => m.user.toString() === req.userId)) throw new AppError('Access denied to this group', 403);

  const options = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    before: before as string,
    after: after as string,
    messageType: messageType as IBaseMessage['messageType'],
    search: search as string,
    includeDeleted: includeDeleted === 'true' ? true : false
  };

  const messages = await Message.findByGroup(groupId as string, options);

  res.status(200).json(successResponse({ messages, hasMore: messages.length === options.limit }, 'Messages retrieved successfully'));
};

export const createMessage = async (req: express.Request, res: express.Response<IApiResponse<PopulatedMessage | null | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const { content, groupId, messageType = 'text', metadata = {} } = req.body;
  const userId = req.userId!;

  const group = await Group.findById(groupId);
  if (!group || !group.members.some((m: IGroupMember) => m.user.toString() === userId)) throw new AppError('Access denied to this group', 403);

  const sanitizedContent = stripHtml(content);

  const message = await Message.create({
    content: sanitizedContent,
    sender: userId,
    group: groupId,
    messageType,
    metadata,
    readBy: [{ user: userId, readAt: new Date() }]
  });

  const populatedMessage = await Message.findById(message._id)
    .populate<{ sender: PopulatedSender }>('sender', 'username firstName lastName avatar')
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
          senderId: populatedMessage.sender._id.toString(),
          senderName: populatedMessage.sender.username,
          senderAvatar: populatedMessage.sender.avatar,
          timestamp: populatedMessage.createdAt,
          type: populatedMessage.messageType,
          status: "delivered",
        }
      });
    }
  } catch (error) {
    console.error('Error sending WebSocket event:', error);
  }

  if (populatedMessage && populatedMessage.messageType === 'text') {
    const messagePreview = populatedMessage.content.length > 50 
      ? populatedMessage.content.substring(0, 50) + '...'
      : populatedMessage.content;

    await sendLocalizedPushToGroupExceptUserWithPreference(
      groupId,
      userId,
      {
        key: 'newMessage',
        vars: {
          username: populatedMessage.sender.username,
          messagePreview: messagePreview
        },
        url: `/groups/${groupId}?tab=chat`,
        tag: `group:${groupId}`,
        renotify: true,
        data: {
          groupId: groupId,
          messageId: populatedMessage._id.toString()
        },
        actions: [
          {
            action: 'open-group',
            title: 'Open Group',
            icon: '/icon-192.svg'
          }
        ]
      },
      'newMessageNotifications'
    );
  }

  res.status(201).json(successResponse(populatedMessage, 'Message created successfully'));
};

export const getMessageById = async (req: express.Request, res: express.Response<IApiResponse<PopulatedMessageWithGroup | null>>) => {
  const message = await Message.findById(req.params.id).populate<{ sender: PopulatedSender }>('sender', 'username firstName lastName avatar').populate<{ group: IGroup }>('group', 'name members').populate('metadata.itemId', 'name').populate('metadata.listId', 'name').populate('readBy.user', 'username firstName lastName');

  if (!message) throw new AppError('Message not found', 404);

  const group = message.group as IGroup;
  if (!group || !('members' in group) || !group.members.some((m: IGroupMember) => m.user.toString() === req.userId)) {
    throw new AppError('Access denied to this message', 403);
  }


  res.status(200).json(successResponse(message as PopulatedMessageWithGroup, 'Message retrieved successfully'));
};

export const editMessage = async (req: express.Request, res: express.Response<IApiResponse<PopulatedMessage | null | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const message = await Message.findById(req.params.id).populate<{ group: IGroup }>('group', 'members');
  if (!message) throw new AppError('Message not found', 404);

  const group = message.group as IGroup;
  if (!group || !('members' in group) || !group.members.some((m: IGroupMember) => m.user.toString() === req.userId)) {
    throw new AppError('Access denied to this message', 403);
  }

  const { content } = req.body;
  await message.editMessage(stripHtml(content), req.userId!);

  const updatedMessage = await Message.findById(message._id)
    .populate<{ sender: PopulatedSender }>('sender', 'username firstName lastName avatar')
    .populate('metadata.itemId', 'name')
    .populate('metadata.listId', 'name');

  try {
    if (io && updatedMessage) {
      io.to(`group:${group._id.toString()}`).emit('chat:message', {
        groupId: group._id.toString(),
        message: {
          id: updatedMessage._id.toString(),
          content: updatedMessage.content,
          senderId: updatedMessage.sender._id.toString(),
          senderName: updatedMessage.sender.username,
          senderAvatar: updatedMessage.sender.avatar,
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

export const deleteMessage = async (req: express.Request, res: express.Response<IApiResponse<null | void>>) => {
  const message = await Message.findById(req.params.id).populate<{ group: IGroup; sender: PopulatedSender }>([
    { path: 'group', select: 'name members' },
    { path: 'sender', select: 'username firstName lastName avatar' }
  ]);
  if (!message) throw new AppError('Message not found', 404);

  const group = message.group as IGroup;
  if (!group || !('members' in group) || !group.members.some((m: IGroupMember) => m.user.toString() === req.userId)) {
    throw new AppError('Access denied to this message', 403);
  }

  try {
    await message.deleteMessage(req.userId!);
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(error.message, 400);
    }
    throw error;
  }

  try {
    if (io) {
      const sender = message.sender as PopulatedSender;
      io.to(`group:${group._id.toString()}`).emit('chat:message', {
        groupId: group._id.toString(),
        message: {
          id: message._id.toString(),
          content: 'this message has been deleted',
          senderId: sender._id.toString(),
          senderName: sender.username,
          senderAvatar: sender.avatar,
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

export const markMessageAsRead = async (req: express.Request, res: express.Response<IApiResponse<null | void>>) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw new AppError('Message not found', 404);
  await message.markAsRead(req.userId!);
  res.status(200).json(successResponse(null, 'Message marked as read'));
};

export const markMessagesAsReadBatch = async (req: express.Request, res: express.Response<IApiResponse<{ modifiedCount: number; messageIds: string[] } | null>>) => {
  const { messageIds } = req.body;
  const userId = req.userId!;

  if (!userId) {
    res.status(401).json(errorResponse('unauthorized', 401));
    return;
  }

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    res.status(400).json(errorResponse('messageIds must be a non-empty array', 400));
    return;
  }

  const validMessageIds = messageIds.filter((id: string) => {
    try {
      return typeof id === 'string' && id.length > 0;
    } catch {
      return false;
    }
  });

  if (validMessageIds.length === 0) {
    res.status(400).json(errorResponse('No valid message IDs provided', 400));
    return;
  }

  const result = await Message.markMessagesAsReadBatch(userId, validMessageIds);

  res.json(successResponse({
    modifiedCount: result.modifiedCount,
    messageIds: result.messageIds
  }, 'Messages marked as read'));
};

export const updateMessage = editMessage;

export const markAllMessagesAsRead = async (req: express.Request, res: express.Response<IApiResponse<{ count: number } | null >>) => {
  const groupId = req.body.groupId;
  if (!groupId) throw new AppError('Missing groupId parameter', 400);
  const count = await Message.markAllAsRead(req.userId!, groupId);
  res.status(200).json(successResponse({ count }, 'All messages marked as read'));
};

export const markGroupMessagesAsRead = async (req: express.Request, res: express.Response<IApiResponse<{ modifiedCount: number } | null >>) => {
  const { groupId } = req.params;
  const userId = req.userId!;

  if (!userId) {
    res.status(401).json(errorResponse('unauthorized', 401));
    return;
  }

  const group = await Group.findById(groupId);
  if (!group || !group.members.some((m: IGroupMember) => m.user.toString() === userId)) {
    res.status(403).json(errorResponse('access denied', 403));
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

  res.json(successResponse({
    modifiedCount: result.modifiedCount,
    message: 'Messages marked as read'
  }, 'Messages marked as read'));
};

export const getUnreadMessages = async (req: express.Request, res: express.Response<IApiResponse<IMessage[] >>) => {
  const messages = await Message.getUnreadMessages(req.userId!, req.query.groupId as string);
  res.status(200).json(successResponse(messages, 'Unread messages retrieved'));
};

export const searchMessages = async (req: express.Request, res: express.Response<IApiResponse<IMessage[] | null>>) => {
  try {
    const { groupId, q } = req.query;
    const messages = await Message.searchMessages(groupId as string, q as string, req.query);
    res.status(200).json(successResponse(messages, 'Search results'));
  } catch (error) {
    res.status(500).json(errorResponse('error searching messages', 500, error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getMessageStats = async (req: express.Request, res: express.Response<IApiResponse<IMessageStatistic[] | null>>) => {
  const groupId = req.query.groupId;
  if (!groupId) throw new AppError('Missing groupId parameter', 400);
  const stats = await Message.getStatistics(groupId as string);
  res.status(200).json(successResponse(stats, 'Message statistics retrieved'));
};

export const getMostActiveUsers = async (req: express.Request, res: express.Response<IApiResponse<IMessage[] | null>>) => {
  const groupId = req.query.groupId;
  if (!groupId) throw new AppError('Missing groupId parameter', 400);
  const users = await Message.getMostActiveUsers(groupId as string);
  res.status(200).json(successResponse(users, 'Most active users retrieved'));
};

export const getMessageReadStatus = async (req: express.Request, res: express.Response<IApiResponse<IReadStatus[] | null>>) => {
  const message = await Message.findById(req.params.id).populate('readBy.user', 'username firstName lastName avatar');
  if (!message) throw new AppError('Message not found', 404);
  res.status(200).json(successResponse(message.readBy, 'Read status retrieved'));
};

export const getMessagesByType = async (req: express.Request, res: express.Response<IApiResponse<IMessage[] | null>>) => {
  const messages = await Message.find({
    group: req.params.groupId,
    messageType: req.params.type,
    isDeleted: false
  }).sort({ createdAt: -1 });
  res.status(200).json(successResponse(messages, 'Messages by type retrieved'));
};

export const getRecentMessages = async (req: express.Request, res: express.Response<IApiResponse<IMessage[]>>) => {
  const messages = await Message.find({
    group: req.params.groupId,
    isDeleted: false
  }).sort({ createdAt: -1 }).limit(10);
  res.status(200).json(successResponse(messages, 'Recent messages retrieved'));
};

export const exportMessages = async (req: express.Request, res: express.Response<IApiResponse<IMessage[] >>) => {
  const messages = await Message.find({
    group: req.params.groupId,
    isDeleted: false
  }).sort({ createdAt: 1 });
  res.status(200).json(successResponse(messages, 'Messages exported'));
};

export const getUnreadCountAndLastRead = async (req: express.Request, res: express.Response<IApiResponse<{ unreadCount: number; lastReadMessage: PopulatedMessage | null } | null>>) => {
  const { groupId } = req.params;
  const userId = req.userId!;

  if (!userId) {
    res.status(401).json(errorResponse('unauthorized', 401));
    return;
  }

  const group = await Group.findById(groupId);
  if (!group || !group.members.some((m: IGroupMember) => m.user.toString() === userId)) {
    res.status(403).json(errorResponse('access denied', 403));
    return;
  }

  const unreadCount = await Message.countDocuments({
    group: groupId,
    isDeleted: false,
    sender: { $ne: userId },
    $or: [
      { readBy: { $exists: false } },
      { readBy: { $not: { $elemMatch: { user: userId } } } }
    ]
  });


  const lastReadMessage = await Message.findOne({
    group: groupId,
    isDeleted: false,
    'readBy.user': userId
  })
  .sort({ createdAt: -1 })
  .select('_id content createdAt readBy')
  .populate<{ sender: PopulatedSender }>('sender', 'username firstName lastName avatar');

  res.json(successResponse({
    unreadCount,
    lastReadMessage: lastReadMessage as PopulatedMessage | null
  }, 'Unread count and last read message retrieved'));
};
