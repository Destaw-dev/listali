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
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}

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
  pendingInvites: any[];
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
  unit: string;
  brand?: string;
  estimatedPrice?: number;
  actualPrice?: number;
  price?: number;
  image?: string;
  barcode?: string;
  status: "pending" | "purchased" | "not_available" | "cancelled";
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
  barcode?: string;
  defaultUnit: string;
  units: string[];
  image?: string;
  averagePrice?: number;
  price?: number;
  tags: string[];
  isActive: boolean;
  supplier?: string;
  kosher?: boolean;
  kosherType?: string;
  organic?: boolean;
  glutenFree?: boolean;
  brand?: string;
  category?: IBaseCategory;
  subCategory?: IBaseSubCategory;
  alcoholPercentageInProduct?: string;
  countryOfOrigin?: string;
  foodSymbolRed?: string[];
  forbiddenUnder18?: boolean;
  hazardPrecautionaryStatement?: string;
  ingredientSequence?: string;
  nutritionalValues?: IBaseNutritionalValue[];
}

// ============================================================================
// SERVER-SPECIFIC USER EXTENSIONS
// ============================================================================

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
}

// User methods for server-side operations
export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
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
  markAsNotPurchased(): Promise<void>;
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
  KG = 'ק״ג',
  GRAM = 'גרם',
  LITER = 'ליטר',
  ML = 'מ״ל',
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
export interface IApiResponse<T = any> {
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
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API error interface
export interface IApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string>;
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
  user: Omit<IUser, "password">;
  token: string;
  refreshToken?: string;
}

// ============================================================================
// SOCKET TYPES
// ============================================================================

// Socket user interface
export interface ISocketUser {
  userId: string;
  username: string;
  socketId: string;
  groups: string[];
  status: "shopping" | "online" | "away";
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | undefined;
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
  metadata?: Record<string, any>;
}

// Socket item update interface
export interface ISocketItemUpdate {
  itemId: string;
  action: "add" | "update" | "delete" | "purchase" | "unpurchase";
  item: Partial<IItem>;
  updatedBy: {
    id: string;
    username: string;
  };
  timestamp: Date;
}

// Socket list update interface
export interface ISocketListUpdate {
  listId: string;
  action: "create" | "update" | "delete" | "complete" | "reopen";
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
  };
  timestamp: Date;
}

// ============================================================================
// ADDITIONAL MODEL TYPES
// ============================================================================

// Kashrut interface
export interface IKashrut extends Document {
  KashrutId: number;
  name: string;
  is_leading: number;
  media_url?: string;
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
