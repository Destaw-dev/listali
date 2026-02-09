import express from 'express';
import { validationResult } from 'express-validator';
import { Types } from 'mongoose';
import ShoppingList from '../models/shoppingList';
import Group from '../models/group';
import Item from '../models/item';
import {Category} from '../models/category';
import User from '../models/user';
import {ShoppingSession} from '../models/shoppingSession';
import { AppError, validationErrorResponse, successResponse } from '../middleware/handlers';
import { IApiResponse, IGroupMember, IShoppingListResponseData,  IShoppingList } from '../types';
import { MIGRATION_CONSTANTS } from '../constants/migration';
import { sendLocalizedPushToGroupExceptUserWithPreference } from '../utils/pushNotifications';

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

  const creator = await User.findById(userId).select('username');
  await sendLocalizedPushToGroupExceptUserWithPreference(
    group._id.toString(),
    userId,
    {
      key: 'listCreated',
      vars: {
        username: creator?.username || 'user',
        listName: name
      },
      url: `/groups/${groupId}/${shoppingList._id.toString()}`,
      tag: `list:${shoppingList._id.toString()}`,
      renotify: true,
      data: {
        listId: shoppingList._id.toString(),
        groupId: groupId
      },
      actions: [
        {
          action: 'open-list',
          title: name || 'Open List',
          icon: '/icon-192.svg'
        }
      ]
    },
    'shoppingListUpdates'
  );

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

/**
 * Migrate guest lists to authenticated user
 * Creates a default group for the user if needed, then creates shopping lists and items
 */
export const migrateGuestLists = async (
  req: express.Request,
  res: express.Response<IApiResponse<{ listsCreated: number; itemsCreated: number } | null>>
) => {
  const userId = req.userId!;
  const { guestLists } = req.body;

  if (!guestLists || !Array.isArray(guestLists)) {
    res.status(400).json({
      success: false,
      message: 'guestLists array is required',
    });
    return;
  }

  if (guestLists.length === 0) {
    res.status(200).json(successResponse({ listsCreated: 0, itemsCreated: 0 }, 'No lists to migrate'));
    return;
  }

  try {
    // Find or create a default personal group for the user
    let userGroup = await Group.findOne({
      owner: userId,
      name: MIGRATION_CONSTANTS.DEFAULT_GROUP_NAME,
    });

    if (!userGroup) {
      userGroup = await Group.create({
        name: MIGRATION_CONSTANTS.DEFAULT_GROUP_NAME,
        description: MIGRATION_CONSTANTS.DEFAULT_GROUP_DESCRIPTION,
        owner: userId,
        settings: {
          allowMemberInvite: false,
          requireApproval: false,
          maxMembers: 20,
        },
        members: [{
          user: userId,
          role: 'owner',
          joinedAt: new Date(),
          permissions: {
            canCreateLists: true,
            canEditLists: true,
            canDeleteLists: true,
            canInviteMembers: false,
            canManageMembers: false,
          },
        }],
      });

      // Add group to user's groups array
      await User.findByIdAndUpdate(userId, { $push: { groups: userGroup._id } });
    }

    let totalListsCreated = 0;
    let totalItemsCreated = 0;

    // Migrate each guest list
    for (const guestList of guestLists) {
      try {
        // Create shopping list using data from client
        const shoppingList = await ShoppingList.create({
          name: guestList.title,
          description: guestList.description,
          group: userGroup._id,
          createdBy: userId,
          priority: guestList.priority,
          tags: [],
          status: guestList.status,
        });

        // Add list to group
        userGroup.shoppingLists.push(shoppingList._id);
        totalListsCreated++;

        // Migrate items using data from client only
        if (guestList.items && Array.isArray(guestList.items) && guestList.items.length > 0) {
          const itemsToCreate = [];
          
          for (const guestItem of guestList.items) {
            // All required data must come from client
            if (!guestItem.name) {
              console.warn(`Skipping item without name in list ${guestList.id}`);
              continue;
            }
            
            if (!guestItem.unit) {
              console.warn(`Skipping item ${guestItem.name} without unit in list ${guestList.id}`);
              continue;
            }
            
            if (!guestItem.categoryId) {
              console.warn(`Skipping item ${guestItem.name} without categoryId in list ${guestList.id}`);
              continue;
            }
            
            // Validate category exists
            const category = await Category.findById(guestItem.categoryId);
            if (!category) {
              console.warn(`Category ${guestItem.categoryId} not found for item ${guestItem.name}`);
              continue;
            }
            console.log('guestItem', guestItem);  

            // Safely parse numeric values with defaults
            const quantity = Number(guestItem.quantity) || 1;
            const purchasedQuantity = Number(guestItem.purchasedQuantity) || 0;
            const quantityToPurchase = Math.max(0, quantity - purchasedQuantity);

            if (guestItem.checked) {
              itemsToCreate.push({
                name: guestItem.name,
                quantity: quantity,
                unit: guestItem.unit,
                category: guestItem.categoryId,
                shoppingList: shoppingList._id,
                addedBy: userId,
                status: 'purchased',
                isManualEntry: false,
                purchasedAt: guestItem.purchasedAt ? new Date(guestItem.purchasedAt) : null,
                product: guestItem.productId,
                brand: guestItem.brand,
                isPartiallyPurchased: false,
                purchasedQuantity: purchasedQuantity,
                purchasedBy: userId,
                createdAt: new Date(guestItem.createdAt),
                quantityToPurchase: 0,
              });
            }else {
              itemsToCreate.push({
                name: guestItem.name,
                quantity: quantity,
                unit: guestItem.unit,
                category: guestItem.categoryId,
                shoppingList: shoppingList._id,
                addedBy: userId,
                status: 'pending',
                isManualEntry: false,
                createdAt: new Date(guestItem.createdAt),
                product: guestItem.productId,
                brand: guestItem.brand,
                isPartiallyPurchased: purchasedQuantity > 0 && purchasedQuantity < quantity,
                purchasedQuantity: purchasedQuantity,
                quantityToPurchase: quantityToPurchase,
              });
            }
            

          }
          
          if (itemsToCreate.length > 0) {
            const createdItems = await Item.insertMany(itemsToCreate);
            shoppingList.items = createdItems.map(item => item._id);
            await shoppingList.save();
            totalItemsCreated += createdItems.length;
          }
        }
      } catch (error) {
        console.error(`Error migrating guest list ${guestList.id}:`, error);
        // Continue with next list even if one fails
      }
    }

    // Save group updates
    await userGroup.save();

    res.status(200).json(
      successResponse(
        { listsCreated: totalListsCreated, itemsCreated: totalItemsCreated },
        `Successfully migrated ${totalListsCreated} lists with ${totalItemsCreated} items`
      )
    );
  } catch (error) {
    console.error('Migration error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to migrate guest lists', 500);
  }
};
