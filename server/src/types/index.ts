// ============================================================================
// SERVER TYPES - SERVER-SPECIFIC EXTENSIONS
// ============================================================================
// This file contains server-specific type extensions and Mongoose-specific types
// Due to rootDir restrictions, we define the base types locally but keep them
// consistent with the shared types structure

import { Document, Types } from "mongoose";
import { Request as ExpressRequest } from "express";

// ============================================================================
// EXPRESS REQUEST TYPE EXTENSIONS
// ============================================================================

// Extend Express Request to include our custom properties
// Using declare global for Express namespace extension (required by Express types)
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

// Our custom Request interface (for backward compatibility)
export interface Request extends ExpressRequest {
  user?: IUser;
  userId?: string;
}

// ============================================================================
// MONGOOSE BASE TYPES
// ============================================================================

// Base interface for all documents with Mongoose ObjectId support
export interface BaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// BASE INTERFACES (CONSISTENT WITH SHARED TYPES)
// ============================================================================

// Base user interface (consistent with shared types)
export interface IBaseUser {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  lastSeen: Date;
  preferences: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    newMessageNotifications: boolean;
    shoppingListUpdates: boolean;
    groupInvitations: boolean;
    darkMode: boolean;
    language: string;
  };
  groups: string[];
}

// Base group interface (consistent with shared types)
export interface IBaseGroup {
  name: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  settings: {
    allowMemberInvite: boolean;
    requireApproval: boolean;
    maxMembers: number;
  };
  inviteCode: string;
  isActive: boolean;
  pendingInvites: IBasePendingInvite[];
}

// Base group member interface (consistent with shared types)
export interface IBaseGroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
  permissions: {
    canCreateLists: boolean;
    canEditLists: boolean;
    canDeleteLists: boolean;
    canInviteMembers: boolean;
    canManageMembers: boolean;
  };
}

// Base pending invite interface (consistent with shared types)
export interface IBasePendingInvite {
  id: string;
  email?: string;
  code: string;
  role: 'admin' | 'member';
  type: 'in-app' | 'email';
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'declined';
}

// Base pending invitation interface (consistent with shared types)
export interface IBasePendingInvitation {
  code: string;
  role: 'admin' | 'member';
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'declined';
}

// Base shopping list interface (consistent with shared types)
export interface IBaseShoppingList {
  name: string;
  description?: string;
  groupId: string;
  status: "active" | "completed" | "archived";
  isActive: boolean;
  isCompleted: boolean;
  dueDate?: Date;
  completedAt?: Date | null;
  priority: "low" | "medium" | "high";
  tags: string[];
  metadata: {
    estimatedTotal?: number;
    actualTotal?: number;
    itemsCount: number;
    completedItemsCount: number;
  };
}

// Base item interface (consistent with shared types)
export interface IBaseItem {
  name: string;
  description?: string;
  quantity: number;
  quantityToPurchase: number;
  unit: string;
  brand?: string;
  estimatedPrice?: number;
  actualPrice?: number;
  price?: number;
  image?: string;
  barcode?: string;
  status: "pending" | "purchased" | "not_available" | "cancelled" | "partially_purchased";
  isPurchased: boolean;
  isPartiallyPurchased?: boolean;
  purchasedQuantity?: number;
  remainingQuantity?: number;
  updatedBy?: string;
  beingPurchasedBy?: string;
  priority: "low" | "medium" | "high";
  notes?: string;
  note?: string;
  alternatives?: string[];
  productId?: string;
  isManualEntry?: boolean;
}

// Base message interface (consistent with shared types)
export interface IBaseMessage {
  content: string;
  messageType: "text" | "image" | "system" | "item_update" | "list_update";
  metadata?: {
    itemId?: string;
    listId?: string;
    imageUrl?: string;
    fileName?: string;
    fileSize?: number;
  };
  editedAt?: Date;
  isDeleted: boolean;
}

// Base read status interface (consistent with shared types)
export interface IBaseReadStatus {
  readAt: Date;
}

// Base category interface (consistent with shared types)
export interface IBaseCategory {
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  description?: string;
  idFromApi: string;
}

// Base subcategory interface (consistent with shared types)
export interface IBaseSubCategory {
  name: string;
  nameEn: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  description?: string;
  category?: IBaseCategory;
  idFromApi: string;
}

// Base nutritional value interface (consistent with shared types)
export interface IBaseNutritionalValue {
  key: string;
  label: string;
  value: number;
  unit: string;
  per: string;
  originalCode: string;
}

// Base product interface (consistent with shared types)
export interface IBaseProduct {
  name: string;
  idFromApi?: number;
  barcode?: string;
  defaultUnit: string;
  units: string[];
  image?: {
    primary: string;
    providers: {
      cloudinary: { url: string; publicId: string };
      imagekit: { url: string; fileId: string; path: string };
    };
    meta: { width: number; height: number; format: string; bytes: number };
  };
  averagePrice?: number;
  price?: number;
  tags: string[];
  isActive: boolean;
  kosher?: boolean;
  kosherType?: string;
  glutenFree?: boolean;
  brand?: string;
  category?: IBaseCategory;
  subCategory?: IBaseSubCategory;
  alcoholPercentageInProduct?: string;
  countryOfOrigin?: string;
  foodSymbolRed?: {
    code: string;
    description: string;
  }[];
  forbiddenUnder18?: boolean;
  hazardPrecautionaryStatement?: string;
  ingredientSequence?: string;
  nutritionalValues?: IBaseNutritionalValue[];
}

// ============================================================================
// SERVER-SPECIFIC USER EXTENSIONS
// ============================================================================

// Refresh session interface
export interface IRefreshSession {
  sessionId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date;
  userAgent?: string;
  ip?: string;
}

// User with password and server methods (extends base user)
export interface IUser extends IBaseUser, BaseDocument {
  password: string;
  googleId: string;
  pendingInvitations: IPendingInvitation[];
  isEmailVerified: boolean;
  emailVerification?: {
    token: string;
    expiresAt: Date;
  };
  refreshSessions: IRefreshSession[];
}

// User methods for server-side operations
export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  pruneExpiredSessions(now?: Date): void;
  enforceMaxSessions(max?: number): void;
  addSession(session: {
    sessionId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ip?: string;
  }): void;
  rotateSession(sessionId: string, newRefreshTokenHash: string, newExpiresAt: Date): void;
  revokeSession(sessionId: string): void;
  revokeAllSessions(): void;
}

// User document type for server
export type UserDocument = IUser & IUserMethods;

// ============================================================================
// SERVER-SPECIFIC GROUP EXTENSIONS
// ============================================================================

// Group with server methods (extends base group)
export interface IGroup extends IBaseGroup, BaseDocument {
  owner: Types.ObjectId;
  members: IGroupMember[];
  shoppingLists: Types.ObjectId[];
  pendingInvites: IPendingInvite[];
  
  // Server methods
  hasPermission(userId: string, permission: string): boolean;
  removeMember(userId: string, removedBy: string): Promise<void>;
  addMember(userId: string, role?: InviteRole): Promise<void>;
  updateMemberRole(userId: string, newRole: 'admin' | 'member', updatedBy: string): Promise<void>;
  transferOwnership(currentOwnerId: string, newOwnerId: string): Promise<void>;
}

// Group member with server-specific fields (extends base group member)
export interface IGroupMember extends IBaseGroupMember {
  user: Types.ObjectId;
  id: string;
  userId: string;
  groupId: string;
}

// Pending invite with server-specific fields (extends base pending invite)
export interface IPendingInvite extends IBasePendingInvite {
  user?: Types.ObjectId;
}

// Pending invitation with server-specific fields (extends base pending invitation)
export interface IPendingInvitation extends IBasePendingInvitation, BaseDocument {
  group: Types.ObjectId;
  invitedBy: Types.ObjectId;
}

// ============================================================================
// SERVER-SPECIFIC SHOPPING LIST EXTENSIONS
// ============================================================================

// Shopping list with server methods (extends base shopping list)
export interface IShoppingList extends IBaseShoppingList, BaseDocument {
  group: Types.ObjectId;
  createdBy: Types.ObjectId;
  items: Types.ObjectId[];
  assignedTo?: Types.ObjectId;
  shoppingSessions: Types.ObjectId[];
  
  // Server methods
  addItem(itemId: string): Promise<void>;
  removeItem(itemId: string): Promise<void>;
  complete(): Promise<void>;
  reopen(): Promise<void>;
  archive(): Promise<void>;
  unassign(): Promise<void>;
  assignTo(userId: string): Promise<void>;
  updateMetadata(): Promise<void>;
  addShoppingSession(sessionId: string): Promise<void>;
}

// Shopping session with server-specific fields (extends base shopping session)

export interface IShoppingSession extends BaseDocument {
  listId: Types.ObjectId;
  userId: Types.ObjectId;
  groupId: Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  isActive: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    storeName?: string;
  };
  itemsPurchased: number;
  totalItems: number;
  shoppingTime?: number; // in minutes
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  lastActivity: Date;
}


// ============================================================================
// SERVER-SPECIFIC ITEM EXTENSIONS
// ============================================================================

// Item with server methods (extends base item)
export interface IItem extends IBaseItem, BaseDocument {
  category: Types.ObjectId;
  addedBy: Types.ObjectId;
  purchasedBy?: Types.ObjectId | null;
  shoppingList: Types.ObjectId;
  product?: Types.ObjectId;
  purchasedAt?: Date | null;
  
  // Server methods
  markAsPurchased(userId: string, purchasedQuantity?: number, actualPrice?: number): Promise<void>;
  markAsNotPurchased(quantityToUnpurchase?: number): Promise<void>;
  markAsNotAvailable(): Promise<void>;
  updateQuantity(newQuantity: number): Promise<void>;
}

// Shopping list item interface (server-specific)
export interface IShoppingListItem extends BaseDocument {
  name: string;
  quantity: number;
  unit?: string;
  product?: Types.ObjectId;
  category?: Types.ObjectId;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: Types.ObjectId;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  addedBy: Types.ObjectId;
  addedAt: Date;
}

// ============================================================================
// SERVER-SPECIFIC MESSAGE EXTENSIONS
// ============================================================================

// Message with server-specific fields (extends base message)
export interface IMessage extends IBaseMessage, BaseDocument {
  sender: Types.ObjectId;
  group: Types.ObjectId;
  readBy: IReadStatus[];
  
  // Server methods
  markAsRead(userId: string): Promise<this>;
  editMessage(newContent: string, editorId: string): Promise<this>;
  deleteMessage(deleterId: string): Promise<this>;
}

// Read status with server-specific fields (extends base read status)
export interface IReadStatus extends IBaseReadStatus {
  user: Types.ObjectId;
}

// ============================================================================
// SERVER-SPECIFIC PRODUCT EXTENSIONS
// ============================================================================

// Category with server-specific fields (extends base category)
export interface ICategory extends IBaseCategory, BaseDocument {}

// SubCategory with server-specific fields (extends base subcategory)
export interface ISubCategory extends IBaseSubCategory, BaseDocument {
  categoryId: Types.ObjectId;
  allergenTypeCode?: Types.ObjectId[];
  allergenTypeCodeMayContain?: Types.ObjectId[];
}

// Nutritional value (extends base nutritional value)
export interface INutritionalValue extends IBaseNutritionalValue {}

// Product with server methods (extends base product)
export interface IProduct extends IBaseProduct, BaseDocument {
  categoryId: Types.ObjectId;
  subCategoryId: Types.ObjectId;
  kashruts?: Types.ObjectId[];
  allergenTypeCode?: Types.ObjectId[];
  allergenTypeCodeMayContain?: Types.ObjectId[];
  existingProductId?: Types.ObjectId;
  
  // Server methods
  markAsKosher(): Promise<IProduct>;
  markAsOrganic(): Promise<IProduct>;
  markAsGlutenFree(): Promise<IProduct>;
}

// ============================================================================
// SERVER-SPECIFIC ENUMS AND TYPES
// ============================================================================

// Product unit enum
export enum ProductUnit {
  UNITS = 'יחידות',
  KG = 'ק"ג',
  GRAM = 'גרם',
  LITER = 'ליטר',
  ML = 'מ"ל',
  PACKAGE = 'אריזה',
  WEIGHT = 'במשקל',
  BUNCH = 'צרור',
  DOZEN = 'תריסר',
  BOTTLE = 'בקבוק',
  CAN = 'קופסה',
  BOX = 'קרטון',
  BAG = 'שקית'
}

// Item category and unit types
export type ItemCategory =
  | "fruits_vegetables"
  | "meat_fish"
  | "dairy"
  | "bakery"
  | "pantry"
  | "frozen"
  | "beverages"
  | "snacks"
  | "household"
  | "personal_care"
  | "other";

export type ItemUnit =
  | "piece"
  | "kg"
  | "g"
  | "lb"
  | "oz"
  | "l"
  | "ml"
  | "cup"
  | "tbsp"
  | "tsp"
  | "package"
  | "box"
  | "bag"
  | "bottle"
  | "can";

export type InviteRole = 'admin' | 'member';

// ============================================================================
// API TYPES
// ============================================================================

// API response interface
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string>;
  stack?: string;
  details?: {
    name: string;
    statusCode?: number;
    isOperational?: boolean;
  };
  isEmailVerified?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Type alias for API responses without data
export type ApiResponse = IApiResponse<void>;

// API error interface
export interface IApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string>;
  isEmailVerified?: boolean;
}

// Paginated response interface
export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Pagination query interface
export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

// Authentication request interface
export interface IAuthRequest {
  email: string;
  password: string;
}

// Registration request interface
export interface IRegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Authentication response interface
export interface IAuthResponse {
  user: Omit<IUser, "password" | "refreshSessions">;
  accessToken: string;
  refreshToken?: string; // Only for MOBILE mode
  sessionId?: string; // Only for MOBILE mode
  groupJoined?: string; // Group ID if user joined a group during registration
  inviteError?: string; // Error message if invitation failed (but registration succeeded)
}

// ============================================================================
// SOCKET TYPES
// ============================================================================

// Simple user interface for socket events (without email for security)
export interface IUserSimple {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

// Socket user interface
export interface ISocketUser {
  userId: string;
  username: string;
  socketId: string;
  groups: string[];
  status: "shopping" | "online" | "away" | "offline";
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | undefined;
}

// Chat message interface for socket events
export interface IChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date | string;
  type: "text" | "image" | "system" | "item_update" | "list_update";
  status: "sending" | "sent" | "delivered" | "read";
  metadata?: IBaseMessage['metadata'];
}

// Socket message interface
export interface ISocketMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    avatar?: string;
  };
  groupId: string;
  messageType: "text" | "image" | "system";
  timestamp: Date;
  metadata?: IBaseMessage['metadata'];
}

// Socket item update interface
export interface ISocketItemUpdate {
  itemId: string;
  action: "add" | "update" | "delete" | "purchase" | "unpurchase" | "created";
  item: Partial<IItem>;
  updatedBy: {
    id: string;
    username: string;
  };
  timestamp: Date;
  updates?: {
    status?: string;
    isPurchased?: boolean;
    isPartiallyPurchased?: boolean;
    purchasedQuantity?: number;
    purchasedAt?: string | null;
    purchasedBy?: string | null;
  };
  listName?: string;
  listId?: string;
}

// Socket list update interface
export interface ISocketListUpdate {
  listId: string;
  groupId?: string;
  action: "create" | "update" | "delete" | "complete" | "reopen" | "item_added" | "item_purchased";
  list: Partial<IShoppingList>;
  updatedBy: {
    id: string;
    username: string;
  };
  timestamp: Date;
}

// Socket user status interface
export interface ISocketUserStatus {
  userId: string;
  status: "shopping" | "online" | "away" | "offline";
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: Date;
}

// Socket notification interface
export interface ISocketNotification {
  type: string;
  title?: string;
  message?: string;
  data?: Record<string, string | number | boolean | null>;
  timestamp?: Date;
}

// WebSocket events interface - unified for client and server
export interface IWebSocketEvents {
  'list:updated': {
    listId: string;
    groupId?: string;
    action: string;
    list: Partial<IShoppingList>;
    updatedBy: { id: string; username: string };
    timestamp: Date | string;
  };
  'item:updated': {
    listId?: string;
    itemId: string;
    action: string;
    item: Partial<IItem>;
    updatedBy: { id: string; username: string };
    timestamp: Date | string;
    updates?: {
      status: string;
      isPurchased: boolean;
      isPartiallyPurchased?: boolean;
      purchasedQuantity?: number;
      purchasedAt: string | null;
      purchasedBy: string | null;
    };
    listName?: string;
  };
  'shopping:started': {
    listId: string;
    user: IUserSimple;
    startedAt: Date | string;
    sessionId: string;
  };
  'shopping:stopped': {
    listId: string;
    user: IUserSimple;
    stoppedAt: Date | string;
    sessionId: string;
    itemsPurchased?: number;
    totalItems?: number;
    shoppingTime?: number;
  };
  'shopping:paused': {
    listId: string;
    user: IUserSimple;
    pausedAt: Date | string;
    sessionId: string;
  };
  'shopping:resumed': {
    listId: string;
    user: IUserSimple;
    resumedAt: Date | string;
    sessionId: string;
  };
  'shopping:location_updated': {
    listId: string;
    user: IUserSimple;
    sessionId: string;
    location: {
      latitude: number;
      longitude: number;
      address?: string;
      storeName?: string;
    };
  };
  'chat:message': {
    groupId: string;
    message: IChatMessage;
  };
  'user:status_changed': {
    userId: string;
    status: "online" | "offline" | "shopping" | "away";
    timestamp: Date | string;
  };
  'online_users': Array<{
    userId: string;
    username: string;
    status: string;
  }>;
  'notification': {
    type: string;
    title?: string;
    message?: string;
    data?: Record<string, string | number | boolean | null>;
    timestamp?: Date | string;
  };
}

export type ISocketPayload = ISocketMessage | ISocketItemUpdate | ISocketListUpdate | ISocketUserStatus | ISocketNotification | IWebSocketEvents[keyof IWebSocketEvents] | Record<string, string | number | boolean | null | undefined | object | Date>;

// ============================================================================
// ADDITIONAL MODEL TYPES
// ============================================================================

// Kashrut interface
export interface IKashrut extends Document {
  name: string;
  is_leading: number;
  media_url?: string;
  idFromApi: string;
}

// Allergen interface
export interface IAllergen extends Document {
  allergenTypeCode: number;
  allergenTypeName: string;
  allergenTypeNameEn: string;
}

// ============================================================================
// TYPE ALIASES FOR BACKWARD COMPATIBILITY
// ============================================================================

// Legacy type aliases to maintain existing code compatibility
export type GroupDocument = IGroup;
export type ShoppingListDocument = IShoppingList;
export type ItemDocument = IItem;
export type MessageDocument = IMessage;
export type ProductDocument = IProduct;
export type CategoryDocument = ICategory;
export type SubCategoryDocument = ISubCategory;
export type ShoppingListItemDocument = IShoppingListItem;
export type ReadStatusDocument = IReadStatus;
export type NutritionalValueDocument = INutritionalValue;
export type ProductUnitDocument = ProductUnit;
export type ItemCategoryDocument = ItemCategory;
export type ItemUnitDocument = ItemUnit;
export type InviteRoleDocument = InviteRole;
export type ShoppingSessionDocument = IShoppingSession;
export type GroupMemberDocument = IGroupMember;
export type PendingInviteDocument = IPendingInvite;
export type PendingInvitationDocument = IPendingInvitation;
export type KashrutDocument = IKashrut;
export type AllergenDocument = IAllergen;

// ============================================================================
// POPULATED FIELD TYPES
// ============================================================================

// Types for populated user fields (when using populate with specific fields)
export type PopulatedUser = Pick<IBaseUser, 'username' | 'firstName' | 'lastName' | 'avatar'> & { _id: Types.ObjectId };

// Type for populated sender in messages
export type PopulatedSender = Pick<IBaseUser, 'username' | 'firstName' | 'lastName' | 'avatar'> & { _id: Types.ObjectId };

// Type for populated message (with populated sender)
export type PopulatedMessage = Omit<IMessage, 'sender'> & {
  sender: PopulatedSender;
};

// Type for populated message with populated group and sender
export type PopulatedMessageWithGroup = Omit<IMessage, 'sender' | 'group'> & {
  sender: PopulatedSender;
  group: IGroup;
};

// Type for populated item with populated shopping list
export type PopulatedItemWithShoppingList = Omit<IItem, 'shoppingList'> & {
  shoppingList: PopulatedShoppingListWithGroup;
};

// Message statistics interface (from aggregation)
export interface IMessageStatistic {
  _id: string; // messageType
  totalMessages: number;
  dailyStats: Array<{
    date: string;
    count: number;
    avgReadTime: number | null;
  }>;
}

// Group statistics interface (from ShoppingList.getStatistics aggregation)
export interface IGroupStatistic {
  _id: string; // status
  count: number;
  totalEstimated: number;
  totalActual: number;
  avgCompletionTime: number | null;
}

// Array type for group statistics (getStatistics returns an array)
export type IGroupStatistics = IGroupStatistic[];

// Type for populated shopping list with group
export type PopulatedShoppingListWithGroup = Omit<IShoppingList, 'group'> & {
  group: IGroup;
  _id: Types.ObjectId;
};

// Types for populated group fields (when using populate with specific fields)
export type PopulatedGroup = Pick<IBaseGroup, 'name' | 'description' | 'avatar'> & { _id: Types.ObjectId };

// Shopping list response data interface
export interface IShoppingListResponseData {
  shoppingList: {
    _id: Types.ObjectId;
    name: string;
    description?: string | undefined;
    status: IBaseShoppingList['status'];
    priority: IBaseShoppingList['priority'];
    tags: string[];
    metadata: IBaseShoppingList['metadata'];
    group: PopulatedGroup | Types.ObjectId;
    createdBy: PopulatedUser | Types.ObjectId;
    assignedTo?: PopulatedUser | Types.ObjectId | undefined;
    createdAt: Date;
    updatedAt: Date;
  };
  items?: Array<{
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
  }>;
  stats?: {
    totalItems: number;
    purchasedItems: number;
    remainingItems: number;
    progress: number;
  };
  shoppingSession?: {
    currentUserSession: IShoppingSession | null;
    activeSessions: IShoppingSession[];
    totalActiveSessions: number;
  };
}

// ============================================================================
// ITEM MODEL OPTIONS INTERFACES
// ============================================================================

// Options for findByShoppingList
export interface IFindByShoppingListOptions {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
  sort?: string;
  populateProduct?: boolean;
}

// Options for findByCategory
export interface IFindByCategoryOptions {
  limit?: number;
  sort?: string;
}

// Options for searchItems, findByProduct, findManualItems, findProductBasedItems
export interface IItemQueryOptions {
  category?: string;
  limit?: number;
  skip?: number;
}

// Category stats result from aggregation
export interface ICategoryStats {
  _id: Types.ObjectId;
  totalItems: number;
  purchasedItems: number;
  totalEstimated: number;
  totalActual: number;
  avgPrice: number;
  completionRate: number;
}

// ============================================================================
// MESSAGE MODEL OPTIONS INTERFACES
// ============================================================================

// Options for findByGroup
export interface IFindByGroupOptions {
  page?: number;
  limit?: number;
  before?: string | Types.ObjectId; // Message ID to get messages before
  after?: string | Types.ObjectId; // Message ID to get messages after
  messageType?: IBaseMessage['messageType'];
  search?: string;
  includeDeleted?: boolean;
}

// Options for searchMessages
export interface ISearchMessagesOptions {
  limit?: number;
  skip?: number;
  messageType?: IBaseMessage['messageType'];
}

// ============================================================================
// ERROR TYPES
// ============================================================================

// Mongoose duplicate key error
export interface IMongooseDuplicateKeyError extends Error {
  code: number;
  keyValue: Record<string, string | number | boolean | null | object | Date>;
  keyPattern?: Record<string, number>;
}

// Mongoose validation error
export interface IMongooseValidationError extends Error {
  name: 'ValidationError';
  errors: Record<string, {
    message: string;
    name: string;
    path: string;
    value: unknown;
  }>;
}

// Mongoose cast error
export interface IMongooseCastError extends Error {
  name: 'CastError';
  path: string;
  value: unknown;
  kind?: string;
  model?: string;
}

// Extended error type for error handlers
export interface IExtendedError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  isEmailVerified?: boolean;
  code?: number;
  keyValue?: Record<string, string | number | boolean | null | object | Date>;
  errors?: Record<string, { message: string }>;
  path?: string;
  value?: unknown;
}

// Validation error from express-validator
export interface IValidationError {
  path?: string;
  param?: string;
  msg: string;
  value?: unknown;
}

// Pagination interface
export interface IPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

// ============================================================================
// SHOPPING LIST MODEL OPTIONS INTERFACES
// ============================================================================

// Options for findByGroup
export interface IFindByGroupShoppingListOptions {
  status?: IShoppingList['status'];
  assignedTo?: string | Types.ObjectId;
  priority?: IShoppingList['priority'];
  tags?: string[];
  page?: number;
  limit?: number;
  sort?: string;
}
