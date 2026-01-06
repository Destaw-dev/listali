
import type { ReactNode } from 'react';

// ============================================================================
// BASE TYPES
// ============================================================================

// Base interface for all documents (without Mongoose dependencies)
export interface BaseDocument {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// USER TYPES
// ============================================================================

// Core user interface - used across the entire application
export interface IUser extends BaseDocument {
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
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  groups: string[];
}

// Extended user interface for server-side operations
export interface IUserWithPassword extends IUser {
  password: string;
  googleId?: string;
  pendingInvitations: IPendingInvitation[];
}

// User methods for server-side operations
export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User document type for server
export type UserDocument = IUserWithPassword & IUserMethods;

export interface IUserSimple {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

// ============================================================================
// GROUP TYPES
// ============================================================================

// Core group interface - used across the entire application
export interface IGroup extends BaseDocument {
  name: string;
  description?: string;
  avatar?: string;
  members: IGroupMember[];
  owner: string;
  createdBy: string; // Alias for owner to maintain compatibility
  settings: {
    allowMemberInvite: boolean;
    requireApproval: boolean;
    maxMembers: number;
  };
  inviteCode: string;
  isActive: boolean;
  shoppingLists: string[];
  pendingInvites: IPendingInvite[];
}

// Group member interface
export interface IGroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
  user: IUserSimple & { email: string; lastSeen: Date };
  permissions: {
    canCreateLists: boolean;
    canEditLists: boolean;
    canDeleteLists: boolean;
    canInviteMembers: boolean;
    canManageMembers: boolean;
  };
}

// Pending invite interface
export interface IPendingInvite {
  id: string;
  user?: string;
  email?: string;
  code: string;
  role: 'admin' | 'member';
  type: 'in-app' | 'email';
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'declined';
}

// Pending invitation interface (extends BaseDocument)
export interface IPendingInvitation extends BaseDocument {
  group: string;
  invitedBy: string;
  code: string;
  role: 'admin' | 'member';
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'declined';
}

// ============================================================================
// SHOPPING LIST TYPES
// ============================================================================

// User info for populated fields
export interface IPopulatedUserInfo {
  _id: string;
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

// Core shopping list interface - used across the entire application
export interface IShoppingList extends BaseDocument {
  name: string;
  description?: string;
  group: string;
  groupId: string;
  createdBy: string | IPopulatedUserInfo;
  status: "active" | "completed" | "archived";
  isActive: boolean;
  isCompleted: boolean;
  items: string[];
  assignedTo?: string | IPopulatedUserInfo;
  completedAt?: Date | null;
  priority: "low" | "medium" | "high";
  tags: string[];
  metadata: {
    estimatedTotal?: number;
    actualTotal?: number;
    itemsCount: number;
    completedItemsCount: number;
  };
  shoppingSessions: IShoppingSession[];
}

// Shopping session interface
export interface IShoppingSession {
  id: string;
  _id?: string;
  listId: string;
  userId: string;
  groupId: string;
  startedAt: Date | string;
  endedAt?: Date | string;
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
  lastActivity: Date | string;
  user?: IUserSimple; // For populated sessions
}

// Shopping session data structure (from API with activeSessions)
export interface IShoppingSessionData {
  currentUserSession: IShoppingSession | null;
  activeSessions: IShoppingSession[];
  totalActiveSessions: number;
}

// ============================================================================
// ITEM TYPES
// ============================================================================

// Core item interface - used across the entire application
export interface IItem extends BaseDocument {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  category: string | ICategory | { _id: string; id?: string };
  brand?: string;
  estimatedPrice?: number;
  actualPrice?: number;
  price?: number;
  image?: string | { primary: string, providers: Record<string, { url: string }> };
  barcode?: string;
  status: "pending" | "purchased" | "not_available" | "cancelled";
  isPurchased: boolean;
  isPartiallyPurchased?: boolean;
  purchasedQuantity?: number;
  remainingQuantity?: number;
  addedBy: string | IPopulatedUserInfo;
  purchasedBy?: string | IPopulatedUserInfo | null;
  purchasedAt?: Date | null;
  updatedBy?: string;
  beingPurchasedBy?: string;
  shoppingList: string;
  priority: "low" | "medium" | "high";
  notes?: string;
  note?: string;
  alternatives?: string[];
  product?: string | IProduct;
  productId?: string;
  isManualEntry?: boolean;
}

// Shopping list item interface (simplified version)
export interface IShoppingListItem extends BaseDocument {
  name: string;
  quantity: number;
  unit?: string;
  product?: string;
  category?: string;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  addedBy: string;
  addedAt: Date;
}

export type ItemInput = {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  brand?: string;
  description?: string;
  product?: string;
  // image?: { primary: string, providers: Record<string, { url: string }> };
  image?: string ;
  units?: string[];
  isManualEntry?: boolean;
};

// Create multiple items input (for API)
export interface ICreateMultipleItemsInput {
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  category?: string;
  brand?: string;
  estimatedPrice?: number;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  alternatives?: string[];
  shoppingListId: string;
  product?: string;
  isManualEntry?: boolean;
}

// Manual product type (for AddItemsModal)
export interface IManualProduct {
  _id: string;
  name: string;
  defaultUnit: string;
  units: string[];
  priority: 'low' | 'medium' | 'high';
  notes: string;
  brand: string;
  description: string;
  image?: { primary: string, providers: Record<string, { url: string }> };
  isManual: true;
  categoryId?: never; // Explicitly not present
}

// Type guard to check if product is manual
export function isManualProduct(product: IProduct | IManualProduct): product is IManualProduct {
  return 'isManual' in product && product.isManual === true;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

// Core message interface - used across the entire application
export interface IMessage extends BaseDocument {
  content: string;
  sender: string;
  group: string;
  messageType: "text" | "image" | "system" | "item_update" | "list_update";
  metadata?: {
    itemId?: string;
    listId?: string;
    imageUrl?: string;
    fileName?: string;
    fileSize?: number;
  };
  readBy: IReadStatus[];
  editedAt?: Date;
  isDeleted: boolean;
}

// Read status interface
export interface IReadStatus {
  user: string;
  readAt: Date;
}

// Message document interface for server
export interface IMessageDocument extends IMessage {
  markAsRead(userId: string): Promise<this>;
  editMessage(newContent: string, editorId: string): Promise<this>;
  deleteMessage(deleterId: string): Promise<this>;
}

// ============================================================================
// SOCKET TYPES
// ============================================================================

// WebSocket events interface - unified for client and server (matches server)
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
    startedAt: string | Date;
    sessionId: string;
  };
  'shopping:stopped': {
    listId: string;
    user: IUserSimple;
    stoppedAt: string | Date;
    sessionId: string;
    itemsPurchased?: number;
    totalItems?: number;
    shoppingTime?: number;
  };
  'shopping:paused': {
    listId: string;
    user: IUserSimple;
    pausedAt: string | Date;
    sessionId: string;
  };
  'shopping:resumed': {
    listId: string;
    user: IUserSimple;
    resumedAt: string | Date;
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
  'memberRoleUpdated': {
    groupId: string;
    userId: string;
    role: "owner" | "admin" | "member";
    timestamp: Date | string;
    updaterId: string;
  };
  'ownershipTransferred': {
    groupId: string;
    transferredBy: string;
    previousOwnerId: string;
    newOwnerId: string;
    timestamp: Date | string;
  };
}

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
  metadata?: Record<string, unknown>;
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

// Chat message interface (matches server)
export interface IChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: string | Date;
  type: "text" | "image" | "system" | "item_update" | "list_update";
  status: "sending" | "sent" | "delivered" | "read";
  metadata?: {
    itemId?: string;
    listId?: string;
    imageUrl?: string;
    fileName?: string;
    fileSize?: number;
  };
}

// ============================================================================
// PRODUCT TYPES
// ============================================================================

// Product category interface
export interface ICategory extends BaseDocument {
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  description?: string;
}

// Product subcategory interface
export interface ISubCategory extends BaseDocument {
  categoryId: string;
  name: string;
  nameEn: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  description?: string;
  category?: ICategory;
}

// Nutritional value interface
export interface INutritionalValue {
  key: INutritionalKey;
  label: string;
  value: number;
  unit: string;
  per: string;
  originalCode: string;
}

// Nutritional key type
export type INutritionalKey =
  | 'energy'
  | 'fat'
  | 'saturatedFat'
  | 'transFat'
  | 'cholesterol'
  | 'sodium'
  | 'carbs'
  | 'sugars'
  | 'sugarSpoons'
  | 'polyols'
  | 'fibers'
  | 'protein'
  | 'fiber'
  | 'carbohydrates'
  | 'unknown';

// Product interface
export interface IProduct extends BaseDocument {
  name: string;
  categoryId: string;
  subCategoryId: string;
  barcode?: string;
  defaultUnit: string;
  units: string[];
  image?: {
    primary: string;
    providers: {
      cloudinary: { url: string; publicId: string };
      imagekit: { url: string; fileId: string; path: string };
    };
  };
  averagePrice?: number;
  price?: number;
  tags: string[];
  isActive: boolean;
  kosher?: boolean;
  kosherType?: string;
  kashruts?: string[];
  organic?: boolean;
  glutenFree?: boolean;
  brand?: string;
  category?: ICategory;
  subCategory?: ISubCategory;
  alcoholPercentageInProduct?: string;
  allergenTypeCode?: string[];
  allergenTypeCodeMayContain?: string[];
  countryOfOrigin?: string;
  foodSymbolRed?: string[];
  forbiddenUnder18?: boolean;
  hazardPrecautionaryStatement?: string;
  ingredientSequence?: string;
  nutritionalValues?: INutritionalValue[];
  existingProductId?: string;
}

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

// ============================================================================
// ITEM CATEGORIES AND UNITS
// ============================================================================

// Item category type
export type IItemCategory =
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

// Item unit type
export type IItemUnit =
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

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

// API response interface
export interface IApiResponse<T = unknown> {
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
  inviteCode?: string;
}

// Authentication response interface
export interface IAuthResponse {
  user: Omit<IUser, "password">;
  token: string;
  refreshToken?: string;
}

// ============================================================================
// CLIENT-SPECIFIC TYPES (UI State)
// ============================================================================

// Authentication state interface
export interface IAuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Login credentials interface
export interface ILoginCredentials {
  email: string;
  password: string;
}

// Registration data interface
export interface IRegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Create group data interface
export interface ICreateGroupData {
  name: string;
  description?: string;
}

// Invite user data interface
export interface IInviteUserData {
  email: string;
  role: 'admin' | 'member';
}

// Create shopping list data interface
export interface ICreateShoppingListData {
  name: string;
  description?: string;
  groupId: string;
  priority?: "low" | "medium" | "high";
}

// Create list form data (without groupId - added separately)
export interface ICreateListFormData {
  name: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  tags?: string[];
}

// Helper type guards and utilities
export function isPopulatedUserInfo(value: string | IPopulatedUserInfo): value is IPopulatedUserInfo {
  return typeof value === 'object' && value !== null && '_id' in value && 'username' in value;
}

export function getCreatedByDisplayName(createdBy: string | IPopulatedUserInfo): string {
  if (isPopulatedUserInfo(createdBy)) {
    return createdBy.username || `${createdBy.firstName} ${createdBy.lastName}`.trim();
  }
  return '';
}

export function getCreatedByFullName(createdBy: string | IPopulatedUserInfo): string {
  if (isPopulatedUserInfo(createdBy)) {
    return `${createdBy.firstName} ${createdBy.lastName}`.trim();
  }
  return '';
}

// Add shopping item data interface
export interface IAddShoppingItemData {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  priority?: "low" | "medium" | "high";
  notes?: string;
  estimatedPrice?: number;
  brand?: string;
  image?: { primary: string, providers: Record<string, { url: string }> };
  barcode?: string;
}

// Update shopping item data interface
export interface IUpdateShoppingItemData {
  name?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  priority?: "low" | "medium" | "high";
  notes?: string;
  estimatedPrice?: number;
  brand?: string;
  image?: { primary: string, providers: Record<string, { url: string }> };
  barcode?: string;
}

// Shopping status interface
export interface IShoppingStatus {
  isShopping: boolean;
  currentListId?: string;
  startedAt?: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

// Shopping mode state interface
export interface IShoppingModeState {
  currentSession: IShoppingSession | null;
  activeSessions: IShoppingSession[];
  isLoading: boolean;
  error: string | null;
  shoppingStats: {
    totalItems: number;
    purchasedItems: number;
    remainingItems: number;
    progress: number; // percentage
  };
}

// Shopping session request interfaces
export interface IStartShoppingRequest {
  listId: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    storeName?: string;
  };
}

export interface IStopShoppingRequest {
  sessionId: string;
}

export interface IPauseShoppingRequest {
  sessionId: string;
}

export interface IResumeShoppingRequest {
  sessionId: string;
}

export interface IUpdateLocationRequest {
  sessionId: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    storeName?: string;
  };
}

// Shopping session response interfaces
export interface IStartShoppingResponse {
  sessionId: string;
  startedAt: Date;
  totalItems: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    storeName?: string;
  };
}

export interface IStopShoppingResponse {
  sessionId: string;
  endedAt: Date;
  itemsPurchased: number;
  totalItems: number;
  shoppingTime: number;
}

export interface IShoppingStatusResponse {
  listId: string;
  totalItems: number;
  purchasedItems: number;
  activeSessions: IShoppingSession[];
  userSession: IShoppingSession | null;
}

// Shopping dashboard interfaces
export interface IShoppingDashboardSession {
  id: string;
  listId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  startedAt: Date;
  status: 'active' | 'paused';
  itemsPurchased: number;
  totalItems: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    storeName?: string;
  };
  lastActivity: Date;
  sessionDuration: number;
  sessionProgress: number;
  estimatedTimeRemaining: number;
}

export interface IShoppingDashboardResponse {
  listId: string;
  listName: string;
  groupId: string;
  groupName: string;
  totalItems: number;
  purchasedItems: number;
  progressPercentage: number;
  totalEstimatedTime: number;
  activeShoppers: number;
  activeSessions: IShoppingDashboardSession[];
  lastUpdated: Date;
}

// App notification interface
export interface IAppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
}

// ============================================================================
// FORM AND UI TYPES
// ============================================================================

// Form field error interface
export interface IFormFieldError {
  field: string;
  message: string;
}

// Form errors interface
export interface IFormErrors {
  [key: string]: string;
}

// Loading state interface
export interface ILoadingState {
  isLoading: boolean;
  error: string | null;
}

// Modal state interface
export interface IModalState {
  isOpen: boolean;
  data?: unknown;
}

// Base component props interface
export interface IBaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// Button props interface
export interface IButtonProps extends IBaseComponentProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'destructive' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

// Input props interface
export interface IInputProps extends IBaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
}

// Avatar props interface
export interface IAvatarProps extends IBaseComponentProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
}

// Modal props interface
export interface IModalProps extends IBaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Badge props interface
export interface IBadgeProps extends IBaseComponentProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

// Spinner props interface
export interface ISpinnerProps extends IBaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

// Empty state props interface
export interface IEmptyStateProps extends IBaseComponentProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

// Dashboard stats interface
export interface IDashboardStats {
  groups: number;
  lists: number;
  completedLists: number;
  totalItems: number;
  purchasedItems: number;
  remainingItems: number;
  completedTasks: number;
  pendingTasks: number;
}

// Growth stats interface
export interface IGrowthStats {
  groupsGrowth: number;
  listsGrowth: number;
  completedTasksGrowth: number;
}

// Recent activity interface
export interface IRecentActivity {
  id: string;
  type: 'message' | 'item_purchased' | 'list_created' | 'group_joined';
  title: string;
  description: string;
  timestamp: Date;
  groupName?: string | undefined;
}

// Achievement interface
export interface IAchievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

// Dashboard data interface
export interface IDashboardData {
  stats: IDashboardStats;
  growth: IGrowthStats;
  recentActivity: IRecentActivity[];
  achievements: IAchievement[];
  user: {
    lastActive: string;
    online: boolean;
  };
}

// ============================================================================
// STORE TYPES
// ============================================================================

// Groups store interface
export interface IGroupsStore {
  groups: IGroup[];
  currentGroup: IGroup | null;
  isLoading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  createGroup: (data: ICreateGroupData) => Promise<IGroup>;
  joinGroup: (inviteCode: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  selectGroup: (group: IGroup) => void;
  inviteUser: (data: IInviteUserData) => Promise<void>;
  clearError: () => void;
}

// Shopping store interface
export interface IShoppingStore {
  lists: IShoppingList[];
  currentList: IShoppingList | null;
  shoppingStatus: IShoppingStatus;
  isLoading: boolean;
  error: string | null;
}

// Theme type
export type Theme = 'light' | 'dark' | 'system';

// Theme store interface
export interface IThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  updateThemeOnServer?: (theme: Theme) => Promise<void>;
}

// ============================================================================
// TYPE ALIASES FOR BACKWARD COMPATIBILITY
// ============================================================================

// Legacy type aliases to maintain existing code compatibility
export type User = IUser;
export type Group = IGroup;
export type ShoppingList = IShoppingList;
export type Item = IItem;
export type Message = IMessage;
export type Product = IProduct;
export type Category = ICategory;
export type SubCategory = ISubCategory;
export type ChatMessage = IChatMessage;
export type WebSocketEvents = IWebSocketEvents;
export type ApiResponse<T> = IApiResponse<T>;
export type PaginatedResponse<T> = IPaginatedResponse<T>;
export type AuthStore = IAuthState;
export type GroupsStore = IGroupsStore;
export type ShoppingStore = IShoppingStore;
export type ThemeStore = IThemeStore;
export type BaseComponentProps = IBaseComponentProps;
export type ButtonProps = IButtonProps;
export type InputProps = IInputProps;
export type AvatarProps = IAvatarProps;
export type ModalProps = IModalProps;
export type BadgeProps = IBadgeProps;
export type SpinnerProps = ISpinnerProps;
export type EmptyStateProps = IEmptyStateProps;
export type LoadingState = ILoadingState;
export type ModalState = IModalState;
export type FormErrors = IFormErrors;
export type FormFieldError = IFormFieldError;
export type AppNotification = IAppNotification;
export type ShoppingStatus = IShoppingStatus;
export type CreateGroupData = ICreateGroupData;
export type InviteUserData = IInviteUserData;
export type CreateShoppingListData = ICreateShoppingListData;
export type AddShoppingItemData = IAddShoppingItemData;
export type UpdateShoppingItemData = IUpdateShoppingItemData;
export type LoginCredentials = ILoginCredentials;
export type RegisterData = IRegisterData;
export type AuthRequest = IAuthRequest;
export type RegisterRequest = IRegisterRequest;
export type AuthResponse = IAuthResponse;
export type PaginationQuery = IPaginationQuery;
export type ShoppingSession = IShoppingSession;
export type GroupMember = IGroupMember;
export type PendingInvite = IPendingInvite;
export type PendingInvitation = IPendingInvitation;
export type ShoppingListItem = IShoppingListItem;
export type ReadStatus = IReadStatus;
export type SocketUser = ISocketUser;
export type SocketMessage = ISocketMessage;
export type SocketItemUpdate = ISocketItemUpdate;
export type SocketListUpdate = ISocketListUpdate;
export type SocketUserStatus = ISocketUserStatus;
export type ApiError = IApiError;
export type NutritionalValue = INutritionalValue;
export type NutritionalKey = INutritionalKey;
export type ItemCategory = IItemCategory;
export type ItemUnit = IItemUnit;
export type InviteRole = 'admin' | 'member';
export type MessageDocument = IMessageDocument;
export type DashboardStats = IDashboardStats;
export type GrowthStats = IGrowthStats;
export type RecentActivity = IRecentActivity;
export type Achievement = IAchievement;
export type DashboardData = IDashboardData;
