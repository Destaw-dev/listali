import { body, query, param } from 'express-validator';
import { ItemCategory, ItemUnit } from '../types';

export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9._\-\u0590-\u05FF]+$/)
    .withMessage('Username can contain Hebrew letters, English letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters')
];

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const profileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_\u0590-\u05FF]+$/)
    .withMessage('Username can contain Hebrew letters, English letters, numbers, and underscores'),
  body('preferences.pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean'),
  body('preferences.emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('preferences.newMessageNotifications')
    .optional()
    .isBoolean()
    .withMessage('New message notifications must be a boolean'),
  body('preferences.shoppingListUpdates')
    .optional()
    .isBoolean()
    .withMessage('Shopping list updates must be a boolean'),
  body('preferences.darkMode')
    .optional()
    .isBoolean()
    .withMessage('Dark mode must be a boolean'),
  body('preferences.language')
    .optional()
    .isIn(['he', 'en'])
    .withMessage('Language must be he, en')
];

export const passwordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

export const emailValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

export const createListValidation = [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('List name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('groupId')
      .isMongoId()
      .withMessage('Valid group ID is required'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .trim()
      .isLength({ max: 30 })
      .withMessage('Tag cannot exceed 30 characters'),
    body('assignedTo')
      .optional()
      .custom((value) => {
        if (value === null || value === '') return true;
        if (!value.match(/^[0-9a-fA-F]{24}$/)) {
          throw new Error('Assigned user must be a valid user ID');
        }
        return true;
      })
  ];
  
  export const listQueryValidation = [
    query('groupId').isMongoId().withMessage('Valid group ID is required'),
    query('status').optional().isIn(['active', 'completed', 'archived']).withMessage('Invalid status'),
    query('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    query('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo user ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ];


export const createMessageValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  body('groupId')
    .isMongoId()
    .withMessage('Valid group ID is required'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'system', 'item_update', 'list_update'])
    .withMessage('Invalid message type'),
  body('metadata.imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be valid'),
  body('metadata.fileName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('File name can’t exceed 100 characters')
];

export const validateIdParam = [
  param('id').isMongoId().withMessage('Invalid ID')
];

export const validateMessageQuery = [
  query('groupId').isMongoId().withMessage('Valid group ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('before').optional().isMongoId().withMessage('Before must be a valid message ID'),
  query('after').optional().isMongoId().withMessage('After must be a valid message ID'),
  query('messageType').optional().isIn(['text', 'image', 'system', 'item_update', 'list_update']),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('includeDeleted').optional().isBoolean().withMessage('includeDeleted must be boolean')
];

export const validateGroupIdQuery = [
  query('groupId').optional().isMongoId().withMessage('Invalid group ID')
];

export const validateReadAll = [
  body('groupId').isMongoId().withMessage('Valid group ID is required')
];

export const validateSearchQuery = [
  query('groupId').isMongoId().withMessage('Valid group ID is required'),
  query('q').notEmpty().withMessage('Search query is required'),
  query('messageType').optional().isIn(['text', 'image', 'system', 'item_update', 'list_update']),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be non-negative')
];

export const validateStatsQuery = [
  query('groupId').isMongoId().withMessage('Valid group ID is required'),
  query('startDate').optional().isISO8601().toDate().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().toDate().withMessage('End date must be a valid ISO date'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
];

export const validateByTypeParams = [
  param('type')
    .isIn(['text', 'image', 'system', 'item_update', 'list_update'])
    .withMessage('Invalid message type'),
  query('groupId')
    .isMongoId()
    .withMessage('Valid group ID is required')
];

export const validatePaginationQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export const validateExportQuery = [
  query('groupId').isMongoId().withMessage('Valid group ID is required'),
  query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv'),
  query('startDate').optional().isISO8601().toDate().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().toDate().withMessage('End date must be a valid ISO date')
];

export const CATEGORIES: ItemCategory[] = [
  'fruits_vegetables', 'meat_fish', 'dairy', 'bakery', 'pantry',
  'frozen', 'beverages', 'snacks', 'household', 'personal_care', 'other'
];

export const UNITS: ItemUnit[] = [
  'piece', 'kg', 'g', 'lb', 'oz', 'l', 'ml', 'cup', 'tbsp', 'tsp',
  'package', 'box', 'bag', 'bottle', 'can'
];

export const createItemValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Item name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('quantity')
    .isFloat({ min: 0.01, max: 10000 })
    .withMessage('Quantity must be between 0.01 and 10,000'),
  body('unit')
    .isIn(UNITS)
    .withMessage(`Unit must be one of: ${UNITS.join(', ')}`),
  body('category')
  .trim()
  .isLength({ min: 1, max: 100 })
  .withMessage('Item name must be between 1 and 100 characters'),
  // body('category')
  //   .isIn(CATEGORIES)
  //   .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Brand name cannot exceed 50 characters'),
  body('estimatedPrice')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Estimated price must be between 0 and 10,000'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Notes cannot exceed 300 characters'),
  body('alternatives')
    .optional()
    .isArray()
    .withMessage('Alternatives must be an array'),
  body('alternatives.*')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Each alternative cannot exceed 100 characters'),
  body('shoppingListId')
    .isMongoId()
    .withMessage('Valid shopping list ID is required')
];

export const createBulkItemsValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items array is required and must contain at least one item'),
  body('items.*.name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Item name must be between 1 and 100 characters'),
  body('items.*.description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('items.*.quantity')
    .isFloat({ min: 0.01, max: 10000 })
    .withMessage('Quantity must be between 0.01 and 10,000'),
  body('items.*.unit')
    .isIn(UNITS)
    .withMessage(`Unit must be one of: ${UNITS.join(', ')}`),
  body('items.*.category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category cannot exceed 100 characters'),
  body('items.*.brand')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Brand name cannot exceed 50 characters'),
  body('items.*.estimatedPrice')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Estimated price must be between 0 and 10,000'),
  body('items.*.priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('items.*.notes')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Notes cannot exceed 300 characters'),
  body('items.*.alternatives')
    .optional()
    .isArray()
    .withMessage('Alternatives must be an array'),
  body('items.*.alternatives.*')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Each alternative cannot exceed 100 characters'),
  body('items.*.shoppingListId')
    .isMongoId()
    .withMessage('Valid shopping list ID is required for each item'),
  body('items.*.product')
    .optional()
    .custom((value) => {
      if (!value || value === null || value === '' || value === undefined) {
        return true;
      }
      if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
        return true;
      }
      return false;
    })
    .withMessage('Product must be a valid product ID'),
  body('items.*.isManualEntry')
    .optional()
    .isBoolean()
    .withMessage('isManualEntry must be a boolean')
];

export const updateItemValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Item name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('quantity')
    .optional()
    .isFloat({ min: 0.01, max: 10000 })
    .withMessage('Quantity must be between 0.01 and 10,000'),
  body('unit')
    .optional()
    .isIn(UNITS)
    .withMessage(`Unit must be one of: ${UNITS.join(', ')}`),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ObjectId'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Brand name cannot exceed 50 characters'),
  body('estimatedPrice')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Estimated price must be between 0 and 10,000'),
  body('actualPrice')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Actual price must be between 0 and 10,000'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Notes cannot exceed 300 characters'),
  body('alternatives')
    .optional()
    .isArray()
    .withMessage('Alternatives must be an array'),
  body('alternatives.*')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Each alternative cannot exceed 100 characters')
];

export const getItemsValidation = [
  query('shoppingListId').isMongoId().withMessage('Valid shopping list ID is required'),
  query('status').optional().isIn(['pending', 'purchased', 'partially_purchased', 'not_available', 'cancelled']).withMessage('Invalid status'),
  query('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
  query('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  query('search').optional().isString().withMessage('Search must be a string')
];

export const itemIdValidation = [
  param('id').isMongoId().withMessage('Invalid item ID')
];

export const purchaseItemValidation = [
  param('id').isMongoId().withMessage('Invalid item ID'),
  body('quantityToPurchase').optional().isFloat({ min: 0, max: 10000 }).withMessage('Quantity to purchase must be between 0 and 10,000'),
  body('purchasedQuantity').optional().isFloat({ min: 0, max: 10000 }).withMessage('Purchased quantity must be between 0 and 10,000'),
  body('actualPrice').optional().isFloat({ min: 0, max: 10000 }).withMessage('Actual price must be between 0 and 10,000')
];

export const updateQuantityValidation = [
  param('id').isMongoId().withMessage('Invalid item ID'),
  body('quantity').isFloat({ min: 0.01, max: 10000 }).withMessage('Quantity must be between 0.01 and 10,000')
];

export const popularItemsValidation = [
  query('groupId').optional().isMongoId().withMessage('Invalid group ID'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

export const searchItemsValidation = [
  query('q').notEmpty().withMessage('Search query is required'),
  query('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

export const categoryStatsValidation = [
  query('shoppingListId').optional().isMongoId().withMessage('Invalid shopping list ID')
];

export const createShoppingListValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('List name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('groupId')
    .isMongoId()
    .withMessage('Valid group ID is required'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Tag cannot exceed 30 characters'),
  body('assignedTo')
    .optional()
    .custom((value) => {
      if (value === null || value === '') return true;
      if (!value.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Assigned user must be a valid user ID');
      }
      return true;
    })
];

export const updateShoppingListValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('List name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Tag cannot exceed 30 characters'),
  body('assignedTo')
    .optional()
    .custom((value) => {
      if (value === null || value === '') return true;
      if (!value.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Assigned user must be a valid user ID');
      }
      return true;
    })
];

export const unpurchaseItemValidation = [
  param('id').isMongoId().withMessage('Invalid item ID'),
  body('quantityToUnpurchase').optional().isFloat({ min: 0, max: 10000 }).withMessage('Quantity to unpurchase must be between 0 and 10,000'),
];

export const addItemValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Item name must be between 1 and 100 characters'),
  body('quantity')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Quantity must be a positive number'),
  body('unit')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Unit cannot exceed 20 characters'),
  body('product')
    .optional()
    .custom((value) => {
      if (!value || value === null || value === '' || value === undefined) {
        return true;
      }
      if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
        return true;
      }
      return false;
    })
    .withMessage('Product must be a valid product ID'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid category ID'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  body('estimatedPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated price must be a positive number'),
  body('actualPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Actual price must be a positive number')
];

export const validateListId = param('listId')
  .isMongoId()
  .withMessage('Invalid shopping list ID');

export const validateItemId = param('itemId')
  .isMongoId()
  .withMessage('Invalid item ID');

export const getShoppingListsValidation = [
  query('groupId').isMongoId().withMessage('Valid group ID is required'),
  query('status').optional().isIn(['active', 'completed', 'archived']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  query('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo user ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export const shoppingListIdValidation = [
  param('shoppingListId').isMongoId().withMessage('Invalid shopping list ID')
];

export const assignUserValidation = [
  param('shoppingListId').isMongoId().withMessage('Invalid shopping list ID'),
  body('userId').isMongoId().withMessage('Valid user ID is required')
];

export const overdueListsValidation = [
  query('groupId').optional().isMongoId().withMessage('Invalid group ID')
];

export const createGroupValidation = [
  body('name')
    .isString().withMessage('Group name must be a string')
    .isLength({ min: 1 }).withMessage('Group name is required'),

  body('description')
    .optional()
    .isString().withMessage('Description must be a string'),

  body('settings')
    .optional()
    .isObject().withMessage('Settings must be an object'),
];

export const updateGroupValidation = [
  body('name')
    .optional()
    .isString().withMessage('Group name must be a string'),

  body('description')
    .optional()
    .isString().withMessage('Description must be a string'),

  body('settings')
    .optional()
    .isObject().withMessage('Settings must be an object'),

  body('avatar')
    .optional()
    .isString().withMessage('Avatar must be a string'),
];

export const inviteToGroupValidation = [
  param('id')
    .isMongoId().withMessage('Invalid group ID'),

  body('email')
    .isEmail().withMessage('Valid email is required'),

  body('role')
    .optional()
    .isIn(['admin', 'member']).withMessage('Role must be admin or member'),
];

export const updateMemberRoleValidation = [
  param('id')
    .isMongoId().withMessage('Invalid group ID'),

  param('userId')
    .isMongoId().withMessage('Invalid user ID'),

  body('role')
    .isIn(['admin', 'member']).withMessage('Role must be admin or member'),
];

export const joinGroupValidation = [
  param('inviteCode')
    .isLength({ min: 8, max: 8 }).withMessage('Invite code must be exactly 8 characters'),
];

export const cancelGroupInvitationValidation = [
  param('groupId')
    .isMongoId().withMessage('Invalid group ID'),
  param('inviteCode')
    .isMongoId().withMessage('Invalid invite code'),
];

export const removeMemberValidation = [
  param('id')
    .isMongoId().withMessage('Invalid group ID'),

  param('userId')
    .isMongoId().withMessage('Invalid user ID'),
];

export const validateGroupId = [
  param('groupId')
    .isMongoId().withMessage('Invalid group ID ch'),
];

export const validateMemberId = [
  param('userId')
    .isMongoId().withMessage('Invalid user ID'),
];

export const preferencesValidation = [
  body('language')
    .optional()
    .isIn(['he', 'en'])
    .withMessage('Language must be he or en'),
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'system'])
    .withMessage('Theme must be light, dark, or system')
];

export const notificationSettingsValidation = [
  body('pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean'),
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('newMessageNotifications')
    .optional()
    .isBoolean()
    .withMessage('New message notifications must be a boolean'),
  body('shoppingListUpdates')
    .optional()
    .isBoolean()
    .withMessage('Shopping list updates must be a boolean'),
  body('groupInvitations')
    .optional()
    .isBoolean()
    .withMessage('Group invitations must be a boolean')
];

export const batchPurchaseItemsValidation = [
  body('itemIds').isArray().withMessage('Item IDs must be an array'),
  body('itemIds.*').isMongoId().withMessage('Each item ID must be a valid MongoDB ObjectId'),
  body('shoppingListId').isMongoId().withMessage('Valid shopping list ID is required'),
];

