import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGroups, useCreateGroup, useDeleteGroup } from '../../../hooks/useGroups';
import { apiClient } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { mockGroups } from '../../mocks/mockData';

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

describe('useGroups Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      authReady: true,
      accessToken: 'test-token',
    } as ReturnType<typeof useAuthStore>);
  });

  it('should fetch groups successfully', async () => {
    vi.mocked(apiClient.getGroups).mockResolvedValue({
      success: true,
      data: mockGroups,
    });

    const { result } = renderHook(() => useGroups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockGroups);
  });

  it('should not fetch when auth is not ready', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      authReady: false,
      accessToken: null,
    } as ReturnType<typeof useAuthStore>);

    const { result } = renderHook(() => useGroups(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });
});

describe('useCreateGroup Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create group successfully', async () => {
    const mockGroup = mockGroups[0];
    vi.mocked(apiClient.createGroup).mockResolvedValue({
      success: true,
      data: mockGroup,
    });

    const { result } = renderHook(() => useCreateGroup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'New Group',
      description: 'Test description',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.createGroup).toHaveBeenCalledWith({
      name: 'New Group',
      description: 'Test description',
    });
  });
});

describe('useDeleteGroup Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete group successfully', async () => {
    vi.mocked(apiClient.deleteGroup).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => useDeleteGroup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('group1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.deleteGroup).toHaveBeenCalledWith('group1');
  });
});

