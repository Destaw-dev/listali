import express from 'express';
import {
  getItems,
  createItem,
  createMultipleItems,
  getItemById,
  updateItem,
  deleteItem,
  purchaseItem,
  batchPurchaseItems,
  unpurchaseItem,
  notAvailableItem,
  updateItemQuantity,
  getPopularItems,
  searchItems,
  getCategoryStats,
  getAvailableUnits,
  getManualItems,
  getProductBasedItems,
  getItemsByProduct
} from '../controllers/item';
import {
  createItemValidation,
  createBulkItemsValidation,
  updateItemValidation,
  getItemsValidation,
  itemIdValidation,
  purchaseItemValidation,
  updateQuantityValidation,
  popularItemsValidation,
  searchItemsValidation,
  categoryStatsValidation,
  unpurchaseItemValidation,
  batchPurchaseItemsValidation,
} from '../middleware/validation';
import { asyncHandler } from '../middleware/handlers';

const router = express.Router();

router.get('/popular', popularItemsValidation, asyncHandler(getPopularItems));
router.get('/search', searchItemsValidation, asyncHandler(searchItems));
router.get('/stats/categories', categoryStatsValidation, asyncHandler(getCategoryStats));
router.get('/units', asyncHandler(getAvailableUnits));

router.get('/manual', asyncHandler(getManualItems));
router.get('/product-based', asyncHandler(getProductBasedItems));
router.get('/by-product', asyncHandler(getItemsByProduct));

router.get('/', getItemsValidation, asyncHandler(getItems));
router.post('/', createItemValidation, asyncHandler(createItem));
router.post('/bulk', createBulkItemsValidation, asyncHandler(createMultipleItems));

router.get('/:id', itemIdValidation, asyncHandler(getItemById));
router.put('/:id', [...itemIdValidation, ...updateItemValidation], asyncHandler(updateItem));
router.delete('/:id', itemIdValidation, asyncHandler(deleteItem));
router.post('/:id/purchase', purchaseItemValidation, asyncHandler(purchaseItem));
router.post('/:id/unpurchase', unpurchaseItemValidation, asyncHandler(unpurchaseItem));
router.post('/:id/not-available', itemIdValidation, asyncHandler(notAvailableItem));
router.put('/:id/quantity', updateQuantityValidation, asyncHandler(updateItemQuantity));
router.post('/batch-purchase', batchPurchaseItemsValidation, asyncHandler(batchPurchaseItems));

export default router;
