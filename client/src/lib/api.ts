import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { IRegisterRequest } from '../types';
import { useAuthStore } from '../store/authStore';

export class ApiClient {
  private baseURL: string;
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: `${this.baseURL}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const accessToken = useAuthStore.getState().accessToken;
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        
        if (!originalRequest) {
          return Promise.reject(error);
        }

        const url = originalRequest.url || '';
        // Do not attempt refresh for refresh/logout endpoints
        if (url.includes('/auth/refresh') || url.includes('/auth/logout')) {
          return Promise.reject(error);
        }

        // Only handle 401 errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const authStore = useAuthStore.getState();
          
          // If auth is not ready or still bootstrapping, wait for bootstrap
          if (!authStore.authReady || authStore.isBootstrapping) {
            // If bootstrap hasn't started, trigger it
            if (!authStore.isBootstrapping) {
              // Don't await - let it run in background, we'll wait for it below
              authStore.bootstrapAuth().catch(() => {
                // Ignore errors, bootstrap will set authReady=true anyway
              });
            }

            // Wait for bootstrap to complete
            const waitForBootstrap = () => {
              return new Promise<void>((resolve) => {
                const maxWait = 10000; // 10 seconds max
                const startTime = Date.now();
                const checkBootstrap = () => {
                  const state = useAuthStore.getState();
                  if (state.authReady && !state.isBootstrapping) {
                    resolve();
                  } else if (Date.now() - startTime > maxWait) {
                    // Timeout - resolve anyway to avoid infinite wait
                    resolve();
                  } else {
                    setTimeout(checkBootstrap, 100);
                  }
                };
                checkBootstrap();
              });
            };

            await waitForBootstrap();

            // After bootstrap, if we have an access token, retry the request
            const newState = useAuthStore.getState();
            if (newState.accessToken) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newState.accessToken}`;
              return this.client(originalRequest);
            }
            
            // No access token after bootstrap, reject
            return Promise.reject(error);
          }

          // Auth is ready, attempt refresh
          try {
            const newAccessToken = await this.refreshAccessToken();
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed after authReady=true, clear auth and redirect
            await this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await this.client.post('/auth/refresh');

        if (response.data.success && response.data.data?.accessToken) {
          const newAccessToken = response.data.data.accessToken;
          useAuthStore.getState().setAccessToken(newAccessToken);
          return newAccessToken;
        }

        throw new Error('Failed to refresh token');
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          const authStore = useAuthStore.getState();
          if (authStore.authReady) {
            authStore.clearAuth();
            if (typeof window !== 'undefined') {
              const path = window.location.pathname;
              const localeMatch = path.match(/^\/([a-z]{2})\//);
              const locale = localeMatch ? localeMatch[1] : 'he';
              if (!path.includes('/welcome') && !path.includes('/auth/login')) {
                window.location.href = `/${locale}/welcome`;
              }
            }
          }
        }
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async handleAuthError() {
    const authStore = useAuthStore.getState();
    
    if (!authStore.authReady) {
      return;
    }

    authStore.clearAuth();

    await this.client.post('/auth/logout');

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const localeMatch = path.match(/^\/([a-z]{2})\//);
        const locale = localeMatch ? localeMatch[1] : 'he';
        
        if (!path.includes('/welcome') && !path.includes('/auth/login')) {
          window.location.href = `/${locale}/welcome`;
        }
      }
    }, 100);
  }

  async get(url: string, config?: AxiosRequestConfig) {
    return this.client.get(url, config);
  }

  async post(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.post(url, data, config);
  }

  async put(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.put(url, data, config);
  }

  async patch(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.patch(url, data, config);
  }

  async delete(url: string, config?: AxiosRequestConfig) {
    return this.client.delete(url, config);
  }

  async login(email: string, password: string) {
    const response = await this.post('/auth/login', { email, password });
    if (response.data.success && response.data.data) {
      const { accessToken, user } = response.data.data;
      useAuthStore.getState().setAccessToken(accessToken);
      if (user) {
        useAuthStore.getState().setUser(user);
      }
      return response.data.data;
    }
    throw new Error(response.data.message || 'Login failed');
  }

  async register(userData: IRegisterRequest) {
    const response = await this.post('/auth/register', userData);
    if (response.data.success && response.data.data) {
      const { accessToken, user } = response.data.data;
      useAuthStore.getState().setAccessToken(accessToken);
      if (user) {
        useAuthStore.getState().setUser(user);
      }
      return response.data.data;
    }
    throw new Error(response.data.message || 'Registration failed');
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      useAuthStore.getState().setAccessToken(null);
      useAuthStore.getState().clearUser();
    }
  }

  async initAuthFromRefresh(): Promise<boolean> {
    try {
      const response = await this.client.post('/auth/refresh');

      if (response.data.success && response.data.data?.accessToken) {
        const accessToken = response.data.data.accessToken;
        useAuthStore.getState().setAccessToken(accessToken);
        return true;
      }
      return false;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  async getMe() {
    const response = await this.get('/auth/me');
    return response.data.data;
  }

  async verifyEmail(token: string, email?: string) {
    const response = await this.post('/auth/verify-email', { token, email });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Email verification failed');
  }

  async resendVerification(email: string) {
    const response = await this.post('/auth/resend-verification', { email });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Failed to resend verification email');
  }

  async resendVerificationForLogin(email: string) {
    const response = await this.post('/auth/resend-verification-login', { email });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Failed to resend verification email');
  }

  async handleGoogleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('accessToken');
    const user = urlParams.get('user');
    
    if (accessToken) {
      useAuthStore.getState().setAccessToken(accessToken);
      if (user) {
        try {
          const userData = JSON.parse(decodeURIComponent(user));
          useAuthStore.getState().setUser(userData);
          return userData;
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    }
    
    try {
      return await this.getMe();
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async healthCheck() {
    const response = await this.get('/health');
    return response.data;
  }

  async getGroups() {
    const response = await this.get('/groups');
    return response.data;
  }

  async createGroup(groupData: { name: string; description?: string }) {
    const response = await this.post('/groups', groupData);
    return response.data;
  }

  async updateGroup(groupId: string, groupData: { name: string; description?: string }) {
    const response = await this.put(`/groups/${groupId}`, groupData);
    return response.data;
  }

  async deleteGroup(groupId: string) {
    const response = await this.delete(`/groups/${groupId}`);
    return response.data;
  }

  async joinGroup(inviteCode: string) {
    const response = await this.post(`/groups/join/${inviteCode}`);
    return response.data;
  }

  async getGroup(groupId: string) {
    const response = await this.get(`/groups/${groupId}`);
    return response.data;
  }

  async inviteToGroup(groupId: string, inviteData: { email: string; role: 'member' | 'admin' }) {
    const response = await this.post(`/groups/${groupId}/invite`, inviteData);
    return response.data;
  }

  async removeGroupMember(groupId: string, memberId: string) {
    const response = await this.delete(`/groups/${groupId}/members/${memberId}`);
    return response.data;
  }

  async leaveGroup(groupId: string) {
    const response = await this.post(`/groups/${groupId}/leave`);
    return response.data;
  }

  async updateMemberRole(groupId: string, memberId: string, newRole: 'admin' | 'member') {
    const response = await this.put(`/groups/${groupId}/members/${memberId}/role`, { role: newRole });
    return response.data;
  }

  async transferOwnership(groupId: string, newOwnerId: string) {
    const response = await this.post(`/groups/${groupId}/transfer-ownership`, { newOwnerId });
    return response.data;
  }

  async getMyInvitations() {
    const response = await this.get('/auth/invitations');
    return response.data;
  }

  async acceptInvitation(invitationId: string) {
    const response = await this.post(`/auth/invitations/accept`, { invitationId });
    return response.data;
  }

  async declineInvitation(invitationId: string) {
    const response = await this.post(`/auth/invitations/decline`, { invitationId });
    return response.data;
  }

  async getGroupShoppingLists(groupId: string) {
    const response = await this.get(`/shopping-lists/groups/${groupId}`);
    return response.data;
  }

  async getShoppingList(listId: string) {
    const response = await this.get(`/shopping-lists/${listId}`);
    return response.data;
  }

  async getShoppingSession(listId: string) {
    const response = await this.get(`/shopping/list-data/${listId}`);
    return response.data;
  }

  async createShoppingList(groupId: string, listData: {
    name: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    tags?: string[];
    groupId: string;
  }) {
    const response = await this.post(`/shopping-lists/groups/${groupId}`, listData);
    return response.data;
  }

  async updateShoppingList(listId: string, listData: {
    name?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    tags?: string[];
    assignedTo?: string;
  }) {
    const response = await this.put(`/shopping-lists/${listId}`, listData);
    return response.data;
  }

  async deleteShoppingList(listId: string) {
    const response = await this.delete(`/shopping-lists/${listId}`);
    return response.data;
  }

  async addItemToList(listId: string, itemData: {
    name: string;
    quantity?: number;
    unit?: string;
    product?: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    notes?: string;
    estimatedPrice?: number;
    actualPrice?: number;
  }) {
    const response = await this.post(`/shopping-lists/${listId}/items`, itemData);
    return response.data;
  }

  async removeItemFromList(listId: string, itemId: string) {
    const response = await this.delete(`/shopping-lists/${listId}/items/${itemId}`);
    return response.data;
  }

  async completeShoppingList(listId: string) {
    const response = await this.post(`/shopping-lists/${listId}/complete`);
    return response.data;
  }

  async getItems(shoppingListId: string, options?: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    sort?: string;
    populateProduct?: boolean;
  }) {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.category) params.append('category', options.category);
    if (options?.priority) params.append('priority', options.priority);
    if (options?.search) params.append('search', options.search);
    if (options?.sort) params.append('sort', options.sort);
    if (options?.populateProduct) params.append('populateProduct', 'true');
    
    const response = await this.get(`/items?shoppingListId=${shoppingListId}&${params.toString()}`);
    return response.data;
  }

  async createItem(itemData: {
    name: string;
    description?: string;
    quantity: number;
    unit: string;
    category: string;
    brand?: string;
    estimatedPrice?: number;
    priority?: 'low' | 'medium' | 'high';
    notes?: string;
    alternatives?: string[];
    shoppingListId: string;
    product?: string;
    isManualEntry?: boolean;
  }) {
    const response = await this.post('/items', itemData);
    return response.data;
  }

  async createMultipleItems(items: Array<{
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
  }>) {
    const response = await this.post('/items/bulk', { items });
    return response.data;
  }

  async updateItem(itemId: string, itemData: {
    name?: string;
    description?: string;
    quantity?: number;
    unit?: string;
    category?: string;
    brand?: string;
    estimatedPrice?: number;
    priority?: 'low' | 'medium' | 'high';
    notes?: string;
    alternatives?: string[];
  }) {
    const response = await this.put(`/items/${itemId}`, itemData);
    return response.data;
  }

  async deleteItem(itemId: string) {
    const response = await this.delete(`/items/${itemId}`);
    return response.data;
  }

  async purchaseItem(itemId: string, options?: { quantityToPurchase?: number; purchasedQuantity?: number; actualPrice?: number }) {
    const response = await this.post(`/items/${itemId}/purchase`, options || {});
    return response.data;
  }

  async unpurchaseItem(itemId: string) {
    const response = await this.post(`/items/${itemId}/unpurchase`);
    return response.data;
  }

  async markItemNotAvailable(itemId: string) {
    const response = await this.post(`/items/${itemId}/not-available`);
    return response.data;
  }

  async updateItemQuantity(itemId: string, quantity: number) {
    const response = await this.put(`/items/${itemId}/quantity`, { quantity });
    return response.data;
  }

  async getAvailableCategories() {
    const response = await this.get('/categories');
    return response.data;
  }

  async getAvailableUnits() {
    const response = await this.get('/items/units');
    return response.data;
  }

  async getItemById(itemId: string) {
    const response = await this.get(`/items/${itemId}`);
    return response.data;
  }

  async startShopping(listId: string, location?: {
    latitude: number;
    longitude: number;
    address?: string;
    storeName?: string;
  }) {
    const response = await this.post('/shopping/start', { listId, location });
    return response.data;
  }

  async stopShopping(sessionId: string) {
    const response = await this.post('/shopping/stop', { sessionId });
    return response.data;
  }

  async pauseShopping(sessionId: string) {
    const response = await this.post('/shopping/pause', { sessionId });
    return response.data;
  }

  async resumeShopping(sessionId: string) {
    const response = await this.post('/shopping/resume', { sessionId });
    return response.data;
  }

  async updateShoppingLocation(sessionId: string, location: {
    latitude: number;
    longitude: number;
    address?: string;
    storeName?: string;
  }) {
    const response = await this.put('/shopping/location', { sessionId, location });
    return response.data;
  }

  async getAllProducts(page: number = 1, limit: number = 50) {
    const response = await this.get(`/products?page=${page}&limit=${limit}`);
    return response.data;
  }

  async searchProducts(query: string, page: number = 1, limit: number = 20) {
    const response = await this.get(`/products/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  }

  async getProductById(productId: string) {
    const response = await this.get(`/products/product/${productId}`);
    return response.data;
  }

  async getProductsByCategory(categoryId: string, page: number = 1, limit: number = 20) {
    const response = await this.get(`/products/category/${categoryId}?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getUserProfile() {
    const response = await this.get('/auth/profile');
    return response.data;
  }

  async updateProfile(profileData: { firstName: string; lastName: string; username?: string }) {
    const response = await this.put('/auth/profile', profileData);
    return response.data;
  }

  async updateEmail(emailData: { email: string }) {
    const response = await this.put('/auth/email', emailData);
    return response.data;
  }

  async getUserPreferences() {
    const response = await this.get('/settings/preferences');
    return response.data;
  }

  async updatePreferences(preferencesData: { language: string; theme: string }) {
    const response = await this.put('/settings/preferences', preferencesData);
    return response.data;
  }

  async getNotificationSettings() {
    const response = await this.get('/settings/notifications');
    return response.data;
  }

  async updateNotificationSettings(settings: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    newMessageNotifications: boolean;
    shoppingListUpdates: boolean;
    groupInvitations: boolean;
  }) {
    const response = await this.put('/settings/notifications', settings);
    return response.data;
  }



  async deleteAccount() {
    const response = await this.delete('/auth/account');
    return response.data;
  }

  updateBaseURL(newBaseURL: string) {
    this.baseURL = newBaseURL;
    this.client.defaults.baseURL = `${this.baseURL}/api`;
  }
}

export const apiClient = new ApiClient();
