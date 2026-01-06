import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useItems, useCreateItem, usePurchaseItem } from '../../../hooks/useItems';
import { apiClient } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { mockItems } from '../../mocks/mockData';

vi.mock('../../../lib/api');
vi.mock('../../../store/authStore');
vi.mock('../../../contexts/NotificationContext', () => ({
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

describe('useItems Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      authReady: true,
      accessToken: 'test-token',
    } as ReturnType<typeof useAuthStore>);
  });

  it('should fetch items successfully', async () => {
    vi.mocked(apiClient.getItems).mockResolvedValue({
      success: true,
      data: mockItems,
    });

    const { result } = renderHook(() => useItems('list1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockItems);
    expect(apiClient.getItems).toHaveBeenCalledWith('list1', undefined);
  });

  it('should fetch items with filters', async () => {
    vi.mocked(apiClient.getItems).mockResolvedValue({
      success: true,
      data: mockItems,
    });

    const { result } = renderHook(() => useItems('list1', {
      status: 'pending',
      category: 'cat1',
    }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.getItems).toHaveBeenCalledWith('list1', {
      status: 'pending',
      category: 'cat1',
    });
  });
});

describe('useCreateItem Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create item successfully', async () => {
    const mockItem = mockItems[0];
    vi.mocked(apiClient.createItem).mockResolvedValue({
      success: true,
      data: mockItem,
    });

    const { result } = renderHook(() => useCreateItem(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'Test Item',
      quantity: 1,
      unit: 'piece',
      category: 'cat1',
      shoppingListId: 'list1',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.createItem).toHaveBeenCalled();
  });
});

describe('usePurchaseItem Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should purchase item successfully', async () => {
    vi.mocked(apiClient.purchaseItem).mockResolvedValue({
      success: true,
      data: { ...mockItems[0], isPurchased: true },
    });

    const { result } = renderHook(() => usePurchaseItem(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      itemId: 'item1',
      shoppingListId: 'list1',
      groupId: 'group1',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.purchaseItem).toHaveBeenCalledWith('item1', expect.any(Object));
  });
});

