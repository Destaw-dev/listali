import { Request, Response } from 'express';
import { ShoppingSession } from '../models/shoppingSession';
import ShoppingList from '../models/shoppingList';
import Item from '../models/item';
import { AppError } from '../middleware/handlers';
import { getIO, emitToGroupExcept } from '../socket/socketHandler';
import { Types } from 'mongoose';
import { IGroup, IGroupMember } from '../types';
import { sendLocalizedPushToGroupExceptUser } from '../utils/pushNotifications';

export const startShopping = async (req: Request, res: Response) => {
  try {
    const { listId, location } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new AppError('User not authenticated', 401);
    if (!listId) throw new AppError('List ID is required', 400);

    const listObjId = new Types.ObjectId(listId);
    const userObjId = new Types.ObjectId(userId);

    const existingSession = await ShoppingSession.findOne({
      userId: userObjId,
      isActive: true,
      status: { $in: ['active', 'paused'] }
    });

    if (existingSession) {
      throw new AppError('You already have an active shopping session', 400);
    }

    const shoppingList = await ShoppingList.findById(listObjId)
      .populate<{ group: IGroup }>('group', 'members');

    if (!shoppingList) {
      return res.status(404).json({ success: false, message: 'Shopping list not found' });
    }

    if (shoppingList.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Shopping list is not active' });
    }

    const group = shoppingList.group;
    if (!group?.members) {
      return res.status(403).json({ success: false, message: 'Access denied to this shopping list' });
    }

    const isMember = group.members.some((m: IGroupMember) => {
      const memberUserId =
        (m.user?._id ?? m.user)
      return String(memberUserId) === String(userObjId);
    });

    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied to this shopping list' });
    }

    const totalItems = await Item.countDocuments({
      shoppingList: listObjId,
      status: { $ne: 'purchased' }
    });

    const shoppingSession = new ShoppingSession({
      listId: listObjId,
      userId: userObjId,
      groupId: shoppingList.group._id,
      location,
      totalItems,
      itemsPurchased: 0
    });

    await shoppingSession.save();


    const io = getIO();
    if (io) {
      emitToGroupExcept(
        io,
        String(shoppingList.group._id),
        String(userObjId),
        'shopping:started',
        {
          listId: String(listObjId),
          user: {
            id: String(userObjId),
            username: req.user?.username,
            firstName: req.user?.firstName,
            lastName: req.user?.lastName,
            avatar: req.user?.avatar
          },
          startedAt: shoppingSession.startedAt,
          sessionId: shoppingSession._id
        }
      );
    }

    await sendLocalizedPushToGroupExceptUser(
      String(shoppingList.group._id),
      String(userObjId),
      {
        key: 'started',
        vars: {
          username: req.user?.username || 'user'
        },
        url: `/groups/${shoppingList.group._id.toString()}/${String(listObjId)}`,
        tag: `list:${String(listObjId)}`,
        renotify: true,
        data: {
          listId: String(listObjId),
          groupId: String(shoppingList.group._id),
          sessionId: shoppingSession._id.toString()
        }
      }
    );

    return res.status(201).json({
      success: true,
      data: {
        sessionId: shoppingSession._id,
        startedAt: shoppingSession.startedAt,
        totalItems,
        location: shoppingSession.location
      },
      message: 'Shopping session started successfully'
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const errorWithExtras = err as Error & { 
      name?: string; 
      code?: number; 
      errors?: Record<string, { message: string }>; 
      path?: string;
    };
    
    console.error('startShopping error:', {
      name: errorWithExtras?.name,
      message: errorWithExtras?.message,
      code: errorWithExtras?.code,
      errors: errorWithExtras?.errors,
      stack: errorWithExtras?.stack
    });

    if (error instanceof AppError) throw error;

    if (errorWithExtras?.name === 'CastError') {
      throw new AppError(`Invalid ID format for field "${errorWithExtras?.path}"`, 400);
    }

    if (errorWithExtras?.name === 'ValidationError' && errorWithExtras?.errors) {
      const msgs = Object.values(errorWithExtras.errors).map((e) => e.message);
      throw new AppError(`Validation failed: ${msgs.join('; ')}`, 400);
    }

    throw new AppError('Failed to start shopping session', 500);
  }
};


export const stopShopping = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    if (!sessionId) {
      throw new AppError('Session ID is required', 400);
    }

    const shoppingSession = await ShoppingSession.findById(sessionId);
    if (!shoppingSession) {
      throw new AppError('Shopping session not found', 404);
    }

    if (shoppingSession.userId.toString() !== userId.toString()) {
      throw new AppError('Access denied to this shopping session', 403);
    }

    if (!shoppingSession.isActive) {
      throw new AppError('Shopping session is already inactive', 400);
    }

    shoppingSession.isActive = false;
    shoppingSession.endedAt = new Date();
    shoppingSession.status = 'completed';
    shoppingSession.shoppingTime = Math.round((Date.now() - shoppingSession.startedAt.getTime()) / (1000 * 60));
    await shoppingSession.save();

    const io = getIO();
    if (io) {
      const _roomName = `group:${shoppingSession.groupId.toString()}`;
      
      emitToGroupExcept(
        io,
        shoppingSession.groupId.toString(),
        userId,
        'shopping:stopped',
        {
          listId: shoppingSession.listId,
          user: {
            id: userId,
            username: req.user?.username,
            firstName: req.user?.firstName,
            lastName: req.user?.lastName,
            avatar: req.user?.avatar
          },
          stoppedAt: shoppingSession.endedAt,
          sessionId: shoppingSession._id,
          itemsPurchased: shoppingSession.itemsPurchased,
          totalItems: shoppingSession.totalItems,
          shoppingTime: shoppingSession.shoppingTime
        }
      );
    }

    await sendLocalizedPushToGroupExceptUser(
      shoppingSession.groupId.toString(),
      userId,
      {
        key: 'stopped',
        vars: {
          username: req.user?.username || 'user'
        },
        url: `/groups/${shoppingSession.groupId.toString()}/${shoppingSession.listId.toString()}`,
        tag: `list:${shoppingSession.listId.toString()}`,
        renotify: true,
        data: {
          listId: shoppingSession.listId.toString(),
          groupId: shoppingSession.groupId.toString(),
          sessionId: shoppingSession._id.toString()
        }
      }
    );

    res.json({
      success: true,
      data: {
        sessionId: shoppingSession._id,
        endedAt: shoppingSession.endedAt,
        itemsPurchased: shoppingSession.itemsPurchased,
        totalItems: shoppingSession.totalItems,
        shoppingTime: shoppingSession.shoppingTime
      },
      message: 'Shopping session ended successfully'
    });

  } catch (error) {
    console.error('stopShopping error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to stop shopping session', 500);
  }
};

export const pauseShopping = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    if (!sessionId) {
      throw new AppError('Session ID is required', 400);
    }

    const shoppingSession = await ShoppingSession.findById(sessionId);
    if (!shoppingSession) {
      throw new AppError('Shopping session not found', 404);
    }

    if (shoppingSession.userId !== userId) {
      throw new AppError('Access denied to this shopping session', 403);
    }

    if (shoppingSession.status !== 'active') {
      throw new AppError('Shopping session is not active', 400);
    }

    shoppingSession.status = 'paused';
    shoppingSession.lastActivity = new Date();
    await shoppingSession.save();

    const io = getIO();
    if (io) {
      const _roomName = `group:${shoppingSession.groupId.toString()}`;
      
      emitToGroupExcept(
        io,
        shoppingSession.groupId.toString(),
        userId,
        'shopping:paused',
        {
          listId: shoppingSession.listId,
          user: {
            id: userId,
            username: req.user?.username,
            firstName: req.user?.firstName,
            lastName: req.user?.lastName,
            avatar: req.user?.avatar
          },
          pausedAt: shoppingSession.lastActivity,
          sessionId: shoppingSession._id
        }
      );
    }

    await sendLocalizedPushToGroupExceptUser(
      shoppingSession.groupId.toString(),
      userId,
      {
        key: 'paused',
        vars: {
          username: req.user?.username || 'user'
        },
        url: `/groups/${shoppingSession.groupId.toString()}/${shoppingSession.listId.toString()}`,
        tag: `list:${shoppingSession.listId.toString()}`,
        renotify: true,
        data: {
          listId: shoppingSession.listId.toString(),
          groupId: shoppingSession.groupId.toString(),
          sessionId: shoppingSession._id.toString()
        }
      }
    );

    res.json({
      success: true,
      data: {
        sessionId: shoppingSession._id,
        status: shoppingSession.status,
        pausedAt: shoppingSession.lastActivity
      },
      message: 'Shopping session paused successfully'
    });

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to pause shopping session', 500);
  }
};

export const resumeShopping = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    if (!sessionId) {
      throw new AppError('Session ID is required', 400);
    }

    const shoppingSession = await ShoppingSession.findById(sessionId);
    if (!shoppingSession) {
      throw new AppError('Shopping session not found', 404);
    }

    if (shoppingSession.userId !== userId) {
      throw new AppError('Access denied to this shopping session', 403);
    }

    if (shoppingSession.status !== 'paused') {
      throw new AppError('Shopping session is not paused', 400);
    }

    shoppingSession.status = 'active';
    shoppingSession.lastActivity = new Date();
    await shoppingSession.save();

    const io = getIO();
    if (io) {
      const _roomName = `group:${shoppingSession.groupId.toString()}`;
      
      emitToGroupExcept(
        io,
        shoppingSession.groupId.toString(),
        userId,
        'shopping:resumed',
        {
          listId: shoppingSession.listId,
          user: {
            id: userId,
            username: req.user?.username,
            firstName: req.user?.firstName,
            lastName: req.user?.lastName,
            avatar: req.user?.avatar
          },
          resumedAt: shoppingSession.lastActivity,
          sessionId: shoppingSession._id
        }
      );
    }

    await sendLocalizedPushToGroupExceptUser(
      shoppingSession.groupId.toString(),
      userId,
      {
        key: 'resumed',
        vars: {
          username: req.user?.username || 'user'
        },
        url: `/groups/${shoppingSession.groupId.toString()}/${shoppingSession.listId.toString()}`,
        tag: `list:${shoppingSession.listId.toString()}`,
        renotify: true,
        data: {
          listId: shoppingSession.listId.toString(),
          groupId: shoppingSession.groupId.toString(),
          sessionId: shoppingSession._id.toString()
        }
      }
    );

    res.json({
      success: true,
      data: {
        sessionId: shoppingSession._id,
        status: shoppingSession.status,
        resumedAt: shoppingSession.lastActivity
      },
      message: 'Shopping session resumed successfully'
    });

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to resume shopping session', 500);
  }
};

export const updateShoppingLocation = async (req: Request, res: Response) => {
  try {
    const { sessionId, location } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    if (!sessionId) {
      throw new AppError('Session ID is required', 400);
    }

    if (!location) {
      throw new AppError('Location data is required', 400);
    }

    const shoppingSession = await ShoppingSession.findById(sessionId);
    if (!shoppingSession) {
      throw new AppError('Shopping session not found', 404);
    }

    if (shoppingSession.userId !== userId) {
      throw new AppError('Access denied to this shopping session', 403);
    }

    if (!shoppingSession.isActive) {
      throw new AppError('Shopping session is not active', 400);
    }

    shoppingSession.location = location;
    shoppingSession.lastActivity = new Date();
    await shoppingSession.save();

    const io = getIO();
    if (io) {
      const _roomName = `group:${shoppingSession.groupId.toString()}`;
      
      emitToGroupExcept(
        io,
        shoppingSession.groupId.toString(),
        userId,
        'shopping:location_updated',
        {
          listId: shoppingSession.listId,
          user: {
            id: userId,
            username: req.user?.username,
            firstName: req.user?.firstName,
            lastName: req.user?.lastName,
            avatar: req.user?.avatar
          },
          location: shoppingSession.location,
          sessionId: shoppingSession._id
        }
      );
    }

    res.json({
      success: true,
      data: {
        sessionId: shoppingSession._id,
        location: shoppingSession.location,
        updatedAt: shoppingSession.lastActivity
      },
      message: 'Shopping location updated successfully'
    });

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update shopping location', 500);
  }
}; 

export const getCurrentUserSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { listId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    if (!listId) {
      throw new AppError('List ID is required', 400);
    }

    const session = await ShoppingSession.findOne({
      userId,
      listId,
      isActive: true
    });

    if (!session) {
      res.json({
        success: true,
        data: null,
        message: 'No active shopping session'
      });
      return;
    }

    res.json({
      success: true,
      data: session,
      message: 'Active shopping session found'
    });

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get shopping session', 500);
  }
};

export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    if (!listId) {
      throw new AppError('List ID is required', 400);
    }

    const sessions = await ShoppingSession.find({
      listId,
      isActive: true
    }).populate('userId', 'username firstName lastName avatar');

    res.json({
      success: true,
      data: sessions,
      message: 'Active sessions retrieved successfully'
    });

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get active sessions', 500);
  }
};

export const getShoppingStats = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    if (!listId) {
      throw new AppError('List ID is required', 400);
    }

    const totalItems = await Item.countDocuments({ shoppingList: listId });
    const purchasedItems = await Item.countDocuments({ 
      shoppingList: listId, 
      status: 'purchased' 
    });
    const remainingItems = totalItems - purchasedItems;
    const progress = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalItems,
        purchasedItems,
        remainingItems,
        progress
      },
      message: 'Shopping statistics retrieved successfully'
    });

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get shopping statistics', 500);
  }
}; 

export const getShoppingListData = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    if (!listId) {
      throw new AppError('List ID is required', 400);
    }

    const shoppingList = await ShoppingList.findById(listId).populate<{ group: IGroup }>('group');
    if (!shoppingList) {
      throw new AppError('Shopping list not found', 404);
    }

    const group = shoppingList.group as IGroup;
    const isMember = group.members.some(
      (member: IGroupMember) => member.user.toString() === userId
    );
    if (!isMember) {
      throw new AppError('Access denied to this shopping list', 403);
    }

    const items = await Item.find({ shoppingList: listId }).sort({ createdAt: 1 });

    const currentUserSession = await ShoppingSession.findOne({
      userId,
      listId,
      isActive: true
    });

    const activeSessions = await ShoppingSession.find({
      listId,
      isActive: true
    }).populate('userId', 'username firstName lastName avatar');

    const totalItems = items.length;
    const purchasedItems = items.filter(item => item.status === 'purchased').length;
    const remainingItems = totalItems - purchasedItems;
    const progress = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;

    res.json({
      success: true,
      data: {
        shoppingList,
        items,
        currentUserSession,
        activeSessions,
        statistics: {
          totalItems,
          purchasedItems,
          remainingItems,
          progress
        }
      },
      message: 'Shopping list data retrieved successfully'
    });

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get shopping list data', 500);
  }
}; 