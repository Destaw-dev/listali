import { apiClient } from './client';
// Helper function to safely extract data from API response
const extractData = (response, errorMessage = 'Data not found') => {
    if (!response.data.data) {
        throw new Error(errorMessage);
    }
    return response.data.data;
};
// Group Services
export const groupService = {
    // Get all groups for current user
    async getGroups(params) {
        const response = await apiClient.get('/groups', { params });
        return response.data.data || [];
    },
    // Get single group by ID
    async getGroup(groupId) {
        const response = await apiClient.get(`/groups/${groupId}`);
        if (!response.data.data) {
            throw new Error('Group not found');
        }
        return response.data.data;
    },
    // Create new group
    async createGroup(groupData) {
        const response = await apiClient.post('/groups', groupData);
        return extractData(response, 'Failed to create group');
    },
    // Update group
    async updateGroup(groupId, updates) {
        const response = await apiClient.put(`/groups/${groupId}`, updates);
        return extractData(response, 'Failed to update group');
    },
    // Delete group
    async deleteGroup(groupId) {
        await apiClient.delete(`/groups/${groupId}`);
    },
    // Invite member to group
    async inviteMember(groupId, email, role = 'member') {
        await apiClient.post(`/groups/${groupId}/invite`, { email, role });
    },
    // Join group with invite code
    async joinGroup(inviteCode) {
        const response = await apiClient.post('/groups/join', { inviteCode });
        return extractData(response, 'Failed to join group');
    },
    // Leave group
    async leaveGroup(groupId) {
        await apiClient.post(`/groups/${groupId}/leave`);
    },
    // Remove member from group
    async removeMember(groupId, memberId) {
        await apiClient.delete(`/groups/${groupId}/members/${memberId}`);
    }
};
// Shopping List Services
export const shoppingListService = {
    // Get all shopping lists for a group
    async getShoppingLists(groupId, params) {
        const response = await apiClient.get(`/shopping-lists`, {
            params: { ...params, group: groupId }
        });
        return response.data.data || [];
    },
    // Get single shopping list
    async getShoppingList(listId) {
        const response = await apiClient.get(`/shopping-lists/${listId}`);
        return extractData(response, 'Shopping list not found');
    },
    // Create new shopping list
    async createShoppingList(listData) {
        const response = await apiClient.post('/shopping-lists', listData);
        return extractData(response, 'Failed to create shopping list');
    },
    // Update shopping list
    async updateShoppingList(listId, updates) {
        const response = await apiClient.put(`/shopping-lists/${listId}`, updates);
        return extractData(response, 'Failed to update shopping list');
    },
    // Delete shopping list
    async deleteShoppingList(listId) {
        await apiClient.delete(`/shopping-lists/${listId}`);
    },
    // Complete shopping list
    async completeShoppingList(listId) {
        const response = await apiClient.patch(`/shopping-lists/${listId}/complete`);
        return extractData(response, 'Failed to complete shopping list');
    },
    // Reopen shopping list
    async reopenShoppingList(listId) {
        const response = await apiClient.patch(`/shopping-lists/${listId}/reopen`);
        return extractData(response, 'Failed to reopen shopping list');
    },
    // Assign shopping list to user
    async assignShoppingList(listId, userId) {
        const response = await apiClient.patch(`/shopping-lists/${listId}/assign`, { userId });
        return extractData(response, 'Failed to assign shopping list');
    }
};
// Item Services
export const itemService = {
    // Get all items for a shopping list
    async getItems(listId, params) {
        const response = await apiClient.get(`/items`, {
            params: { ...params, shoppingList: listId }
        });
        return response.data.data || [];
    },
    // Get single item
    async getItem(itemId) {
        const response = await apiClient.get(`/items/${itemId}`);
        return extractData(response, 'Item not found');
    },
    // Add item to shopping list
    async addItem(itemData) {
        const response = await apiClient.post('/items', itemData);
        return extractData(response, 'Failed to add item');
    },
    // Get manual items
    async getManualItems(shoppingListId, params) {
        const response = await apiClient.get(`/items/manual`, {
            params: { ...params, shoppingListId }
        });
        return response.data.data || [];
    },
    // Get product-based items
    async getProductBasedItems(shoppingListId, params) {
        const response = await apiClient.get(`/items/product-based`, {
            params: { ...params, shoppingListId }
        });
        return response.data.data || [];
    },
    // Get items by product
    async getItemsByProduct(productId, params) {
        const response = await apiClient.get(`/items/by-product`, {
            params: { ...params, productId }
        });
        return response.data.data || [];
    },
    // Update item
    async updateItem(itemId, updates) {
        const response = await apiClient.put(`/items/${itemId}`, updates);
        return extractData(response, 'Failed to update item');
    },
    // Delete item
    async deleteItem(itemId) {
        await apiClient.delete(`/items/${itemId}`);
    },
    // Mark item as purchased
    async markItemAsPurchased(itemId, actualPrice) {
        const response = await apiClient.patch(`/items/${itemId}/purchase`, { actualPrice });
        return extractData(response, 'Failed to mark item as purchased');
    },
    // Mark item as not purchased
    async markItemAsNotPurchased(itemId) {
        const response = await apiClient.patch(`/items/${itemId}/unpurchase`);
        return extractData(response, 'Failed to mark item as not purchased');
    },
    // Mark item as not available
    async markItemAsNotAvailable(itemId) {
        const response = await apiClient.patch(`/items/${itemId}/not-available`);
        return extractData(response, 'Failed to mark item as not available');
    },
    // Update item quantity
    async updateItemQuantity(itemId, quantity) {
        const response = await apiClient.patch(`/items/${itemId}/quantity`, { quantity });
        return extractData(response, 'Failed to update item quantity');
    }
};
// Message Services
export const messageService = {
    // Get messages for a group
    async getMessages(groupId, params) {
        const response = await apiClient.get(`/messages`, {
            params: { ...params, group: groupId }
        });
        return response.data.data || [];
    },
    // Send message
    async sendMessage(messageData) {
        const response = await apiClient.post('/messages', messageData);
        return extractData(response, 'Failed to send message');
    },
    // Edit message
    async editMessage(messageId, content) {
        const response = await apiClient.put(`/messages/${messageId}`, { content });
        return extractData(response, 'Failed to edit message');
    },
    // Delete message
    async deleteMessage(messageId) {
        await apiClient.delete(`/messages/${messageId}`);
    },
    // Mark message as read
    async markMessageAsRead(messageId) {
        const response = await apiClient.patch(`/messages/${messageId}/read`);
        return extractData(response, 'Failed to mark message as read');
    }
};
// Product Services
export const productService = {
    // Search products
    async searchProducts(query, params) {
        const response = await apiClient.get('/products/search', {
            params: { ...params, q: query }
        });
        return response.data.data || [];
    },
    // Get product by barcode
    async getProductByBarcode(barcode) {
        const response = await apiClient.get(`/products/barcode/${barcode}`);
        return extractData(response, 'Product not found');
    },
    // Get product by ID
    async getProduct(productId) {
        const response = await apiClient.get(`/products/${productId}`);
        return extractData(response, 'Product not found');
    },
    // Search products for item creation
    async searchProductsForItem(query, category) {
        const response = await apiClient.get('/products/search', {
            params: {
                q: query,
                category,
                limit: 10
            }
        });
        return response.data.data || [];
    },
    // Get products by category
    async getProductsByCategory(categoryId, params) {
        const response = await apiClient.get(`/products/category/${categoryId}`, { params });
        return response.data.data || [];
    }
};
// Category Services
export const categoryService = {
    // Get all categories
    async getCategories() {
        const response = await apiClient.get('/categories');
        return response.data.data || [];
    },
    // Get subcategories for a category
    async getSubCategories(categoryId) {
        const response = await apiClient.get(`/sub-categories`, {
            params: { categoryId }
        });
        return response.data.data || [];
    }
};
//# sourceMappingURL=services.js.map