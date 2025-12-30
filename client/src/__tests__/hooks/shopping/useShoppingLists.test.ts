import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useGroupShoppingLists,
  useShoppingList,
  useCreateShoppingList,
  useUpdateShoppingList,
  useDeleteShoppingList,
} from '@/hooks/useShoppingLists';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { mockShoppingLists } from '../../mocks/mockData';

// Mock dependencies
vi.mock('@/lib/api');
vi.mock('@/store/authStore');
vi.mock('@/contexts/NotificationContext', () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    handleApiError: vi.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('useShoppingLists Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      authReady: true,
      accessToken: 'test-token',
    } as ReturnType<typeof useAuthStore>);
  });

  describe('useGroupShoppingLists', () => {
    it('should fetch shopping lists for a group', async () => {
      vi.mocked(apiClient.getGroupShoppingLists).mockResolvedValue({
        success: true,
        data: mockShoppingLists,
      });

      const { result } = renderHook(() => useGroupShoppingLists('group1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockShoppingLists);
      expect(apiClient.getGroupShoppingLists).toHaveBeenCalledWith('group1');
    });

    it('should not fetch when auth is not ready', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        authReady: false,
        accessToken: null,
      } as ReturnType<typeof useAuthStore>);

      const { result } = renderHook(() => useGroupShoppingLists('group1'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('useShoppingList', () => {
    it('should fetch single shopping list', async () => {
      vi.mocked(apiClient.getShoppingList).mockResolvedValue({
        success: true,
        data: mockShoppingLists[0],
      });

      const { result } = renderHook(() => useShoppingList('list1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockShoppingLists[0]);
      expect(apiClient.getShoppingList).toHaveBeenCalledWith('list1');
    });
  });

  describe('useCreateShoppingList', () => {
    it('should create shopping list successfully', async () => {
      const mockList = { ...mockShoppingLists[0], _id: 'new-list' };
      vi.mocked(apiClient.createShoppingList).mockResolvedValue({
        success: true,
        data: mockList,
      });

      const { result } = renderHook(() => useCreateShoppingList(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        groupId: 'group1',
        listData: {
          name: 'New List',
          description: 'Test description',
        },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.createShoppingList).toHaveBeenCalled();
    });
  });

  describe('useUpdateShoppingList', () => {
    it('should update shopping list successfully', async () => {
      const updatedList = { ...mockShoppingLists[0], name: 'Updated List' };
      vi.mocked(apiClient.updateShoppingList).mockResolvedValue({
        success: true,
        data: updatedList,
      });

      const { result } = renderHook(() => useUpdateShoppingList(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        listId: 'list1',
        listData: {
          name: 'Updated List',
        },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.updateShoppingList).toHaveBeenCalledWith('list1', {
        name: 'Updated List',
      });
    });
  });

  describe('useDeleteShoppingList', () => {
    it('should delete shopping list successfully', async () => {
      vi.mocked(apiClient.deleteShoppingList).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useDeleteShoppingList(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        listId: 'list1',
        groupId: 'group1',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.deleteShoppingList).toHaveBeenCalledWith('list1');
    });
  });
});

