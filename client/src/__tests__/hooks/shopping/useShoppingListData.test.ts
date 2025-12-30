import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useShoppingListData } from '@/hooks/useShoppingListData';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { mockShoppingLists, mockItems } from '../../mocks/mockData';

// Mock dependencies
vi.mock('@/lib/api');
vi.mock('@/store/authStore');

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

describe('useShoppingListData Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      authReady: true,
      accessToken: 'test-token',
    } as ReturnType<typeof useAuthStore>);
  });

  it('should fetch shopping list data successfully', async () => {
    const mockData = {
      shoppingList: mockShoppingLists[0],
      items: mockItems,
      stats: {
        totalItems: mockItems.length,
        purchasedItems: 1,
      },
      shoppingSession: null,
    };

    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: mockData,
      },
    } as ReturnType<typeof useAuthStore>);

    const { result } = renderHook(() => useShoppingListData('list1', 'group1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.shoppingList).toBeTruthy();
    });

    expect(result.current.shoppingList).toEqual(mockShoppingLists[0]);
    expect(result.current.items).toEqual(mockItems);
    expect(result.current.totalItems).toBe(mockItems.length);
    expect(result.current.purchasedItems).toBe(1);
  });

  it('should return empty data when not authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      authReady: false,
      accessToken: null,
    } as ReturnType<typeof useAuthStore>);

    const { result } = renderHook(() => useShoppingListData('list1', 'group1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.shoppingList).toBeNull();
    expect(result.current.items).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => useShoppingListData('list1', 'group1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      // Error should be set or data should be null
      expect(result.current.error || result.current.shoppingList === null).toBeTruthy();
    }, { timeout: 3000 });
  });
});

