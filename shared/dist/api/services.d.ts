import { IGroup, IShoppingList, IItem, IMessage, IProduct, ICategory, ISubCategory, IPaginationQuery } from '../types';
export declare const groupService: {
    getGroups(params?: IPaginationQuery): Promise<IGroup[]>;
    getGroup(groupId: string): Promise<IGroup>;
    createGroup(groupData: {
        name: string;
        description?: string;
        avatar?: string;
    }): Promise<IGroup>;
    updateGroup(groupId: string, updates: Partial<IGroup>): Promise<IGroup>;
    deleteGroup(groupId: string): Promise<void>;
    inviteMember(groupId: string, email: string, role?: "admin" | "member"): Promise<void>;
    joinGroup(inviteCode: string): Promise<IGroup>;
    leaveGroup(groupId: string): Promise<void>;
    removeMember(groupId: string, memberId: string): Promise<void>;
};
export declare const shoppingListService: {
    getShoppingLists(groupId: string, params?: IPaginationQuery): Promise<IShoppingList[]>;
    getShoppingList(listId: string): Promise<IShoppingList>;
    createShoppingList(listData: {
        name: string;
        description?: string;
        group: string;
        priority?: "low" | "medium" | "high";
        dueDate?: Date;
        tags?: string[];
    }): Promise<IShoppingList>;
    updateShoppingList(listId: string, updates: Partial<IShoppingList>): Promise<IShoppingList>;
    deleteShoppingList(listId: string): Promise<void>;
    completeShoppingList(listId: string): Promise<IShoppingList>;
    reopenShoppingList(listId: string): Promise<IShoppingList>;
    assignShoppingList(listId: string, userId: string): Promise<IShoppingList>;
};
export declare const itemService: {
    getItems(listId: string, params?: IPaginationQuery): Promise<IItem[]>;
    getItem(itemId: string): Promise<IItem>;
    addItem(itemData: {
        name: string;
        description?: string;
        quantity: number;
        unit: string;
        category: string;
        brand?: string;
        estimatedPrice?: number;
        shoppingList: string;
        priority?: "low" | "medium" | "high";
        notes?: string;
        alternatives?: string[];
        product?: string;
        isManualEntry?: boolean;
    }): Promise<IItem>;
    getManualItems(shoppingListId: string, params?: IPaginationQuery): Promise<IItem[]>;
    getProductBasedItems(shoppingListId: string, params?: IPaginationQuery): Promise<IItem[]>;
    getItemsByProduct(productId: string, params?: IPaginationQuery): Promise<IItem[]>;
    updateItem(itemId: string, updates: Partial<IItem>): Promise<IItem>;
    deleteItem(itemId: string): Promise<void>;
    markItemAsPurchased(itemId: string, actualPrice?: number): Promise<IItem>;
    markItemAsNotPurchased(itemId: string): Promise<IItem>;
    markItemAsNotAvailable(itemId: string): Promise<IItem>;
    updateItemQuantity(itemId: string, quantity: number): Promise<IItem>;
};
export declare const messageService: {
    getMessages(groupId: string, params?: IPaginationQuery): Promise<IMessage[]>;
    sendMessage(messageData: {
        content: string;
        group: string;
        messageType?: "text" | "image" | "system";
        metadata?: Record<string, any>;
    }): Promise<IMessage>;
    editMessage(messageId: string, content: string): Promise<IMessage>;
    deleteMessage(messageId: string): Promise<void>;
    markMessageAsRead(messageId: string): Promise<IMessage>;
};
export declare const productService: {
    searchProducts(query: string, params?: IPaginationQuery): Promise<IProduct[]>;
    getProductByBarcode(barcode: string): Promise<IProduct>;
    getProduct(productId: string): Promise<IProduct>;
    searchProductsForItem(query: string, category?: string): Promise<IProduct[]>;
    getProductsByCategory(categoryId: string, params?: IPaginationQuery): Promise<IProduct[]>;
};
export declare const categoryService: {
    getCategories(): Promise<ICategory[]>;
    getSubCategories(categoryId: string): Promise<ISubCategory[]>;
};
//# sourceMappingURL=services.d.ts.map