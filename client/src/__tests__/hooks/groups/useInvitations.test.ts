import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInvitations, useAcceptInvitation, useDeclineInvitation } from '../../../hooks/useInvitations';
import { apiClient } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';

const mockInvitations = [
  {
    _id: 'inv1',
    group: {
      _id: 'group1',
      name: 'Test Group',
    },
    invitedBy: {
      _id: 'user1',
      username: 'inviter',
    },
    role: 'member' as const,
    invitedAt: new Date().toISOString(),
    status: 'pending' as const,
    code: 'ABC123',
  },
];

vi.mock('../../../lib/api', () => ({
  apiClient: {
    getMyInvitations: vi.fn(),
    acceptInvitation: vi.fn(),
    declineInvitation: vi.fn(),
  },
}));
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

describe('useInvitations Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      authReady: true,
      accessToken: 'test-token',
    } as ReturnType<typeof useAuthStore>);
  });

  describe('useInvitations', () => {
    it('should fetch invitations successfully', async () => {
      vi.mocked(apiClient.getMyInvitations).mockResolvedValue({
        data: mockInvitations,
      } as ReturnType<typeof useAuthStore>);

      const { result } = renderHook(() => useInvitations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockInvitations);
      expect(apiClient.getMyInvitations).toHaveBeenCalled();
    });

    it('should not fetch when auth is not ready', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        authReady: false,
        accessToken: null,
      } as ReturnType<typeof useAuthStore>);

      const { result } = renderHook(() => useInvitations(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('useAcceptInvitation', () => {
    it('should accept invitation successfully', async () => {
      vi.mocked(apiClient.acceptInvitation).mockResolvedValue({
        data: { ...mockInvitations[0], status: 'accepted' },
      } as ReturnType<typeof useAuthStore>);

      const { result } = renderHook(() => useAcceptInvitation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('inv1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.acceptInvitation).toHaveBeenCalledWith('inv1');
    });
  });

  describe('useDeclineInvitation', () => {
    it('should decline invitation successfully', async () => {
      vi.mocked(apiClient.declineInvitation).mockResolvedValue({
        data: { ...mockInvitations[0], status: 'declined' },
      } as ReturnType<typeof useAuthStore>);

      const { result } = renderHook(() => useDeclineInvitation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('inv1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.declineInvitation).toHaveBeenCalledWith('inv1');
    });
  });
});

