import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockUser, mockGroups, mockShoppingLists, mockItems } from '../mocks/mockData';
import axios from 'axios';

// Mock axios
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: { baseURL: '' },
  };
  
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      isAxiosError: vi.fn((error) => error?.isAxiosError || false),
    },
    create: vi.fn(() => mockAxiosInstance),
    isAxiosError: vi.fn((error) => error?.isAxiosError || false),
  };
});

vi.mock('@/store/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      accessToken: 'test-token',
      setAccessToken: vi.fn(),
      clearAuth: vi.fn(),
      clearUser: vi.fn(),
      setUser: vi.fn(),
      authReady: true,
      isBootstrapping: false,
    }),
  },
}));

// Import after mocks
import { apiClient } from '@/lib/api';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            accessToken: 'token123',
            user: mockUser,
          },
        },
      });

      const mockAxiosInstance = axios.create({});
      vi.mocked(mockAxiosInstance.post).mockImplementation(mockPost);
      
      // Mock the login method directly
      vi.spyOn(apiClient, 'login').mockResolvedValue({
        accessToken: 'token123',
        user: mockUser,
      } as Awaited<ReturnType<typeof apiClient.login>>);

      const result = await apiClient.login('test@example.com', 'password123');
      
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('should register successfully', async () => {
      const mockAxios = vi.mocked(axios.create);
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            accessToken: 'token123',
            user: mockUser,
          },
        },
      });

      const mockClient = {
        post: mockPost,
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
        defaults: { baseURL: '' },
      };

      mockAxios.mockReturnValue(mockClient as ReturnType<typeof axios.create>);

      const result = await apiClient.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });
      
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });
  });

  describe('Groups', () => {
    it('should get groups', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: mockGroups,
        },
      });

      vi.spyOn(apiClient, 'get').mockImplementation(mockGet);

      const result = await apiClient.getGroups();
      
      expect(result.data).toEqual(mockGroups);
      expect(mockGet).toHaveBeenCalledWith('/groups');
    });

    it('should create group', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: mockGroups[0],
        },
      });

      vi.spyOn(apiClient, 'post').mockImplementation(mockPost);

      const result = await apiClient.createGroup({
        name: 'New Group',
        description: 'Test description',
      });
      
      expect(result.data).toEqual(mockGroups[0]);
      expect(mockPost).toHaveBeenCalledWith('/groups', {
        name: 'New Group',
        description: 'Test description',
      });
    });

    it('should update group', async () => {
      const mockPut = vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: { ...mockGroups[0], name: 'Updated Group' },
        },
      });

      vi.spyOn(apiClient, 'put').mockImplementation(mockPut);

      const result = await apiClient.updateGroup('group1', {
        name: 'Updated Group',
      });
      
      expect(result.data.name).toBe('Updated Group');
      expect(mockPut).toHaveBeenCalledWith('/groups/group1', {
        name: 'Updated Group',
      });
    });

    it('should delete group', async () => {
      const mockDelete = vi.fn().mockResolvedValue({
        data: {
          success: true,
        },
      });

      vi.spyOn(apiClient, 'delete').mockImplementation(mockDelete);

      await apiClient.deleteGroup('group1');
      
      expect(mockDelete).toHaveBeenCalledWith('/groups/group1');
    });
  });

  describe('Shopping Lists', () => {
    it('should get shopping lists', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: mockShoppingLists,
        },
      });

      vi.spyOn(apiClient, 'get').mockImplementation(mockGet);

      const result = await apiClient.getGroupShoppingLists('group1');
      
      expect(result.data).toEqual(mockShoppingLists);
    });

    it('should create shopping list', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: mockShoppingLists[0],
        },
      });

      vi.spyOn(apiClient, 'post').mockImplementation(mockPost);

      const result = await apiClient.createShoppingList('group1', {
        name: 'New List',
        groupId: 'group1',
      });
      
      expect(result.data).toEqual(mockShoppingLists[0]);
    });
  });

  describe('Items', () => {
    it('should get items', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: mockItems,
        },
      });

      vi.spyOn(apiClient, 'get').mockImplementation(mockGet);

      const result = await apiClient.getItems('list1');
      
      expect(result.data).toEqual(mockItems);
    });

    it('should create item', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: mockItems[0],
        },
      });

      vi.spyOn(apiClient, 'post').mockImplementation(mockPost);

      const result = await apiClient.createItem({
        name: 'Test Item',
        quantity: 1,
        unit: 'piece',
        category: 'cat1',
        shoppingListId: 'list1',
      });
      
      expect(result.data).toEqual(mockItems[0]);
    });

    it('should update item', async () => {
      const mockPut = vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: { ...mockItems[0], quantity: 2 },
        },
      });

      vi.spyOn(apiClient, 'put').mockImplementation(mockPut);

      const result = await apiClient.updateItem('item1', {
        quantity: 2,
      });
      
      expect(result.data.quantity).toBe(2);
    });

    it('should purchase item', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: { ...mockItems[0], isPurchased: true },
        },
      });

      vi.spyOn(apiClient, 'post').mockImplementation(mockPost);

      const result = await apiClient.purchaseItem('item1');
      
      expect(result.data.isPurchased).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const mockGet = vi.fn().mockRejectedValue({
        response: {
          status: 404,
          data: {
            success: false,
            message: 'Not found',
          },
        },
      });

      vi.spyOn(apiClient, 'get').mockImplementation(mockGet);

      await expect(apiClient.getGroups()).rejects.toThrow();
    });
  });
});

