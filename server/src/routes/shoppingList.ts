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
import { asyncHandler } from '../middleware/handlers';

const router = express.Router();

router.get('/groups/:groupId', checkGroupMembership(), asyncHandler(getGroupShoppingLists));

router.get('/:listId', validateListId, asyncHandler(getShoppingList));

router.post('/groups/:groupId', createShoppingListValidation, checkGroupMembership(), asyncHandler(createShoppingList));

router.put('/:listId', updateShoppingListValidation, validateListId, asyncHandler(updateShoppingList));

router.delete('/:listId', validateListId, asyncHandler(deleteShoppingList));

router.post('/:listId/items', addItemValidation, validateListId, asyncHandler(addItemToList));

router.delete('/:listId/items/:itemId', validateListId, validateItemId, asyncHandler(removeItemFromList));

router.post('/:listId/complete', validateListId, asyncHandler(completeShoppingList));

export default router;