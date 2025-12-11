export interface BaseDocument {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}
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
        darkMode: boolean;
        language: string;
    };
    groups: string[];
}
export interface IGroup extends BaseDocument {
    name: string;
    description?: string;
    avatar?: string;
    members: IGroupMember[];
    owner: string;
    settings: {
        allowMemberInvite: boolean;
        requireApproval: boolean;
        maxMembers: number;
    };
    inviteCode: string;
    isActive: boolean;
    shoppingLists: string[];
    pendingInvites: IPendingInvites[];
}
export interface IGroupMember {
    user: string;
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
type InviteRole = 'admin' | 'member';
export interface IPendingInvites {
    user: string;
    code: string;
    role: InviteRole;
    invitedAt: string;
}
export interface IShoppingList extends BaseDocument {
    name: string;
    description?: string;
    group: string;
    createdBy: string;
    status: "active" | "completed" | "archived";
    items: string[];
    assignedTo?: string;
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
export interface IItem extends BaseDocument {
    name: string;
    description?: string;
    quantity: number;
    unit: string;
    category: string;
    brand?: string;
    estimatedPrice?: number;
    actualPrice?: number;
    image?: string;
    barcode?: string;
    status: "pending" | "purchased" | "not_available" | "cancelled";
    addedBy: string;
    purchasedBy?: string | null;
    purchasedAt?: Date | null;
    shoppingList: string;
    priority: "low" | "medium" | "high";
    notes?: string;
    alternatives?: string[];
    product?: string;
    isManualEntry?: boolean;
}
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
export interface IReadStatus {
    user: string;
    readAt: Date;
}
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
export interface ISocketUserStatus {
    userId: string;
    status: "shopping" | "online" | "away" | "offline";
    location?: {
        latitude: number;
        longitude: number;
    };
    timestamp: Date;
}
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
export interface IApiError {
    message: string;
    statusCode: number;
    errors?: Record<string, string>;
}
export interface IAuthRequest {
    email: string;
    password: string;
}
export interface IRegisterRequest {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
export interface IAuthResponse {
    user: Omit<IUser, "password">;
    token: string;
    refreshToken?: string;
}
export interface IPaginationQuery {
    page?: number;
    limit?: number;
    sort?: string;
    order?: "asc" | "desc";
    search?: string;
}
export interface IShoppingSession {
    userId: string;
    groupId: string;
    listId: string;
    startTime: Date;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    isActive: boolean;
}
export type ItemCategory = "fruits_vegetables" | "meat_fish" | "dairy" | "bakery" | "pantry" | "frozen" | "beverages" | "snacks" | "household" | "personal_care" | "other";
export type ItemUnit = "piece" | "kg" | "g" | "lb" | "oz" | "l" | "ml" | "cup" | "tbsp" | "tsp" | "package" | "box" | "bag" | "bottle" | "can";
export interface ICategory extends BaseDocument {
    name: string;
    nameEn: string;
    icon: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
    description?: string;
}
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
export type NutritionalKey = 'energy' | 'fat' | 'saturatedFat' | 'transFat' | 'cholesterol' | 'sodium' | 'carbs' | 'sugars' | 'sugarSpoons' | 'polyols' | 'fibers' | 'protein' | 'fiber' | 'carbohydrates' | 'unknown';
export interface NutritionalValue {
    key: NutritionalKey;
    label: string;
    value: number;
    unit: string;
    per: string;
    originalCode: string;
}
export interface IProduct extends BaseDocument {
    name: string;
    categoryId: string;
    subCategoryId: string;
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
    nutritionalValues?: NutritionalValue[];
    existingProductId?: string;
}
export declare enum ProductUnit {
    UNITS = "\u05D9\u05D7\u05D9\u05D3\u05D5\u05EA",
    KG = "\u05E7\u05F4\u05D2",
    GRAM = "\u05D2\u05E8\u05DD",
    LITER = "\u05DC\u05D9\u05D8\u05E8",
    ML = "\u05DE\u05F4\u05DC",
    PACKAGE = "\u05D0\u05E8\u05D9\u05D6\u05D4",
    WEIGHT = "\u05D1\u05DE\u05E9\u05E7\u05DC",
    BUNCH = "\u05E6\u05E8\u05D5\u05E8",
    DOZEN = "\u05EA\u05E8\u05D9\u05E1\u05E8",
    BOTTLE = "\u05D1\u05E7\u05D1\u05D5\u05E7",
    CAN = "\u05E7\u05D5\u05E4\u05E1\u05D4",
    BOX = "\u05E7\u05E8\u05D8\u05D5\u05DF",
    BAG = "\u05E9\u05E7\u05D9\u05EA"
}
export {};
//# sourceMappingURL=index.d.ts.map