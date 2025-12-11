import { apiClient } from './client';
import {
  IGroup,
  IShoppingList,
  IItem,
  IMessage,
  IProduct,
  ICategory,
  ISubCategory,
  IPaginationQuery,
  IApiResponse
} from '../types';

// Helper function to safely extract data from API response
const extractData = <T>(response: any, errorMessage: string = 'Data not found'): T => {
  if (!response.data.data) {
    throw new Error(errorMessage);
  }
  return response.data.data as T;
};

// Group Services
export const groupService = {
  // Get all groups for current user
  async getGroups(params?: IPaginationQuery): Promise<IGroup[]> {
    const response = await apiClient.get<IGroup[]>('/groups', { params });
    return response.data.data || [];
  },

  // Get single group by ID
  async getGroup(groupId: string): Promise<IGroup> {
    const response = await apiClient.get<IGroup>(`/groups/${groupId}`);
    if (!response.data.data) {
      throw new Error('Group not found');
    }
    return response.data.data;
  },

  // Create new group
  async createGroup(groupData: {
    name: string;
    description?: string;
    avatar?: string;
  }): Promise<IGroup> {
    const response = await apiClient.post<IGroup>('/groups', groupData);
    return extractData<IGroup>(response, 'Failed to create group');
  },

  // Update group
  async updateGroup(groupId: string, updates: Partial<IGroup>): Promise<IGroup> {
    const response = await apiClient.put<IGroup>(`/groups/${groupId}`, updates);
    return extractData<IGroup>(response, 'Failed to update group');
  },

  // Delete group
  async deleteGroup(groupId: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}`);
  },

  // Invite member to group
  async inviteMember(groupId: string, email: string, role: 'admin' | 'member' = 'member'): Promise<void> {
    await apiClient.post(`/groups/${groupId}/invite`, { email, role });
  },

  // Join group with invite code
  async joinGroup(inviteCode: string): Promise<IGroup> {
    const response = await apiClient.post<IGroup>('/groups/join', { inviteCode });
    return extractData<IGroup>(response, 'Failed to join group');
  },

  // Leave group
  async leaveGroup(groupId: string): Promise<void> {
    await apiClient.post(`/groups/${groupId}/leave`);
  },

  // Remove member from group
  async removeMember(groupId: string, memberId: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}/members/${memberId}`);
  }
};

// Shopping List Services
export const shoppingListService = {
  // Get all shopping lists for a group
  async getShoppingLists(groupId: string, params?: IPaginationQuery): Promise<IShoppingList[]> {
    const response = await apiClient.get<IShoppingList[]>(`/shopping-lists`, { 
      params: { ...params, group: groupId } 
    });
    return response.data.data || [];
  },

  // Get single shopping list
  async getShoppingList(listId: string): Promise<IShoppingList> {
    const response = await apiClient.get<IShoppingList>(`/shopping-lists/${listId}`);
    return extractData<IShoppingList>(response, 'Shopping list not found');
  },

  // Create new shopping list
  async createShoppingList(listData: {
    name: string;
    description?: string;
    group: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: Date;
    tags?: string[];
  }): Promise<IShoppingList> {
    const response = await apiClient.post<IShoppingList>('/shopping-lists', listData);
    return extractData<IShoppingList>(response, 'Failed to create shopping list');
  },

  // Update shopping list
  async updateShoppingList(listId: string, updates: Partial<IShoppingList>): Promise<IShoppingList> {
    const response = await apiClient.put<IShoppingList>(`/shopping-lists/${listId}`, updates);
    return extractData<IShoppingList>(response, 'Failed to update shopping list');
  },

  // Delete shopping list
  async deleteShoppingList(listId: string): Promise<void> {
    await apiClient.delete(`/shopping-lists/${listId}`);
  },

  // Complete shopping list
  async completeShoppingList(listId: string): Promise<IShoppingList> {
    const response = await apiClient.patch<IShoppingList>(`/shopping-lists/${listId}/complete`);
    return extractData<IShoppingList>(response, 'Failed to complete shopping list');
  },

  // Reopen shopping list
  async reopenShoppingList(listId: string): Promise<IShoppingList> {
    const response = await apiClient.patch<IShoppingList>(`/shopping-lists/${listId}/reopen`);
    return extractData<IShoppingList>(response, 'Failed to reopen shopping list');
  },

  // Assign shopping list to user
  async assignShoppingList(listId: string, userId: string): Promise<IShoppingList> {
    const response = await apiClient.patch<IShoppingList>(`/shopping-lists/${listId}/assign`, { userId });
    return extractData<IShoppingList>(response, 'Failed to assign shopping list');
  }
};

// Item Services
export const itemService = {
  // Get all items for a shopping list
  async getItems(listId: string, params?: IPaginationQuery): Promise<IItem[]> {
    const response = await apiClient.get<IItem[]>(`/items`, { 
      params: { ...params, shoppingList: listId } 
    });
    return response.data.data || [];
  },

  // Get single item
  async getItem(itemId: string): Promise<IItem> {
    const response = await apiClient.get<IItem>(`/items/${itemId}`);
    return extractData<IItem>(response, 'Item not found');
  },

  // Add item to shopping list
  async addItem(itemData: {
    name: string;
    description?: string;
    quantity: number;
    unit: string;
    category: string; // Category ID reference
    brand?: string;
    estimatedPrice?: number;
    shoppingList: string;
    priority?: 'low' | 'medium' | 'high';
    notes?: string;
    alternatives?: string[];
    // Product reference (optional)
    product?: string; // Product ID if linking to existing product
    isManualEntry?: boolean; // True for manual entry, false for product-based
  }): Promise<IItem> {
    const response = await apiClient.post<IItem>('/items', itemData);
    return extractData<IItem>(response, 'Failed to add item');
  },

  // Get manual items
  async getManualItems(shoppingListId: string, params?: IPaginationQuery): Promise<IItem[]> {
    const response = await apiClient.get<IItem[]>(`/items/manual`, { 
      params: { ...params, shoppingListId } 
    });
    return response.data.data || [];
  },

  // Get product-based items
  async getProductBasedItems(shoppingListId: string, params?: IPaginationQuery): Promise<IItem[]> {
    const response = await apiClient.get<IItem[]>(`/items/product-based`, { 
      params: { ...params, shoppingListId } 
    });
    return response.data.data || [];
  },

  // Get items by product
  async getItemsByProduct(productId: string, params?: IPaginationQuery): Promise<IItem[]> {
    const response = await apiClient.get<IItem[]>(`/items/by-product`, { 
      params: { ...params, productId } 
    });
    return response.data.data || [];
  },

  // Update item
  async updateItem(itemId: string, updates: Partial<IItem>): Promise<IItem> {
    const response = await apiClient.put<IItem>(`/items/${itemId}`, updates);
    return extractData<IItem>(response, 'Failed to update item');
  },

  // Delete item
  async deleteItem(itemId: string): Promise<void> {
    await apiClient.delete(`/items/${itemId}`);
  },

  // Mark item as purchased
  async markItemAsPurchased(itemId: string, actualPrice?: number): Promise<IItem> {
    const response = await apiClient.patch<IItem>(`/items/${itemId}/purchase`, { actualPrice });
    return extractData<IItem>(response, 'Failed to mark item as purchased');
  },

  // Mark item as not purchased
  async markItemAsNotPurchased(itemId: string): Promise<IItem> {
    const response = await apiClient.patch<IItem>(`/items/${itemId}/unpurchase`);
    return extractData<IItem>(response, 'Failed to mark item as not purchased');
  },

  // Mark item as not available
  async markItemAsNotAvailable(itemId: string): Promise<IItem> {
    const response = await apiClient.patch<IItem>(`/items/${itemId}/not-available`);
    return extractData<IItem>(response, 'Failed to mark item as not available');
  },

  // Update item quantity
  async updateItemQuantity(itemId: string, quantity: number): Promise<IItem> {
    const response = await apiClient.patch<IItem>(`/items/${itemId}/quantity`, { quantity });
    return extractData<IItem>(response, 'Failed to update item quantity');
  }
};

// Message Services
export const messageService = {
  // Get messages for a group
  async getMessages(groupId: string, params?: IPaginationQuery): Promise<IMessage[]> {
    const response = await apiClient.get<IMessage[]>(`/messages`, { 
      params: { ...params, group: groupId } 
    });
    return response.data.data || [];
  },

  // Send message
  async sendMessage(messageData: {
    content: string;
    group: string;
    messageType?: 'text' | 'image' | 'system';
    metadata?: Record<string, any>;
  }): Promise<IMessage> {
    const response = await apiClient.post<IMessage>('/messages', messageData);
    return extractData<IMessage>(response, 'Failed to send message');
  },

  // Edit message
  async editMessage(messageId: string, content: string): Promise<IMessage> {
    const response = await apiClient.put<IMessage>(`/messages/${messageId}`, { content });
    return extractData<IMessage>(response, 'Failed to edit message');
  },

  // Delete message
  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/messages/${messageId}`);
  },

  // Mark message as read
  async markMessageAsRead(messageId: string): Promise<IMessage> {
    const response = await apiClient.patch<IMessage>(`/messages/${messageId}/read`);
    return extractData<IMessage>(response, 'Failed to mark message as read');
  }
};

// Product Services
export const productService = {
  // Search products
  async searchProducts(query: string, params?: IPaginationQuery): Promise<IProduct[]> {
    const response = await apiClient.get<IProduct[]>('/products/search', { 
      params: { ...params, q: query } 
    });
    return response.data.data || [];
  },

  // Get product by barcode
  async getProductByBarcode(barcode: string): Promise<IProduct> {
    const response = await apiClient.get<IProduct>(`/products/barcode/${barcode}`);
    return extractData<IProduct>(response, 'Product not found');
  },

  // Get product by ID
  async getProduct(productId: string): Promise<IProduct> {
    const response = await apiClient.get<IProduct>(`/products/${productId}`);
    return extractData<IProduct>(response, 'Product not found');
  },

  // Search products for item creation
  async searchProductsForItem(query: string, category?: string): Promise<IProduct[]> {
    const response = await apiClient.get<IProduct[]>('/products/search', { 
      params: { 
        q: query, 
        category,
        limit: 10 
      } 
    });
    return response.data.data || [];
  },

  // Get products by category
  async getProductsByCategory(categoryId: string, params?: IPaginationQuery): Promise<IProduct[]> {
    const response = await apiClient.get<IProduct[]>(`/products/category/${categoryId}`, { params });
    return response.data.data || [];
  }
};

// Category Services
export const categoryService = {
  // Get all categories
  async getCategories(): Promise<ICategory[]> {
    const response = await apiClient.get<ICategory[]>('/categories');
    return response.data.data || [];
  },

  // Get subcategories for a category
  async getSubCategories(categoryId: string): Promise<ISubCategory[]> {
    const response = await apiClient.get<ISubCategory[]>(`/sub-categories`, {
      params: { categoryId }
    });
    return response.data.data || [];
  }
}; 