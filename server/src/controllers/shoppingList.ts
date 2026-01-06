import express from 'express';
import { validationResult } from 'express-validator';
import { Types } from 'mongoose';
import ShoppingList from '../models/shoppingList';
import Group from '../models/group';
import Item from '../models/item';
import {ShoppingSession} from '../models/shoppingSession';
import { AppError, validationErrorResponse, successResponse } from '../middleware/handlers';
import { IApiResponse, IGroupMember, IShoppingListResponseData,  IShoppingList } from '../types';

export const getGroupShoppingLists = async (req: express.Request, res: express.Response<IApiResponse<IShoppingList[]>>) => {
  const { groupId } = req.params;
  const userId = req.userId!;

  if (!groupId) {
    throw new AppError('Group ID is required', 400);
  }

  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  const isMember = group.members.some((member: IGroupMember) => 
    member.user.toString() === userId
  );

  if (!isMember) {
    throw new AppError('You are not a member of this group', 403);
  }

  const shoppingLists = await ShoppingList.findByGroup(groupId);
  res.status(200).json(successResponse(shoppingLists, 'Shopping lists retrieved successfully'));
};

export const getShoppingList = async (req: express.Request, res: express.Response<IApiResponse<IShoppingListResponseData>>) => {
  const { listId } = req.params;
  const { include } = req.query;
  const userId = req.userId!;

  const includes = include ? String(include).split(',') : [];

  const shoppingList = await ShoppingList.findById(listId)
    .populate('createdBy', 'username firstName lastName avatar')
    .populate('assignedTo', 'username firstName lastName avatar')
    .populate('group', 'name description avatar');

  if (!shoppingList) {
    throw new AppError('Shopping list not found', 404);
  }

  const group = await Group.findById(shoppingList.group);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  const isMember = group.members.some((member: IGroupMember) => 
    member.user.toString() === userId
  );

  if (!isMember) {
    throw new AppError('You are not a member of this group', 403);
  }

  const response: IApiResponse<IShoppingListResponseData> = {
    success: true,
    data: {
      shoppingList: {
        _id: shoppingList._id,
        name: shoppingList.name,
        description: shoppingList.description,
        status: shoppingList.status,
        priority: shoppingList.priority,
        tags: shoppingList.tags,
        metadata: shoppingList.metadata,
        group: shoppingList.group,
        createdBy: shoppingList.createdBy,
        assignedTo: shoppingList.assignedTo,
        createdAt: shoppingList.createdAt,
        updatedAt: shoppingList.updatedAt
      }
    }
  };

  if (includes.includes('items')) {
    const items = await Item.find({ shoppingList: listId })
      .populate('addedBy', 'username firstName lastName avatar')
      .populate('purchasedBy', 'username firstName lastName avatar')
      .populate('product', 'name image barcode brand')
      .populate('category', 'name')
      .lean();
    
    if (response.data) {
      response.data.items = items.map(item => {
        const mappedItem: {
          _id: Types.ObjectId;
          name: string;
          description?: string;
          quantity: number;
          purchasedQuantity?: number;
          unit: string;
          category: Types.ObjectId | { _id: Types.ObjectId; name: string };
          brand?: string;
          estimatedPrice?: number;
          actualPrice?: number;
          image?: string;
          status: string;
          priority: string;
          notes?: string;
          isPurchased: boolean;
          purchasedBy?: Types.ObjectId | { _id: Types.ObjectId; username: string; firstName: string; lastName: string; avatar?: string };
          purchasedAt?: Date;
          addedBy: Types.ObjectId | { _id: Types.ObjectId; username: string; firstName: string; lastName: string; avatar?: string };
          product?: Types.ObjectId | { _id: Types.ObjectId; name: string; image?: string; barcode?: string; brand?: string };
          createdAt: Date;
        } = {
          _id: item._id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          status: item.status,
          priority: item.priority,
          isPurchased: item.status === 'purchased',
          addedBy: item.addedBy,
          createdAt: item.createdAt
        };
        
        if (item.description !== undefined && item.description !== null) {
          mappedItem.description = item.description;
        }
        if (item.purchasedQuantity !== undefined && item.purchasedQuantity !== null) {
          mappedItem.purchasedQuantity = item.purchasedQuantity;
        }
        if (item.brand !== undefined && item.brand !== null) {
          mappedItem.brand = item.brand;
        }
        if (item.estimatedPrice !== undefined && item.estimatedPrice !== null) {
          mappedItem.estimatedPrice = item.estimatedPrice;
        }
        if (item.actualPrice !== undefined && item.actualPrice !== null) {
          mappedItem.actualPrice = item.actualPrice;
        }
        if (item.image !== undefined && item.image !== null) {
          mappedItem.image = item.image;
        }
        if (item.notes !== undefined && item.notes !== null) {
          mappedItem.notes = item.notes;
        }
        if (item.purchasedBy !== undefined && item.purchasedBy !== null) {
          mappedItem.purchasedBy = item.purchasedBy;
        }
        if (item.purchasedAt !== undefined && item.purchasedAt !== null) {
          mappedItem.purchasedAt = item.purchasedAt;
        }
        if (item.product !== undefined && item.product !== null) {
          mappedItem.product = item.product;
        }
        
        return mappedItem;
      });
    }
  }

  if (includes.includes('stats')) {
    const items = await Item.find({ shoppingList: listId });
    const purchasedItems = items.filter(item => item.status === 'purchased').length;
    const totalItems = items.length;
    
    if (response.data) {
      response.data.stats = {
      totalItems,
      purchasedItems,
      remainingItems: totalItems - purchasedItems,
      progress: totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0
    };
    }
  }

  if (includes.includes('session')) {
    const shoppingSessions = await ShoppingSession.find({ 
      listId: listId, 
      isActive: true 
    }).populate('userId', 'username firstName lastName avatar');
    
    const currentUserSession = shoppingSessions.find(
      session => session.userId?._id.toString() === userId.toString()
    );
    
    const activeSessions = shoppingSessions.filter(
      session => session.status === 'active'
    );
    
    if (response.data) {
      response.data.shoppingSession = {
        currentUserSession: currentUserSession || null,
        activeSessions,
        totalActiveSessions: activeSessions.length
      };
    }
  }

  res.status(200).json(successResponse(response.data, 'Shopping list retrieved successfully'));
};

export const createShoppingList = async (req: express.Request, res: express.Response<IApiResponse<IShoppingList | void | null>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const { name, description, priority = 'medium', tags = [], assignedTo } = req.body;
  const { groupId } = req.params;
  const userId = req.userId!;

  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  const isMember = group.members.some((member: IGroupMember) => 
    member.user.toString() === userId
  );

  if (!isMember) {
    throw new AppError('You are not a member of this group', 403);
  }

  if (assignedTo) {
    const isAssignedUserMember = group.members.some((member: IGroupMember) => 
      member.user.toString() === assignedTo
    );
    if (!isAssignedUserMember) {
      throw new AppError('Assigned user is not a member of this group', 400);
    }
  }

  const shoppingList = await ShoppingList.create({
    name,
    description,
    group: groupId,
    createdBy: userId,
    priority,
    tags,
    assignedTo
  });

  group.shoppingLists.push(shoppingList._id);
  await group.save();

  const populatedList = await ShoppingList.findById(shoppingList._id)
    .populate('createdBy', 'username firstName lastName avatar')
    .populate('assignedTo', 'username firstName lastName avatar')
    .populate('items');

  res.status(201).json(successResponse(populatedList, 'Shopping list created successfully'));
};

export const updateShoppingList = async (req: express.Request, res: express.Response<IApiResponse<IShoppingList | null | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const { listId } = req.params;
  const { name, description, priority, tags, assignedTo } = req.body;
  const userId = req.userId!;

  const shoppingList = await ShoppingList.findById(listId);
  if (!shoppingList) {
    throw new AppError('Shopping list not found', 404);
  }

  const group = await Group.findById(shoppingList.group);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  const isMember = group.members.some((member: IGroupMember) => 
    member.user.toString() === userId
  );

  if (!isMember) {
    throw new AppError('You are not a member of this group', 403);
  }

  if (name !== undefined) shoppingList.name = name;
  if (description !== undefined) shoppingList.description = description;
  if (priority !== undefined) shoppingList.priority = priority;
  if (tags !== undefined) shoppingList.tags = tags;
  if (assignedTo !== undefined) {
    shoppingList.assignedTo = assignedTo === null ? null : assignedTo;
  }

  await shoppingList.save();

  const updatedList = await ShoppingList.findById(listId)
    .populate('createdBy', 'username firstName lastName avatar')
    .populate('assignedTo', 'username firstName lastName avatar')
    .populate('items');

  res.status(200).json(successResponse(updatedList, 'Shopping list updated successfully'));
};

export const deleteShoppingList = async (req: express.Request, res: express.Response<IApiResponse<null>>) => {
  const { listId } = req.params;
  const userId = req.userId!;

  const shoppingList = await ShoppingList.findById(listId);
  if (!shoppingList) {
    throw new AppError('Shopping list not found', 404);
  }

  const group = await Group.findById(shoppingList.group);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  const member = group.members.find((m: IGroupMember) => m.user.toString() === userId);
  if (!member) {
    throw new AppError('You are not a member of this group', 403);
  }

  const isCreator = shoppingList.createdBy.toString() === userId;
  const hasAdminPermissions = member.role === 'admin' || member.role === 'owner';

  if (!isCreator && !hasAdminPermissions) {
    throw new AppError('You do not have permission to delete this shopping list', 403);
  }

  await Group.findByIdAndUpdate(shoppingList.group, { $pull: { shoppingLists: shoppingList._id } });
  await Item.deleteMany({ shoppingList: shoppingList._id });
  await shoppingList.deleteOne();

  res.status(200).json(successResponse(null, 'Shopping list deleted successfully'));
};

export const addItemToList = async (req: express.Request, res: express.Response<IApiResponse<IShoppingList | null | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const { listId } = req.params;
  const { name, quantity = 1, unit, product, category, priority = 'medium', notes, estimatedPrice, actualPrice } = req.body;
  const userId = req.userId!;

  const shoppingList = await ShoppingList.findById(listId);
  if (!shoppingList) {
    throw new AppError('Shopping list not found', 404);
  }

  const group = await Group.findById(shoppingList.group);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  const isMember = group.members.some((member: IGroupMember) => 
    member.user.toString() === userId
  );

  if (!isMember) {
    throw new AppError('You are not a member of this group', 403);
  }

  const item = await Item.create({
    name,
    quantity,
    unit,
    product,
    category,
    priority,
    notes,
    estimatedPrice,
    actualPrice,
    addedBy: userId,
    shoppingList: listId
  });

  await shoppingList.addItem(item._id.toString());

  const updatedList = await ShoppingList.findById(listId)
    .populate('createdBy', 'username firstName lastName avatar')
    .populate('assignedTo', 'username firstName lastName avatar')
    .populate({
      path: 'items',
      populate: {
        path: 'addedBy purchasedBy',
        select: 'username firstName lastName avatar'
      }
    });

  res.status(200).json(successResponse(updatedList, 'Item added successfully'));
};

export const removeItemFromList = async (req: express.Request, res: express.Response<IApiResponse<IShoppingList | null>>) => {
  const { listId, itemId } = req.params;
  const userId = req.userId!;

  const shoppingList = await ShoppingList.findById(listId);
  if (!shoppingList) {
    throw new AppError('Shopping list not found', 404);
  }

  const group = await Group.findById(shoppingList.group);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  const isMember = group.members.some((member: IGroupMember) => 
    member.user.toString() === userId
  );

  if (!isMember) {
    throw new AppError('You are not a member of this group', 403);
  }

  if (!itemId) {
    throw new AppError('Item ID is required', 400);
  }
  await shoppingList.removeItem(itemId);

  await Item.findByIdAndDelete(itemId);

  const updatedList = await ShoppingList.findById(listId)
    .populate('createdBy', 'username firstName lastName avatar')
    .populate('assignedTo', 'username firstName lastName avatar')
    .populate({
      path: 'items',
      populate: {
        path: 'addedBy purchasedBy',
        select: 'username firstName lastName avatar'
      }
    });

  res.status(200).json(successResponse(updatedList, 'Item removed successfully'));
};

export const completeShoppingList = async (req: express.Request, res: express.Response<IApiResponse<IShoppingList | null>>) => {
  const { listId } = req.params;
  const userId = req.userId!;

  const shoppingList = await ShoppingList.findById(listId);
  if (!shoppingList) {
    throw new AppError('Shopping list not found', 404);
  }

  const group = await Group.findById(shoppingList.group);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  const isMember = group.members.some((member: IGroupMember) => 
    member.user.toString() === userId
  );

  if (!isMember) {
    throw new AppError('You are not a member of this group', 403);
  }

  await shoppingList.complete();

  const updatedList = await ShoppingList.findById(listId)
    .populate('createdBy', 'username firstName lastName avatar')
    .populate('assignedTo', 'username firstName lastName avatar')
    .populate('items');

  res.status(200).json(successResponse(updatedList, 'Shopping list completed successfully'));
};

