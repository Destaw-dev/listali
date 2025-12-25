// controllers/shoppingListController.ts
import express from 'express';
import { validationResult } from 'express-validator';
import ShoppingList from '../models/shoppingList';
import Group from '../models/group';
import Item from '../models/item';
import {ShoppingSession} from '../models/shoppingSession';
import { AppError, validationErrorResponse, successResponse } from '../middleware/errorHandler';
import { IApiResponse, IGroupMember } from '../types';

// Get all shopping lists for a group
export const getGroupShoppingLists = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const { groupId } = req.params;
  const userId = req.userId!;

  if (!groupId) {
    throw new AppError('Group ID is required', 400);
  }

  // Check if user is a member of the group
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

// Get a specific shopping list
export const getShoppingList = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const { listId } = req.params;
  const { include } = req.query;
  const userId = req.userId!;

  // Parse include parameter
  const includes = include ? String(include).split(',') : [];

  // Base query - only fetch shopping list details
  const shoppingList = await ShoppingList.findById(listId)
    .populate('createdBy', 'username firstName lastName avatar')
    .populate('assignedTo', 'username firstName lastName avatar')
    .populate('group', 'name description avatar');

  if (!shoppingList) {
    throw new AppError('Shopping list not found', 404);
  }

  // Check if user is a member of the group
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

  // Prepare response
  const response: IApiResponse = {
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

  // Include items if requested
  if (includes.includes('items')) {
    const items = await Item.find({ shoppingList: listId })
      .populate('addedBy', 'username firstName lastName avatar')
      .populate('purchasedBy', 'username firstName lastName avatar')
      .populate('product', 'name image barcode brand')
      .populate('category', 'name')
      .lean();
    
    response.data.items = items.map(item => ({
      _id: item._id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      brand: item.brand,
      estimatedPrice: item.estimatedPrice,
      actualPrice: item.actualPrice,
      image: item.image,
      status: item.status,
      priority: item.priority,
      notes: item.notes,
      isPurchased: item.status === 'purchased',
      purchasedBy: item.purchasedBy,
      purchasedAt: item.purchasedAt,
      addedBy: item.addedBy,
      product: item.product,
      createdAt: item.createdAt
    }));
  }

  // Include stats if requested
  if (includes.includes('stats')) {
    const items = await Item.find({ shoppingList: listId });
    const purchasedItems = items.filter(item => item.status === 'purchased').length;
    const totalItems = items.length;
    
    response.data.stats = {
      totalItems,
      purchasedItems,
      remainingItems: totalItems - purchasedItems,
      progress: totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0
    };
  }

  // Include session if requested
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
    
    response.data.shoppingSession = {
      currentUserSession,
      activeSessions,
      totalActiveSessions: activeSessions.length
    };
  }

  res.status(200).json(response);
};

// Create a new shopping list
export const createShoppingList = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const { name, description, priority = 'medium', dueDate, tags = [], assignedTo } = req.body;
  const { groupId } = req.params;
  const userId = req.userId!;

  // Check if user is a member of the group
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

  // Check if assignedTo is a member of the group
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
    dueDate,
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

// Update a shopping list
export const updateShoppingList = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const { listId } = req.params;
  const { name, description, priority, dueDate, tags, assignedTo } = req.body;
  const userId = req.userId!;

  const shoppingList = await ShoppingList.findById(listId);
  if (!shoppingList) {
    throw new AppError('Shopping list not found', 404);
  }

  // Check if user is a member of the group
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

  // Update allowed fields
  if (name !== undefined) shoppingList.name = name;
  if (description !== undefined) shoppingList.description = description;
  if (priority !== undefined) shoppingList.priority = priority;
  if (dueDate !== undefined) shoppingList.dueDate = dueDate;
  if (tags !== undefined) shoppingList.tags = tags;
  if (assignedTo !== undefined) shoppingList.assignedTo = assignedTo;

  await shoppingList.save();

  const updatedList = await ShoppingList.findById(listId)
    .populate('createdBy', 'username firstName lastName avatar')
    .populate('assignedTo', 'username firstName lastName avatar')
    .populate('items');

  res.status(200).json(successResponse(updatedList, 'Shopping list updated successfully'));
};

// Delete a shopping list
export const deleteShoppingList = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const { listId } = req.params;
  const userId = req.userId!;

  const shoppingList = await ShoppingList.findById(listId);
  if (!shoppingList) {
    throw new AppError('Shopping list not found', 404);
  }

  // Check if user is the creator or has admin permissions
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

  // remove from group and delete
  await Group.findByIdAndUpdate(shoppingList.group, { $pull: { shoppingLists: shoppingList._id } });
  await Item.deleteMany({ shoppingList: shoppingList._id });
  await shoppingList.deleteOne();

  res.status(200).json(successResponse(null, 'Shopping list deleted successfully'));
};

// Add item to shopping list
export const addItemToList = async (req: express.Request, res: express.Response<IApiResponse>) => {
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

  // Check if user is a member of the group
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

  // Create the item
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

  // Add item to shopping list
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

// Remove item from shopping list
export const removeItemFromList = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const { listId, itemId } = req.params;
  const userId = req.userId!;

  const shoppingList = await ShoppingList.findById(listId);
  if (!shoppingList) {
    throw new AppError('Shopping list not found', 404);
  }

  // Check if user is a member of the group
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

  // Delete the item
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

// Complete shopping list
export const completeShoppingList = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const { listId } = req.params;
  const userId = req.userId!;

  const shoppingList = await ShoppingList.findById(listId);
  if (!shoppingList) {
    throw new AppError('Shopping list not found', 404);
  }

  // Check if user is a member of the group
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

