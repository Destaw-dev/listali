// API Constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
    GOOGLE: '/auth/google',
    GOOGLE_CALLBACK: '/auth/google/callback',
    CHECK_USERNAME: '/auth/check-username',
    CHECK_EMAIL: '/auth/check-email',
  },
  GROUPS: {
    BASE: '/groups',
    JOIN: '/groups/join',
    INVITE: '/groups/invite',
    LEAVE: '/groups/leave',
    MEMBERS: '/groups/members',
  },
  SHOPPING_LISTS: {
    BASE: '/shopping-lists',
    COMPLETE: '/shopping-lists/complete',
    REOPEN: '/shopping-lists/reopen',
    ASSIGN: '/shopping-lists/assign',
  },
  ITEMS: {
    BASE: '/items',
    PURCHASE: '/items/purchase',
    UNPURCHASE: '/items/unpurchase',
    NOT_AVAILABLE: '/items/not-available',
    QUANTITY: '/items/quantity',
  },
  MESSAGES: {
    BASE: '/messages',
    READ: '/messages/read',
  },
  PRODUCTS: {
    BASE: '/products',
    SEARCH: '/products/search',
    BARCODE: '/products/barcode',
  },
  CATEGORIES: {
    BASE: '/categories',
    SUB_CATEGORIES: '/sub-categories',
  },
} as const;

// Socket Events
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // User events
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  USER_STATUS_CHANGED: 'user_status_changed',
  
  // Group events
  JOIN_GROUP: 'join_group',
  LEAVE_GROUP: 'leave_group',
  JOIN_GROUPS: 'join_groups',
  
  // Message events
  SEND_MESSAGE: 'send_message',
  MESSAGE_RECEIVED: 'message_received',
  
  // Shopping events
  START_SHOPPING: 'start_shopping',
  END_SHOPPING: 'end_shopping',
  UPDATE_STATUS: 'update_status',
  
  // Item events
  UPDATE_ITEM: 'update_item',
  ITEM_UPDATED: 'item_updated',
  
  // List events
  LIST_UPDATED: 'list_updated',
  
  // Error events
  ERROR: 'error',
} as const;

// Item Status
export const ITEM_STATUS = {
  PENDING: 'pending',
  PURCHASED: 'purchased',
  NOT_AVAILABLE: 'not_available',
  CANCELLED: 'cancelled',
} as const;

// List Status
export const LIST_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

// Priority Levels
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

// User Roles
export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  SYSTEM: 'system',
  ITEM_UPDATE: 'item_update',
  LIST_UPDATE: 'list_update',
} as const;

// User Status
export const USER_STATUS = {
  SHOPPING: 'shopping',
  ONLINE: 'online',
  AWAY: 'away',
  OFFLINE: 'offline',
} as const;

// Item Categories
export const ITEM_CATEGORIES = {
  FRUITS_VEGETABLES: 'fruits_vegetables',
  MEAT_FISH: 'meat_fish',
  DAIRY: 'dairy',
  BAKERY: 'bakery',
  PANTRY: 'pantry',
  FROZEN: 'frozen',
  BEVERAGES: 'beverages',
  SNACKS: 'snacks',
  HOUSEHOLD: 'household',
  PERSONAL_CARE: 'personal_care',
  OTHER: 'other',
} as const;

// Item Units
export const ITEM_UNITS = {
  PIECE: 'piece',
  KG: 'kg',
  G: 'g',
  LB: 'lb',
  OZ: 'oz',
  L: 'l',
  ML: 'ml',
  CUP: 'cup',
  TBSP: 'tbsp',
  TSP: 'tsp',
  PACKAGE: 'package',
  BOX: 'box',
  BAG: 'bag',
  BOTTLE: 'bottle',
  CAN: 'can',
} as const;

// Product Units (Hebrew)
export const PRODUCT_UNITS = {
  UNITS: 'יחידות',
  KG: 'ק״ג',
  GRAM: 'גרם',
  LITER: 'ליטר',
  ML: 'מ״ל',
  PACKAGE: 'אריזה',
  WEIGHT: 'במשקל',
  BUNCH: 'צרור',
  DOZEN: 'תריסר',
  BOTTLE: 'בקבוק',
  CAN: 'קופסה',
  BOX: 'קרטון',
  BAG: 'שקית',
} as const;

// Colors for categories
export const CATEGORY_COLORS = {
  fruits_vegetables: '#4CAF50',
  meat_fish: '#F44336',
  dairy: '#2196F3',
  bakery: '#FF9800',
  pantry: '#9C27B0',
  frozen: '#00BCD4',
  beverages: '#795548',
  snacks: '#FF5722',
  household: '#607D8B',
  personal_care: '#E91E63',
  other: '#9E9E9E',
} as const;

// Icons for categories
export const CATEGORY_ICONS = {
  fruits_vegetables: '🍎',
  meat_fish: '🥩',
  dairy: '🥛',
  bakery: '🥖',
  pantry: '🥫',
  frozen: '🧊',
  beverages: '🥤',
  snacks: '🍿',
  household: '🧽',
  personal_care: '🧴',
  other: '📦',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  GROUP_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  LIST_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  ITEM_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
  },
  MESSAGE: {
    MAX_LENGTH: 1000,
  },
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Timeouts
export const TIMEOUTS = {
  API_REQUEST: 10000,
  SOCKET_CONNECTION: 20000,
  DEBOUNCE: 300,
  THROTTLE: 1000,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  PREFERENCES: 'preferences',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful!',
  REGISTER: 'Registration successful!',
  LOGOUT: 'Logout successful!',
  GROUP_CREATED: 'Group created successfully!',
  GROUP_UPDATED: 'Group updated successfully!',
  GROUP_DELETED: 'Group deleted successfully!',
  MEMBER_INVITED: 'Member invited successfully!',
  MEMBER_REMOVED: 'Member removed successfully!',
  LIST_CREATED: 'Shopping list created successfully!',
  LIST_UPDATED: 'Shopping list updated successfully!',
  LIST_DELETED: 'Shopping list deleted successfully!',
  ITEM_ADDED: 'Item added successfully!',
  ITEM_UPDATED: 'Item updated successfully!',
  ITEM_DELETED: 'Item deleted successfully!',
  MESSAGE_SENT: 'Message sent successfully!',
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'Smart List',
  VERSION: '1.0.0',
  DESCRIPTION: 'Smart Group Shopping App',
  AUTHOR: 'Destaw-dev',
  SUPPORT_EMAIL: 'support@smartlist.com',
} as const;

// Item-Product relationship
export const ITEM_SOURCE = {
  PRODUCT: 'product', // From product database
  MANUAL: 'manual',   // Manually entered
} as const;

// Product search options
export const PRODUCT_SEARCH_OPTIONS = {
  MAX_RESULTS: 10,
  MIN_QUERY_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
} as const; 