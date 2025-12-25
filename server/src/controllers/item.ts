// controllers/itemController.ts
import express from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Item from '../models/item';
import ShoppingList from '../models/shoppingList';
import Group from '../models/group';
import Product from '../models/product';
import Message from '../models/message';
import { AppError, validationErrorResponse, successResponse } from '../middleware/errorHandler';
import { ItemCategory, IApiResponse, IGroup, IGroupMember,  } from '../types';
import { UNITS } from '../middleware/validation';
import { io } from '../app';
import { emitToGroupExcept, getIO } from '@/socket/socketHandler';

const verifyShoppingListAccess = async (shoppingListId: string, userId: string) => {
  const shoppingList = await ShoppingList.findById(shoppingListId).populate('group');
  if (!shoppingList) throw new AppError('Shopping list not found', 404);
  const group = shoppingList.group as unknown as IGroup;
  if (!group.members.some((m: IGroupMember) => m.user.toString() === userId)) throw new AppError('Access denied', 403);
  return { shoppingList, group };
};

export const getItems = async (req: express.Request, res: express.Response<IApiResponse>) => {
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
    populateProduct: true // Always populate product data including images
  };
  const items = await Item.findByShoppingList(shoppingListId as string, options);
  res.status(200).json(successResponse(items, 'Items retrieved successfully'));
};

export const createItem = async (req: express.Request, res: express.Response<IApiResponse>) => {
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

  // --- NEW: verify product & align fields ---
  let resolvedIsManualEntry = isManualEntry;
  let resolvedProductId: string | null = null;
  let resolvedCategory = category;
  let resolvedName = name;
  let resolvedBrand = brand;
  let resolvedEstimatedPrice = estimatedPrice;

  if (typeof productId === 'string' && mongoose.Types.ObjectId.isValid(productId)) {
    const productDoc = await Product.findById(productId)
      .select('_id name brand price averagePrice categoryId subCategoryId image')
      .lean();

    if (productDoc) {
      resolvedProductId = productDoc._id.toString();
      resolvedIsManualEntry = false;

      // prefer product category to keep consistency
      resolvedCategory = productDoc.categoryId?.toString() ?? category;

      // only fill if client didn't send a value
      if (!resolvedName) resolvedName = productDoc.name;
      if (!resolvedBrand) resolvedBrand = productDoc.brand;
      if (resolvedEstimatedPrice == null) {
        resolvedEstimatedPrice = productDoc.price ?? productDoc.averagePrice ?? undefined;
      }
    }
    // else (soft mode): ignore invalid product id and keep manual flags as sent
    // for strict mode -> throw new AppError('Product not found', 400);
  }
  // --- END NEW ---

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
    isManualEntry: resolvedIsManualEntry
  };

  const item = await Item.create(itemData);
  await shoppingList.addItem(item._id.toString());
  const listId = (item.shoppingList as  any)._id.toString();

  const user = await (await import('../models/user')).default.findById(userId);
  await Message.createItemUpdateMessage(group._id.toString(), item._id.toString(), 'add', user?.username || 'משתמש', listId);
  
  const populatedItem = await Item.findById(item._id)
    .populate('addedBy', 'username firstName lastName avatar')
    .populate('category', 'name nameEn icon color')
    .populate('product', 'name brand image averagePrice price categoryId subCategoryId');

  // Get fresh shopping list for WebSocket update
  const freshList = await ShoppingList.findById(shoppingListId)
    .populate('createdBy', 'username firstName lastName avatar')
    .populate('assignedTo', 'username firstName lastName avatar');

  // Send WebSocket events to update other connected users (the user who added will get update via React Query)
  const io = getIO();
  if (io && populatedItem) {
    // Emit item:updated event to other users in the group (not to the one who added it)
    emitToGroupExcept(io, group._id.toString(), userId, 'item:updated', {
      itemId: populatedItem._id.toString(),
      action: 'created',
      item: populatedItem,
      updatedBy: { id: userId, username: user?.username || 'משתמש' },
      timestamp: new Date(),
      updates: {
        status: 'pending',
        isPurchased: false,
      },
      listName: freshList?.name || '',
      listId: shoppingListId
    });

    // Emit list:updated event to refresh the shopping list for other users
    emitToGroupExcept(io, group._id.toString(), userId, 'list:updated', {
      listId: shoppingListId,
      groupId: group._id.toString(),
      action: 'item_added',
      list: freshList,
      updatedBy: { id: userId, username: user?.username || 'משתמש' },
      timestamp: new Date()
    });
  }
    
  res.status(201).json(successResponse(populatedItem, 'Item created successfully'));
};

export const getItemById = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const item = await Item.findById(req.params.id)
    .populate('addedBy purchasedBy', 'username firstName lastName avatar')
    .populate('category', 'name nameEn icon color')
    .populate('product', 'name brand image averagePrice price categoryId subCategoryId')
    .populate({ path: 'shoppingList', populate: { path: 'group', select: 'members' } });
    
  if (!item) throw new AppError('Item not found', 404);
  const group = (item.shoppingList as any).group;
  if (!group.members.some((m: any) => m.user.toString() === req.userId)) throw new AppError('Access denied', 403);
  res.status(200).json(successResponse(item, 'Item retrieved successfully'));
};

export const updateItem = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const item = await Item.findById(req.params.id).populate({ path: 'shoppingList', populate: { path: 'group' } });
  if (!item) throw new AppError('Item not found', 404);

  const group = (item.shoppingList as any).group;
  if (!group.hasPermission(req.userId!, 'canEditLists')) throw new AppError('Insufficient permissions', 403);

  const allowedUpdates = ['name', 'description', 'quantity', 'unit', 'category', 'brand', 'estimatedPrice', 'actualPrice', 'priority', 'notes', 'alternatives', 'product', 'isManualEntry'];
  const updates = Object.keys(req.body);
  if (!updates.every(update => allowedUpdates.includes(update))) throw new AppError('Invalid updates', 400);

  updates.forEach(update => (item as any)[update] = req.body[update]);
  await item.save();

  const listId = (item.shoppingList as any)._id.toString();
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

export const deleteItem = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const item = await Item.findById(req.params.id).populate({ path: 'shoppingList', populate: { path: 'group' } });
  if (!item) throw new AppError('Item not found', 404);
  const group = (item.shoppingList as any).group;
  const userId = req.userId!;
  if (item.addedBy.toString() !== userId && !group.hasPermission(userId, 'canDeleteLists')) throw new AppError('Insufficient permissions', 403);

  await (item.shoppingList as any).removeItem(item._id.toString());
  await Item.findByIdAndDelete(item._id);
  const listId = (item.shoppingList as any)._id.toString();

  const user = await (await import('../models/user')).default.findById(userId);
  const message = await Message.createItemUpdateMessage(group._id.toString(), item._id.toString(), 'delete', user?.username || 'משתמש', listId);

  // Populate the message for WebSocket
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'username firstName lastName avatar')
    .populate('metadata.itemId', 'name')
    .populate('metadata.listId', 'name');

  if (io) {
    // Emit chat message event
    if (populatedMessage) {
      io.to(`group:${group._id.toString()}`).emit('chat:message', {
        groupId: group._id.toString(),
        message: {
          id: populatedMessage._id.toString(),
          content: populatedMessage.content,
          senderId: populatedMessage.sender?._id?.toString() || 'system',
          senderName: (populatedMessage.sender as any)?.username || 'System',
          senderAvatar: (populatedMessage.sender as any)?.avatar,
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
    .populate({ path: 'shoppingList', populate: { path: 'group' } });

  if (!item) throw new AppError('Item not found', 404);

  const userId = req.userId!;
  const group = (item.shoppingList as any).group;

  if (!group.members.some((m: any) => m.user.toString() === userId)) {
    throw new AppError('Access denied', 403);
  }
  
  // Allow purchase even if fully purchased (for updating purchasedQuantity)
  const purchasedQuantity = req.body.purchasedQuantity !== undefined 
    ? parseFloat(req.body.purchasedQuantity) 
    : item.quantity;
  
  // Validate purchasedQuantity
  if (purchasedQuantity < 0 || purchasedQuantity > item.quantity) {
    throw new AppError('Purchased quantity must be between 0 and total quantity', 400);
  }

  await item.markAsPurchased(userId, purchasedQuantity, req.body.actualPrice);

  const user = await (await import('../models/user')).default.findById(userId);
  const listId = (item.shoppingList as any)._id.toString();
  const message = await Message.createItemUpdateMessage(
    group._id.toString(),
    item._id.toString(),
    'purchase',
    user?.username || 'משתמש',
    listId
  );

  // Populate the message for WebSocket
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'username firstName lastName avatar')
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
    // Emit item update event
    emitToGroupExcept(io, group._id.toString(), userId, 'item:updated', {
      itemId: item._id.toString(),
      action: 'purchase',
      item: updatedItem,
      updatedBy: { id: req.userId!, username: user?.username || 'משתמש' },
      timestamp: new Date(),
      updates: {
        status: updatedItem.status,
        isPurchased: (updatedItem as any).isPurchased || false,
        isPartiallyPurchased: (updatedItem as any).isPartiallyPurchased || false,
        purchasedQuantity: (updatedItem as any).purchasedQuantity || 0,
        purchasedAt: updatedItem.purchasedAt ? new Date(updatedItem.purchasedAt).toISOString() : null,
        purchasedBy: req.userId!,
      },
      listName: listName,
      listId: listId
    });

    // Emit list update event
    emitToGroupExcept(io, group._id.toString(), userId, 'list:updated', {
      listId,
      groupId: group._id.toString(),
      action: 'item_purchased',
      list: freshList,
      updatedBy: { id: userId, username: user?.username || 'משתמש' },
      timestamp: new Date()
    });

    // Emit chat message event
    if (populatedMessage) {
      io.to(`group:${group._id.toString()}`).emit('chat:message', {
        groupId: group._id.toString(),
        message: {
          id: populatedMessage._id.toString(),
          content: populatedMessage.content,
          senderId: populatedMessage.sender?._id?.toString() || 'system',
          senderName: (populatedMessage.sender as any)?.username || 'System',
          senderAvatar: (populatedMessage.sender as any)?.avatar,
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

export const unpurchaseItem = async (req: express.Request, res: express.Response) => {
  const item = await Item.findById(req.params.id)
    .populate({ path: 'shoppingList', populate: { path: 'group' } });

  if (!item) throw new AppError('Item not found', 404);

  const userId = req.userId!;
  const group = (item.shoppingList as any).group;

  if (!group.members.some((m: any) => m.user.toString() === userId)) {
    throw new AppError('Access denied', 403);
  }
  if (item.status !== 'purchased') {
    throw new AppError('Item is not purchased', 400);
  }

  await item.markAsNotPurchased();

  const user = await (await import('../models/user')).default.findById(userId);
  const listId = (item.shoppingList as any)._id.toString();
  const message = await Message.createItemUpdateMessage(
    group._id.toString(),
    item._id.toString(),
    'unpurchase',
    user?.username || 'משתמש',
    listId
  );

  // Populate the message for WebSocket
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'username firstName lastName avatar')
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
    // Emit item update event
    emitToGroupExcept(io, group._id.toString(), userId, 'item:updated', {
      itemId: item._id.toString(),
      action: 'unpurchase',
      item: updatedItem,
      updatedBy: { id: req.userId!, username: user?.username || 'משתמש' },
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

    // Emit list update event
    emitToGroupExcept(io, group._id.toString(), userId, 'list:updated', {
      listId,
      groupId: group._id.toString(),
      action: 'item_unpurchased',
      list: freshList,
      updatedBy: { id: userId, username: user?.username || 'משתמש' },
      timestamp: new Date()
    });

    // Emit chat message event
    if (populatedMessage) {
      io.to(`group:${group._id.toString()}`).emit('chat:message', {
        groupId: group._id.toString(),
        message: {
          id: populatedMessage._id.toString(),
          content: populatedMessage.content,
          senderId: populatedMessage.sender?._id?.toString() || 'system',
          senderName: (populatedMessage.sender as any)?.username || 'System',
          senderAvatar: (populatedMessage.sender as any)?.avatar,
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


export const notAvailableItem = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const item = await Item.findById(req.params.id).populate({ path: 'shoppingList', populate: { path: 'group' } });
  if (!item) throw new AppError('Item not found', 404);
  const group = (item.shoppingList as any).group;
  if (!group.members.some((m: any) => m.user.toString() === req.userId)) throw new AppError('Access denied', 403);
  await item.markAsNotAvailable();

  const updatedItem = await Item.findById(item._id).populate('addedBy purchasedBy', 'username firstName lastName avatar');
  res.status(200).json(successResponse(updatedItem, 'Item marked as not available'));
};

export const updateItemQuantity = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(validationErrorResponse(errors.array()));
    return;
  }

  const item = await Item.findById(req.params.id).populate({ path: 'shoppingList', populate: { path: 'group' } });
  if (!item) throw new AppError('Item not found', 404);
  const group = (item.shoppingList as any).group;
  if (!group.hasPermission(req.userId!, 'canEditLists')) throw new AppError('Insufficient permissions', 403);

  await item.updateQuantity(req.body.quantity);
  const updatedItem = await Item.findById(item._id).populate('addedBy purchasedBy', 'username firstName lastName avatar');
  res.status(200).json(successResponse(updatedItem, 'Item quantity updated'));
};

export const getPopularItems = async (req: express.Request, res: express.Response<IApiResponse>) => {
try {
    const { groupId, limit = 10 } = req.query;
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group || !group.members.some((m: any) => m.user.toString() === req.userId)) throw new AppError('Access denied', 403);
    }
    const popularItems = await Item.getPopularItems(groupId as string, parseInt(limit as string));
    res.status(200).json(successResponse(popularItems, 'Popular items retrieved'));
  } catch (error) {
    // Error handling would go here if needed
    throw new AppError(error instanceof Error ? error.message : 'Failed to get popular items', 500, true);
  }
};

export const searchItems = async (req: express.Request, res: express.Response<IApiResponse>) => {
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

export const getCategoryStats = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const { shoppingListId } = req.query;
  if (shoppingListId) await verifyShoppingListAccess(shoppingListId as string, req.userId!);
  const stats = await Item.getCategoryStats(shoppingListId as string);
  res.status(200).json(successResponse(stats, 'Category statistics retrieved'));
};

export const getAvailableUnits = async (_req: express.Request, res: express.Response<IApiResponse>) => {
  const units = UNITS.map(unit => ({ value: unit, label: unit }));
  res.status(200).json(successResponse(units, 'Units retrieved'));
};

// New: Get manual items
export const getManualItems = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const { shoppingListId, limit = 20, skip = 0 } = req.query;
  await verifyShoppingListAccess(shoppingListId as string, req.userId!);
  
  const items = await Item.findManualItems(shoppingListId as string, { 
    limit: parseInt(limit as string), 
    skip: parseInt(skip as string) 
  });
  
  res.status(200).json(successResponse(items, 'Manual items retrieved successfully'));
};

// New: Get product-based items
export const getProductBasedItems = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const { shoppingListId, limit = 20, skip = 0 } = req.query;
  await verifyShoppingListAccess(shoppingListId as string, req.userId!);
  
  const items = await Item.findProductBasedItems(shoppingListId as string, { 
    limit: parseInt(limit as string), 
    skip: parseInt(skip as string) 
  });
  
  res.status(200).json(successResponse(items, 'Product-based items retrieved successfully'));
};

// New: Get items by product
export const getItemsByProduct = async (req: express.Request, res: express.Response<IApiResponse>) => {
  const { productId, limit = 20, skip = 0 } = req.query;
  
  const items = await Item.findByProduct(productId as string, { 
    limit: parseInt(limit as string), 
    skip: parseInt(skip as string) 
  });
  
  res.status(200).json(successResponse(items, 'Items by product retrieved successfully'));
};

// Create multiple items at once
export const createMultipleItems = async (req: express.Request, res: express.Response<IApiResponse>) => {
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

  // --- NEW: batch-verify and map product docs ---
  const candidateProductIds: string[] = items
    .map(i => i.product)
    .filter((id: unknown): id is string => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id));

  const uniqueProductIds = [...new Set(candidateProductIds)];
  const productDocs = await Product.find({ _id: { $in: uniqueProductIds } })
    .select('_id name brand price averagePrice categoryId subCategoryId image')
    .lean();

  const productById = new Map(productDocs.map(p => [p._id.toString(), p]));
  // --- END NEW ---

  const createdItems: any[] = [];
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

        // --- NEW: resolve fields from product when exists ---
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

            // keep category consistent with product
            resolvedCategory = p.categoryId?.toString() ?? category;

            // fill missing fields only
            if (!resolvedName) resolvedName = p.name;
            if (!resolvedBrand) resolvedBrand = p.brand;
            if (resolvedEstimatedPrice == null) {
              resolvedEstimatedPrice = p.price ?? p.averagePrice ?? undefined;
            }
          }
          // else: soft ignore invalid product id; for strict use: throw new AppError('Product not found', 400);
        }
        // --- END NEW ---

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
          // Add item directly to shoppingList items array within transaction
          // instead of calling addItem which tries to find the item before it's committed
          const itemId = item._id;
          const itemIdExists = shoppingList.items.some(id => id.toString() === itemId.toString());
          if (!itemIdExists) {
            shoppingList.items.push(itemId);
          }
          createdItems.push(item);
        }
      }
      
      // Save shoppingList with updated items array within transaction
      await shoppingList.save({ session });
    });

    const populatedItems = await Item.find({
      _id: { $in: createdItems.map(item => item._id) }
    })
      .populate('addedBy', 'username firstName lastName avatar')
      .populate('category', 'name nameEn icon color')
      .populate('product', 'name brand image averagePrice price categoryId subCategoryId');

    // Get fresh shopping list for WebSocket update
    const freshList = await ShoppingList.findById(shoppingListId)
      .populate('createdBy', 'username firstName lastName avatar')
      .populate('assignedTo', 'username firstName lastName avatar');

    // Get user info for WebSocket
    const User = (await import('../models/user')).default;
    const user = await User.findById(userId);

    // Send WebSocket events to update other connected users (the user who added will get update via React Query)
    const io = getIO();
    if (io && populatedItems.length > 0) {
      // Emit item:updated event for each item to other users in the group (not to the one who added them)
      populatedItems.forEach((item) => {
        emitToGroupExcept(io, group._id.toString(), userId, 'item:updated', {
          itemId: item._id.toString(),
          action: 'created',
          item: item,
          updatedBy: { id: userId, username: user?.username || 'משתמש' },
          timestamp: new Date(),
          updates: {
            status: 'pending',
            isPurchased: false,
          },
          listName: freshList?.name || '',
          listId: shoppingListId
        });
      });

      // Emit list:updated event to refresh the shopping list for other users
      emitToGroupExcept(io, group._id.toString(), userId, 'list:updated', {
        listId: shoppingListId,
        groupId: group._id.toString(),
        action: 'items_added',
        list: freshList,
        updatedBy: { id: userId, username: user?.username || 'משתמש' },
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

