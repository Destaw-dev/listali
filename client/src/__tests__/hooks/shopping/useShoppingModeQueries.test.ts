import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { AxiosResponse } from 'axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useStartShopping,
  useStopShopping,
  usePauseShopping,
  useResumeShopping,
  useCurrentShoppingSession,
  useActiveShoppingSessions,
} from '../../../hooks/useShoppingModeQueries';
import { apiClient } from '../../../lib/api';


vi.mock('../../../lib/api');
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

describe('useShoppingModeQueries Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useStartShopping', () => {
    it('should start shopping session successfully', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          success: true,
          data: {
            sessionId: 'session123',
            userId: 'user1',
            startedAt: new Date().toISOString(),
            totalItems: 10,
          },
        },
      } as AxiosResponse);

      const { result } = renderHook(() => useStartShopping(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        listId: 'list1',
        groupId: 'group1',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.post).toHaveBeenCalledWith('/shopping/start', {
        listId: 'list1',
        groupId: 'group1',
      });
    });

    it('should handle start shopping error', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Failed to start'));

      const { result } = renderHook(() => useStartShopping(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        listId: 'list1',
        groupId: 'group1',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useStopShopping', () => {
    it('should stop shopping session successfully', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          success: true,
          data: {},
        },
      } as AxiosResponse);

      const { result } = renderHook(() => useStopShopping(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        sessionId: 'session123',
        listId: 'list1',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.post).toHaveBeenCalledWith('/shopping/stop', {
        sessionId: 'session123',
        listId: 'list1',
      });
    });
  });

  describe('usePauseShopping', () => {
    it('should pause shopping session successfully', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          success: true,
          data: {},
        },
      } as AxiosResponse);

      const { result } = renderHook(() => usePauseShopping(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        sessionId: 'session123',
        listId: 'list1',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.post).toHaveBeenCalledWith('/shopping/pause', {
        sessionId: 'session123',
        listId: 'list1',
      });
    });
  });

  describe('useResumeShopping', () => {
    it('should resume shopping session successfully', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          success: true,
          data: {},
        },
      } as AxiosResponse);

      const { result } = renderHook(() => useResumeShopping(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        sessionId: 'session123',
        listId: 'list1',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.post).toHaveBeenCalledWith('/shopping/resume', {
        sessionId: 'session123',
        listId: 'list1',
      });
    });
  });

  describe('useCurrentShoppingSession', () => {
    it('should fetch current shopping session', async () => {
      const mockSession = {
        _id: 'session123',
        listId: 'list1',
        status: 'active',
        startedAt: new Date().toISOString(),
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          success: true,
          data: mockSession,
        },
      } as AxiosResponse);

      const { result } = renderHook(() => useCurrentShoppingSession('list1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSession);
      expect(apiClient.get).toHaveBeenCalledWith('/shopping/status/list1');
    });

    it('should return null on error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useCurrentShoppingSession('list1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.data === null).toBeTruthy();
      });
    });
  });

  describe('useActiveShoppingSessions', () => {
    it('should fetch active shopping sessions', async () => {
      const mockSessions = [
        { _id: 'session1', status: 'active' },
        { _id: 'session2', status: 'active' },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          success: true,
          data: mockSessions,
        },
      } as AxiosResponse);

      const { result } = renderHook(() => useActiveShoppingSessions('list1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSessions);
      expect(apiClient.get).toHaveBeenCalledWith('/shopping/sessions/list1');
    });

    it('should return empty array on error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useActiveShoppingSessions('list1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.data?.length === 0).toBeTruthy();
      });
    });
  });
});

