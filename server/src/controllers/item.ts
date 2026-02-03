import express from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Item from '../models/item';
import ShoppingList from '../models/shoppingList';
import Group from '../models/group';
import Product from '../models/product';
import Message from '../models/message';
import { AppError, validationErrorResponse, successResponse } from '../middleware/handlers';
import { 
  ItemCategory, 
  IApiResponse, 
  IGroup, 
  IGroupMember, 
  IItem, 
  ICategoryStats, 
  ItemUnit,
  PopulatedShoppingListWithGroup,
  PopulatedSender,
  PopulatedItemWithShoppingList
} from '../types';
import { UNITS } from '../middleware/validation';
import { io } from '../app';
import { emitToGroupExcept, getIO } from '../socket/socketHandler';

const verifyShoppingListAccess = async (shoppingListId: string, userId: string) => {
  const shoppingList = await ShoppingList.findById(shoppingListId).populate<{ group: IGroup }>('group');
  if (!shoppingList) throw new AppError('Shopping list not found', 404);
  const group = shoppingList.group as IGroup;
  if (!group || !('members' in group) || !group.members.some((m: IGroupMember) => m.user.toString() === userId)) {
    throw new AppError('Access denied', 403);
  }
  return { shoppingList, group };
};

export const getItems = async (req: express.Request, res: express.Response<IApiResponse<IItem[] | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const { shoppingListId, status, category, priority, search, sort = 'createdAt' } = req.query;
  await verifyShoppingListAccess(shoppingListId as string, req.userId!);
  const options = { 
    status: status as string, 
    category: category as string, 
    priority: priority as string, 
    search: search as string, 
    sort: sort as string,
    populateProduct: true
  };
  const items = await Item.findByShoppingList(shoppingListId as string, options);
  res.status(200).json(successResponse(items, 'Items retrieved successfully'));
};

export const createItem = async (req: express.Request, res: express.Response<IApiResponse<IItem | null | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const { 
    name, 
    description, 
    quantity, 
    unit, 
    category, 
    brand, 
    estimatedPrice, 
    priority, 
    notes, 
    alternatives, 
    shoppingListId,
    product: productId,
    isManualEntry = true
  } = req.body;
  
  const userId = req.userId!;
  const { shoppingList, group } = await verifyShoppingListAccess(shoppingListId, userId);
  if (!group.hasPermission(userId, 'canEditLists')) throw new AppError('Insufficient permissions', 403);

  let resolvedIsManualEntry = isManualEntry;
  let resolvedProductId: string | null = null;
  let resolvedCategory = category;
  let resolvedName = name;
  let resolvedBrand = brand;
  let resolvedEstimatedPrice = estimatedPrice;

  if (typeof category === 'string' && !mongoose.Types.ObjectId.isValid(category)) {
    const { Category } = await import('../models/category');
    let categoryDoc = await Category.getByNameEn(category.toLowerCase());
    if (!categoryDoc) {
      categoryDoc = await Category.create({
        name: category,
        nameEn: category.toLowerCase(),
        icon: '📦',
        color: '#808080',
        sortOrder: 999,
        isActive: true
      });
    }
    resolvedCategory = categoryDoc._id.toString();
  }

  if (typeof productId === 'string' && mongoose.Types.ObjectId.isValid(productId)) {
    const productDoc = await Product.findById(productId)
      .select('_id name brand price averagePrice categoryId subCategoryId image')
      .lean();

    if (productDoc) {
      resolvedProductId = productDoc._id.toString();
      resolvedIsManualEntry = false;

      resolvedCategory = productDoc.categoryId?.toString() ?? resolvedCategory;

      if (!resolvedName) resolvedName = productDoc.name;
      if (!resolvedBrand) resolvedBrand = productDoc.brand;
      if (resolvedEstimatedPrice == null) {
        resolvedEstimatedPrice = productDoc.price ?? productDoc.averagePrice ?? undefined;
      }
    }
  }

  const itemData = {
    name: resolvedName,
    description,
    quantity,
    unit,
    category: resolvedCategory,
    brand: resolvedBrand,
    estimatedPrice: resolvedEstimatedPrice,
    priority: priority || 'medium',
    notes,
    alternatives: alternatives || [],
    shoppingList: shoppingListId,
    addedBy: userId,
    product: resolvedProductId,
    isManualEntry: resolvedIsManualEntry,
    quantityToPurchase: quantity
  };

  const item = await Item.create(itemData);
  await shoppingList.addItem(item._id.toString());
  const listId = shoppingListId;

  const user = await (await import('../models/user')).default.findById(userId);
  await Message.createItemUpdateMessage(group._id.toString(), item._id.toString(), 'add', user?.username || 'משתמש', listId);
  
  const populatedItem = await Item.findById(item._id)
    .populate('addedBy', 'username firstName lastName avatar')
    .populate('category', 'name nameEn icon color')
    .populate('product', 'name brand image averagePrice price categoryId subCategoryId');

  const freshList = await ShoppingList.findById(shoppingListId)
    .populate('createdBy', 'username firstName lastName avatar')
    .populate('assignedTo', 'username firstName lastName avatar');

  const io = getIO();
  if (io && populatedItem) {
    emitToGroupExcept(io, group._id.toString(), userId, 'item:updated', {
      itemId: populatedItem._id.toString(),
      action: 'created',
      item: populatedItem,
      updatedBy: { id: userId, username: user?.username || 'user' },
      timestamp: new Date(),
      updates: {
        status: 'pending',
        isPurchased: false,
      },
      listName: freshList?.name || '',
      listId: shoppingListId
    });

    emitToGroupExcept(io, group._id.toString(), userId, 'list:updated', {
      listId: shoppingListId,
      groupId: group._id.toString(),
      action: 'item_added',
      list: freshList,
      updatedBy: { id: userId, username: user?.username || 'user' },
      timestamp: new Date()
    });
  }
    
  res.status(201).json(successResponse(populatedItem, 'Item created successfully'));
};

export const getItemById = async (req: express.Request, res: express.Response<IApiResponse<PopulatedItemWithShoppingList | null>>) => {
  const item = await Item.findById(req.params.id)
    .populate('addedBy purchasedBy', 'username firstName lastName avatar')
    .populate('category', 'name nameEn icon color')
    .populate('product', 'name brand image averagePrice price categoryId subCategoryId')
    .populate<{ shoppingList: PopulatedShoppingListWithGroup }>({ path: 'shoppingList', populate: { path: 'group', select: 'members' } });
    
  if (!item) throw new AppError('Item not found', 404);
  const populatedItem = item as PopulatedItemWithShoppingList;
  const group = populatedItem.shoppingList.group;
  if (!group || !group.members || !group.members.some((m: IGroupMember) => m.user.toString() === req.userId)) throw new AppError('Access denied', 403);
  res.status(200).json(successResponse(populatedItem, 'Item retrieved successfully'));
};

export const updateItem = async (req: express.Request, res: express.Response<IApiResponse<IItem | null | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const item = await Item.findById(req.params.id).populate<{ shoppingList: PopulatedShoppingListWithGroup }>({ path: 'shoppingList', populate: { path: 'group' } });
  if (!item) throw new AppError('Item not found', 404);

  if (!item.shoppingList || !item.shoppingList.group) {
    throw new AppError('Shopping list or group not found', 404);
  }
  
  const group = item.shoppingList.group;
  const userId = req.userId!;
  
  if (!group || !group.members || !group.members.some((m: IGroupMember) => m.user.toString() === userId)) {
    throw new AppError('Access denied', 403);
  }
  
  if (!group.hasPermission(userId, 'canEditLists')) {
    throw new AppError('Insufficient permissions', 403);
  }

  const allowedUpdates: (keyof IItem)[] = ['name', 'description', 'quantity', 'unit', 'category', 'brand', 'estimatedPrice', 'actualPrice', 'priority', 'notes', 'alternatives', 'product', 'isManualEntry'];
  const updates = Object.keys(req.body) as (keyof IItem)[];
  if (!updates.every(update => allowedUpdates.includes(update))) throw new AppError('Invalid updates', 400);

  for (const update of updates) {
    if (allowedUpdates.includes(update)) {
      switch (update) {
        case 'name':
          item.name = req.body.name;
          break;
        case 'description':
          item.description = req.body.description;
          break;
        case 'quantity':
          item.quantity = req.body.quantity;
          break;
        case 'unit':
          item.unit = req.body.unit;
          break;
        case 'category':
          item.category = req.body.category;
          break;
        case 'brand':
          item.brand = req.body.brand;
          break;
        case 'estimatedPrice':
          item.estimatedPrice = req.body.estimatedPrice;
          break;
        case 'actualPrice':
          item.actualPrice = req.body.actualPrice;
          break;
        case 'priority':
          item.priority = req.body.priority;
          break;
        case 'notes':
          item.notes = req.body.notes;
          break;
        case 'alternatives':
          item.alternatives = req.body.alternatives;
          break;
        case 'product':
          item.product = req.body.product;
          break;
        case 'isManualEntry':
          item.isManualEntry = req.body.isManualEntry;
          break;
      }
    }
  }

  await item.save();

  const listId = item.shoppingList._id.toString();
  if (updates.includes('name') || updates.includes('quantity')) {
    const user = await (await import('../models/user')).default.findById(req.userId);
    await Message.createItemUpdateMessage(group._id.toString(), item._id.toString(), 'update', user?.username || 'משתמש', listId);
  }

  const updatedItem = await Item.findById(item._id)
    .populate('addedBy purchasedBy', 'username firstName lastName avatar')
    .populate('category', 'name nameEn icon color')
    .populate('product', 'name brand image averagePrice price categoryId subCategoryId');
  res.status(200).json(successResponse(updatedItem, 'Item updated successfully'));
};

export const deleteItem = async (req: express.Request, res: express.Response<IApiResponse<null | void>>) => {
  const item = await Item.findById(req.params.id).populate<{ shoppingList: PopulatedShoppingListWithGroup }>({ path: 'shoppingList', populate: { path: 'group' } });
  if (!item) throw new AppError('Item not found', 404);
  
  if (!item.shoppingList || !item.shoppingList.group) {
    throw new AppError('Shopping list or group not found', 404);
  }
  
  const group = item.shoppingList.group;
  const userId = req.userId!;
  
  if (!group || !group.members || !group.members.some((m: IGroupMember) => m.user.toString() === userId)) {
    throw new AppError('Access denied', 403);
  }
  
  if (item.addedBy.toString() !== userId && !group.hasPermission(userId, 'canDeleteLists')) {
    throw new AppError('Insufficient permissions', 403);
  }

  const shoppingListDoc = await ShoppingList.findById(item.shoppingList._id);
  if (shoppingListDoc) {
    await shoppingListDoc.removeItem(item._id.toString());
  }
  await Item.findByIdAndDelete(item._id);
  const listId = item.shoppingList._id.toString();

  const user = await (await import('../models/user')).default.findById(userId);
  const message = await Message.createItemUpdateMessage(group._id.toString(), item._id.toString(), 'delete', user?.username || 'משתמש', listId);

  const populatedMessage = await Message.findById(message._id)
    .populate<{ sender: PopulatedSender }>('sender', 'username firstName lastName avatar')
    .populate('metadata.itemId', 'name')
    .populate('metadata.listId', 'name');

  if (io) {
    if (populatedMessage) {
      io.to(`group:${group._id.toString()}`).emit('chat:message', {
        groupId: group._id.toString(),
        message: {
          id: populatedMessage._id.toString(),
          content: populatedMessage.content,
          senderId: populatedMessage.sender?._id?.toString() || 'system',
          senderName: populatedMessage.sender?.username || 'System',
          senderAvatar: populatedMessage.sender?.avatar,
          timestamp: populatedMessage.createdAt,
          type: populatedMessage.messageType,
          status: "delivered",
          metadata: populatedMessage.metadata
        }
      });
    }
  }

  res.status(200).json(successResponse(null, 'Item deleted successfully'));
};

export const purchaseItem = async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(validationErrorResponse(errors.array()));
  }

  const item = await Item.findById(req.params.id)
    .populate<{ shoppingList: PopulatedShoppingListWithGroup }>({ path: 'shoppingList', populate: { path: 'group' } });

  if (!item) throw new AppError('Item not found', 404);

  const userId = req.userId!;
  const group = item.shoppingList.group;

  if (!group || !group.members || !group.members.some((m: IGroupMember) => m.user.toString() === userId)) {
    throw new AppError('Access denied', 403);
  }
  
  if (item.status === 'purchased') {
    throw new AppError('Item is already purchased', 400);
  }
  
  const currentPurchasedQty = item.purchasedQuantity || 0;
  let finalPurchasedQty: number;
  
  if (req.body.quantityToPurchase !== undefined) {
    const quantityToAdd = parseFloat(String(req.body.quantityToPurchase));
    if (isNaN(quantityToAdd) || quantityToAdd <= 0) {
      throw new AppError('Quantity to purchase must be a positive number', 400);
    }
    finalPurchasedQty = currentPurchasedQty + quantityToAdd;
  } else if (req.body.purchasedQuantity !== undefined) {
    finalPurchasedQty = parseFloat(String(req.body.purchasedQuantity));
    if (isNaN(finalPurchasedQty)) {
      throw new AppError('Purchased quantity must be a valid number', 400);
    }
  } else {
    finalPurchasedQty = item.quantity;
  }
  
  if (finalPurchasedQty < 0 || finalPurchasedQty > item.quantity) {
    throw new AppError('Purchased quantity must be between 0 and total quantity', 400);
  }

  await item.markAsPurchased(userId, finalPurchasedQty, req.body.actualPrice);

  const user = await (await import('../models/user')).default.findById(userId);
  const listId = item.shoppingList._id.toString();
  const message = await Message.createItemUpdateMessage(
    group._id.toString(),
    item._id.toString(),
    'purchase',
    user?.username || 'user',
    listId
  );

  const populatedMessage = await Message.findById(message._id)
    .populate<{ sender: PopulatedSender }>('sender', 'username firstName lastName avatar')
    .populate('metadata.itemId', 'name')
    .populate('metadata.listId', 'name');

  const updatedItem = await Item.findById(item._id)
    .populate('addedBy purchasedBy', 'username firstName lastName avatar')
    .populate('product', 'name brand image');

  if (!updatedItem) {
    throw new AppError('Item not found after update', 404);
  }

  const listDoc = await ShoppingList.findById(listId);
  if (listDoc) {
    await listDoc.updateMetadata();
  }

  const freshList = await ShoppingList.findById(listId)
    .populate('createdBy', 'username firstName lastName avatar')
    .populate('assignedTo', 'username firstName lastName avatar');

    const listName = listDoc?.name || '';

  if (io) {
    emitToGroupExcept(io, group._id.toString(), userId, 'item:updated', {
      itemId: item._id.toString(),
      action: 'purchase',
      item: updatedItem,
      updatedBy: { id: req.userId!, username: user?.username || 'משתמש' },
      timestamp: new Date(),
      updates: {
        status: updatedItem.status,
        isPurchased: updatedItem.status === 'purchased',
        isPartiallyPurchased: updatedItem.status === 'partially_purchased',
        purchasedQuantity: updatedItem.purchasedQuantity || 0,
        purchasedAt: updatedItem.purchasedAt ? new Date(updatedItem.purchasedAt).toISOString() : null,
        purchasedBy: req.userId!,
      },
      listName: listName,
      listId: listId
    });

    emitToGroupExcept(io, group._id.toString(), userId, 'list:updated', {
      listId,
      groupId: group._id.toString(),
      action: 'item_purchased',
      list: freshList,
      updatedBy: { id: userId, username: user?.username || 'user' },
      timestamp: new Date()
    });

    if (populatedMessage) {
      io.to(`group:${group._id.toString()}`).emit('chat:message', {
        groupId: group._id.toString(),
        message: {
          id: populatedMessage._id.toString(),
          content: populatedMessage.content,
          senderId: populatedMessage.sender?._id?.toString() || 'system',
          senderName: populatedMessage.sender?.username || 'System',
          senderAvatar: populatedMessage.sender?.avatar,
          timestamp: populatedMessage.createdAt,
          type: populatedMessage.messageType,
          status: "delivered",
          metadata: populatedMessage.metadata
        }
      });
    }
  }

  return res.status(200).json(successResponse(updatedItem, 'Item marked as purchased'));
};

export const batchPurchaseItems = async (req: express.Request, res: express.Response<IApiResponse<IItem[] | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(validationErrorResponse(errors.array()));
  }

  const { itemIds, shoppingListId } = req.body;

  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    throw new AppError('itemIds must be a non-empty array', 400);
  }

  if (!shoppingListId) {
    throw new AppError('shoppingListId is required', 400);
  }

  const userId = req.userId!;
  
  // Verify shopping list access
  const { shoppingList, group } = await verifyShoppingListAccess(shoppingListId, userId);

  // Get all items and verify they belong to the shopping list
  const items = await Item.find({
    _id: { $in: itemIds },
    shoppingList: shoppingListId
  }).populate<{ shoppingList: PopulatedShoppingListWithGroup }>({ path: 'shoppingList', populate: { path: 'group' } });

  if (items.length !== itemIds.length) {
    throw new AppError('Some items were not found or do not belong to this shopping list', 404);
  }

  // Filter unpurchased items, calculate quantities, and purchase in one pass
  const user = await (await import('../models/user')).default.findById(userId);
  const listId = shoppingListId;
  const itemIdsToPurchase: string[] = [];

  // Single loop: filter, calculate, and purchase (no individual messages)
  const purchasePromises = items
    .filter((item) => {
      if (item.status === 'purchased') return false;
      const currentPurchasedQty = item.purchasedQuantity || 0;
      const totalQty = item.quantity || 1;
      return currentPurchasedQty < totalQty;
    })
    .map(async (item) => {
      const currentPurchasedQty = item.purchasedQuantity || 0;
      const totalQty = item.quantity || 1;
      const remainingQty = totalQty - currentPurchasedQty;
      const finalPurchasedQty = currentPurchasedQty + remainingQty;

      // Purchase item
      await item.markAsPurchased(userId, finalPurchasedQty);
      itemIdsToPurchase.push(item._id.toString());
    });

  if (purchasePromises.length === 0) {
    return res.status(200).json(successResponse([], 'All items are already purchased'));
  }

  // Execute all purchases and message creation in parallel
  await Promise.all(purchasePromises);

  // Get updated items in one query
  const updatedItems = await Item.find({
    _id: { $in: itemIdsToPurchase }
  })
    .populate('addedBy purchasedBy', 'username firstName lastName avatar')
    .populate('category', 'name nameEn icon color')
    .populate('product', 'name brand image averagePrice price categoryId subCategoryId');

  // Build Map for O(1) lookup instead of O(n) find
  const updatedItemsMap = new Map(updatedItems.map(item => [item._id.toString(), item]));

  // Emit socket events
  const io = getIO();
  if (io) {
    const listDoc = await ShoppingList.findById(listId);
    const listName = listDoc?.name || '';
    const freshList = await ShoppingList.findById(listId)
      .populate('createdBy', 'username firstName lastName avatar')
      .populate('assignedTo', 'username firstName lastName avatar');
    const timestamp = new Date();
    const updatedBy = { id: userId, username: user?.username || 'user' };

    // Emit batch item:updated event (one event for all items)
    emitToGroupExcept(io, group._id.toString(), userId, 'items:batch-updated', {
      action: 'batch_purchase',
      items: updatedItems.map(item => ({
        itemId: item._id.toString(),
        item,
        updates: {
          status: item.status,
          isPurchased: item.status === 'purchased',
          isPartiallyPurchased: item.status === 'partially_purchased',
          purchasedQuantity: item.purchasedQuantity || 0,
          purchasedAt: item.purchasedAt ? new Date(item.purchasedAt).toISOString() : null,
          purchasedBy: userId,
        }
      })),
      updatedBy,
      timestamp,
      listName,
      listId
    });

    // Emit list updated event once
    emitToGroupExcept(io, group._id.toString(), userId, 'list:updated', {
      listId,
      groupId: group._id.toString(),
      action: 'items_purchased',
      list: freshList,
      updatedBy,
      timestamp
    });

    // Create single batch chat message instead of N messages
    if (itemIdsToPurchase.length > 0) {
      const batchMessage = await Message.create({
        content: `${user?.username || 'user'} קנה/תה ${itemIdsToPurchase.length} פריטים`,
        sender: null,
        group: group._id.toString(),
        messageType: "item_update",
        metadata: { 
          itemIds: itemIdsToPurchase, 
          listId,
          action: 'batch_purchase',
          count: itemIdsToPurchase.length
        },
      });

      const populatedBatchMessage = await Message.findById(batchMessage._id)
        .populate<{ sender: PopulatedSender }>('sender', 'username firstName lastName avatar');

      if (populatedBatchMessage) {
        io.to(`group:${group._id.toString()}`).emit('chat:message', {
          groupId: group._id.toString(),
          message: {
            id: populatedBatchMessage._id.toString(),
            content: populatedBatchMessage.content,
            senderId: populatedBatchMessage.sender?._id?.toString() || 'system',
            senderName: populatedBatchMessage.sender?.username || 'System',
            senderAvatar: populatedBatchMessage.sender?.avatar,
            timestamp: populatedBatchMessage.createdAt,
            type: populatedBatchMessage.messageType,
            status: "delivered",
            metadata: populatedBatchMessage.metadata
          }
        });
      }
    }
  }

  // Update shopping list stats
  const listDoc = await ShoppingList.findById(listId);
  if (listDoc) {
    await listDoc.updateMetadata();
  }

  return res.status(200).json(successResponse(updatedItems, `${itemIdsToPurchase.length} items purchased successfully`));
};


export const unpurchaseItem = async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(validationErrorResponse(errors.array()));
  }

  const item = await Item.findById(req.params.id)
    .populate<{ shoppingList: PopulatedShoppingListWithGroup }>({ path: 'shoppingList', populate: { path: 'group' } });

  if (!item) throw new AppError('Item not found', 404);

  const userId = req.userId!;
  const group = item.shoppingList.group;

  if (!group || !group.members || !group.members.some((m: IGroupMember) => m.user.toString() === userId)) {
    throw new AppError('Access denied', 403);
  }
  if (item.status !== 'purchased') {
    throw new AppError('Item is not purchased', 400);
  }

  await item.markAsNotPurchased(req.body.quantityToUnpurchase);

  const user = await (await import('../models/user')).default.findById(userId);
  const listId = item.shoppingList._id.toString();
  const message = await Message.createItemUpdateMessage(
    group._id.toString(),
    item._id.toString(),
    'unpurchase',
    user?.username || 'user',
    listId
  );

  const populatedMessage = await Message.findById(message._id)
    .populate<{ sender: PopulatedSender }>('sender', 'username firstName lastName avatar')
    .populate('metadata.itemId', 'name')
    .populate('metadata.listId', 'name');

  const updatedItem = await Item.findById(item._id)
    .populate('addedBy purchasedBy', 'username firstName lastName avatar')
    .populate('product', 'name brand image');


  const listDoc = await ShoppingList.findById(listId);
  if (listDoc) {
    await listDoc.updateMetadata();
  }

  const freshList = await ShoppingList.findById(listId)
    .populate('createdBy', 'username firstName lastName avatar')
    .populate('assignedTo', 'username firstName lastName avatar');

  const listName = listDoc?.name || '';

  if (io) {
    emitToGroupExcept(io, group._id.toString(), userId, 'item:updated', {
      itemId: item._id.toString(),
      action: 'unpurchase',
      item: updatedItem,
      updatedBy: { id: req.userId!, username: user?.username || 'user' },
      timestamp: new Date(),
      updates: {
        status: 'pending',
        isPurchased: false,
        purchasedAt: null,
        purchasedBy: null,
      },
      listName: listName,
      listId: listDoc?._id.toString(),
    });

    emitToGroupExcept(io, group._id.toString(), userId, 'list:updated', {
      listId,
      groupId: group._id.toString(),
      action: 'item_unpurchased',
      list: freshList,
      updatedBy: { id: userId, username: user?.username || 'user' },
      timestamp: new Date()
    });

    if (populatedMessage) {
      io.to(`group:${group._id.toString()}`).emit('chat:message', {
        groupId: group._id.toString(),
        message: {
          id: populatedMessage._id.toString(),
          content: populatedMessage.content,
          senderId: populatedMessage.sender?._id?.toString() || 'system',
          senderName: populatedMessage.sender?.username || 'System',
          senderAvatar: populatedMessage.sender?.avatar,
          timestamp: populatedMessage.createdAt,
          type: populatedMessage.messageType,
          status: "delivered",
          metadata: populatedMessage.metadata
        }
      });
    }
  }

  return res.status(200).json(successResponse(updatedItem, 'Item marked as not purchased'));
};


export const notAvailableItem = async (req: express.Request, res: express.Response<IApiResponse<IItem | null>>) => {
  const item = await Item.findById(req.params.id).populate<{ shoppingList: PopulatedShoppingListWithGroup }>({ path: 'shoppingList', populate: { path: 'group' } });
  if (!item) throw new AppError('Item not found', 404);
  const group = item.shoppingList.group;
  if (!group || !group.members || !group.members.some((m: IGroupMember) => m.user.toString() === req.userId)) throw new AppError('Access denied', 403);
  await item.markAsNotAvailable();

  const updatedItem = await Item.findById(item._id).populate('addedBy purchasedBy', 'username firstName lastName avatar');
  res.status(200).json(successResponse(updatedItem, 'Item marked as not available'));
};

export const updateItemQuantity = async (req: express.Request, res: express.Response<IApiResponse<IItem | null | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const item = await Item.findById(req.params.id).populate<{ shoppingList: PopulatedShoppingListWithGroup }>({ path: 'shoppingList', populate: { path: 'group' } });
  if (!item) throw new AppError('Item not found', 404);
  const group = item.shoppingList.group;
  if (!group || !group.hasPermission(req.userId!, 'canEditLists')) throw new AppError('Insufficient permissions', 403);

  await item.updateQuantity(req.body.quantity);
  const updatedItem = await Item.findById(item._id).populate('addedBy purchasedBy', 'username firstName lastName avatar');
  res.status(200).json(successResponse(updatedItem, 'Item quantity updated'));
};

export const getPopularItems = async (req: express.Request, res: express.Response<IApiResponse<IItem[] | void>>) => {
try {
    const { groupId, limit = 10 } = req.query;
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group || !group.members || !group.members.some((m: IGroupMember) => m.user.toString() === req.userId)) throw new AppError('Access denied', 403);
    }
    const popularItems = await Item.getPopularItems(groupId as string, parseInt(limit as string));
    res.status(200).json(successResponse(popularItems, 'Popular items retrieved'));
  } catch (error) {
    throw new AppError(error instanceof Error ? error.message : 'Failed to get popular items', 500, true);
  }
};

export const searchItems = async (req: express.Request, res: express.Response<IApiResponse<IItem[] | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }
  const { q, category, limit = 20, skip = 0 } = req.query;
  const options = { category: category as ItemCategory, limit: parseInt(limit as string), skip: parseInt(skip as string) };
  const searchResults = await Item.searchItems(q as string, options);
  res.status(200).json(successResponse(searchResults, 'Search results retrieved'));
};

export const getCategoryStats = async (req: express.Request, res: express.Response<IApiResponse<ICategoryStats[] | void>>) => {
  const { shoppingListId } = req.query;
  if (shoppingListId) await verifyShoppingListAccess(shoppingListId as string, req.userId!);
  const stats = await Item.getCategoryStats(shoppingListId as string);
  res.status(200).json(successResponse(stats, 'Category statistics retrieved'));
};

export const getAvailableUnits = async (_req: express.Request, res: express.Response<IApiResponse<{ value: ItemUnit; label: ItemUnit }[]>>) => {
  const units = UNITS.map(unit => ({ value: unit, label: unit }));
  res.status(200).json(successResponse(units, 'Units retrieved'));
};

export const getManualItems = async (req: express.Request, res: express.Response<IApiResponse<IItem[]>>) => {
  const { shoppingListId, limit = 20, skip = 0 } = req.query;
  await verifyShoppingListAccess(shoppingListId as string, req.userId!);
  
  const items = await Item.findManualItems(shoppingListId as string, { 
    limit: parseInt(limit as string), 
    skip: parseInt(skip as string) 
  });
  
  res.status(200).json(successResponse(items, 'Manual items retrieved successfully'));
};

export const getProductBasedItems = async (req: express.Request, res: express.Response<IApiResponse<IItem[]>>) => {
  const { shoppingListId, limit = 20, skip = 0 } = req.query;
  await verifyShoppingListAccess(shoppingListId as string, req.userId!);
  
  const items = await Item.findProductBasedItems(shoppingListId as string, { 
    limit: parseInt(limit as string), 
    skip: parseInt(skip as string) 
  });
  
  res.status(200).json(successResponse(items, 'Product-based items retrieved successfully'));
};

export const getItemsByProduct = async (req: express.Request, res: express.Response<IApiResponse<IItem[]>>) => {
  const { productId, limit = 20, skip = 0 } = req.query;
  
  const items = await Item.findByProduct(productId as string, { 
    limit: parseInt(limit as string), 
    skip: parseInt(skip as string) 
  });
  
  res.status(200).json(successResponse(items, 'Items by product retrieved successfully'));
};

export const createMultipleItems = async (req: express.Request, res: express.Response<IApiResponse<IItem[] | void>>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const { items } = req.body;
  const userId = req.userId!;

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('Items array is required and must not be empty', 400);
  }

  const shoppingListIds = [...new Set(items.map(item => item.shoppingListId))];
  if (shoppingListIds.length !== 1) {
    throw new AppError('All items must belong to the same shopping list', 400);
  }

  const shoppingListId = shoppingListIds[0];
  const { shoppingList, group } = await verifyShoppingListAccess(shoppingListId, userId);
  if (!group.hasPermission(userId, 'canEditLists')) throw new AppError('Insufficient permissions', 403);

  const candidateProductIds: string[] = items
    .map(i => i.product)
    .filter((id): id is string => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id));

  const uniqueProductIds = [...new Set(candidateProductIds)];
  const productDocs = await Product.find({ _id: { $in: uniqueProductIds } })
    .select('_id name brand price averagePrice categoryId subCategoryId image')
    .lean();

  const productById = new Map(productDocs.map(p => [p._id.toString(), p]));

  const createdItems: IItem[] = [];
  const session = await Item.startSession();
  
  try {
    await session.withTransaction(async () => {
      for (const raw of items) {
        const {
          name,
          description,
          quantity,
          unit,
          category,
          brand,
          estimatedPrice,
          priority = 'medium',
          notes,
          alternatives = [],
          product: productId,
          isManualEntry = true
        } = raw;

        if (!name || !quantity) {
          throw new AppError('Name and quantity are required for all items', 400);
        }

        let resolvedProductId: string | null = null;
        let resolvedIsManualEntry = isManualEntry;
        let resolvedCategory = category;
        let resolvedName = name;
        let resolvedBrand = brand;
        let resolvedEstimatedPrice = estimatedPrice;

        if (typeof productId === 'string' && mongoose.Types.ObjectId.isValid(productId)) {
          const p = productById.get(productId);
          if (p) {
            resolvedProductId = productId;
            resolvedIsManualEntry = false;

            resolvedCategory = p.categoryId?.toString() ?? category;

            if (!resolvedName) resolvedName = p.name;
            if (!resolvedBrand) resolvedBrand = p.brand;
            if (resolvedEstimatedPrice == null) {
              resolvedEstimatedPrice = p.price ?? p.averagePrice ?? undefined;
            }
          }
        }

        const [item] = await Item.create([{
          name: resolvedName,
          description,
          quantity,
          unit,
          category: resolvedCategory,
          brand: resolvedBrand,
          estimatedPrice: resolvedEstimatedPrice,
          priority,
          notes,
          alternatives,
          shoppingList: shoppingListId,
          addedBy: userId,
          product: resolvedProductId,
          isManualEntry: resolvedIsManualEntry
        }], { session });

        if (item) {
          const itemId = item._id;
          const itemIdExists = shoppingList.items.some(id => id.toString() === itemId.toString());
          if (!itemIdExists) {
            shoppingList.items.push(itemId);
          }
          createdItems.push(item);
        }
      }
      
      await shoppingList.save({ session });
    });

    const populatedItems = await Item.find({
      _id: { $in: createdItems.map(item => item._id) }
    })
      .populate('addedBy', 'username firstName lastName avatar')
      .populate('category', 'name nameEn icon color')
      .populate('product', 'name brand image averagePrice price categoryId subCategoryId');

    const freshList = await ShoppingList.findById(shoppingListId)
      .populate('createdBy', 'username firstName lastName avatar')
      .populate('assignedTo', 'username firstName lastName avatar');

    const User = (await import('../models/user')).default;
    const user = await User.findById(userId);

    const io = getIO();
    if (io && populatedItems.length > 0) {
      populatedItems.forEach((item) => {
        emitToGroupExcept(io, group._id.toString(), userId, 'item:updated', {
          itemId: item._id.toString(),
          action: 'created',
          item: item,
          updatedBy: { id: userId, username: user?.username || 'user' },
          timestamp: new Date(),
          updates: {
            status: 'pending',
            isPurchased: false,
          },
          listName: freshList?.name || '',
          listId: shoppingListId
        });
      });

      emitToGroupExcept(io, group._id.toString(), userId, 'list:updated', {
        listId: shoppingListId,
        groupId: group._id.toString(),
        action: 'items_added',
        list: freshList,
        updatedBy: { id: userId, username: user?.username || 'user' },
        timestamp: new Date(),
        itemsCount: populatedItems.length
      });
    }

    res.status(201).json(successResponse(populatedItems, `${createdItems.length} items created successfully`));
  } catch (error) {
    throw new AppError(error instanceof Error ? error.message : 'Failed to create items', 500);
  } finally {
    await session.endSession();
  }
};

