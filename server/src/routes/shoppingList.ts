// routes/shoppingListRoutes.ts
import express from 'express';
import { 
  getGroupShoppingLists, 
  getShoppingList, 
  createShoppingList, 
  updateShoppingList, 
  deleteShoppingList, 
  addItemToList, 
  removeItemFromList, 
  completeShoppingList 
} from '../controllers/shoppingList';
import { 
  createShoppingListValidation, 
  updateShoppingListValidation, 
  addItemValidation, 
  validateListId, 
  validateItemId 
} from '../middleware/validation';
import { checkGroupMembership } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get all shopping lists for a group
router.get('/groups/:groupId', checkGroupMembership(), asyncHandler(getGroupShoppingLists));

// Get a specific shopping list
router.get('/:listId', validateListId, asyncHandler(getShoppingList));

// Create a new shopping list
router.post('/groups/:groupId', createShoppingListValidation, checkGroupMembership(), asyncHandler(createShoppingList));

// Update a shopping list
router.put('/:listId', updateShoppingListValidation, validateListId, asyncHandler(updateShoppingList));

// Delete a shopping list
router.delete('/:listId', validateListId, asyncHandler(deleteShoppingList));

// Add item to shopping list
router.post('/:listId/items', addItemValidation, validateListId, asyncHandler(addItemToList));

// Remove item from shopping list
router.delete('/:listId/items/:itemId', validateListId, validateItemId, asyncHandler(removeItemFromList));

// Complete shopping list
router.post('/:listId/complete', validateListId, asyncHandler(completeShoppingList));

export default router;