import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboard } from '../../../hooks/useDashboard';
import { apiClient } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { mockDashboardData } from '../../mocks/mockData';

// Mock dependencies
vi.mock('../../../lib/api');
vi.mock('../../../store/authStore');

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

describe('useDashboard Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
    } as ReturnType<typeof useAuthStore>);
  });

  it('should fetch dashboard data successfully', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: mockDashboardData,
      },
    } as ReturnType<typeof useAuthStore>);

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDashboardData);
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard');
  });

  it('should not fetch when user is not authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
    } as ReturnType<typeof useAuthStore>);

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

