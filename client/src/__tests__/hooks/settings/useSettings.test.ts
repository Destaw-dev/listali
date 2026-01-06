import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useUserProfile,
  useUserPreferences,
  useNotificationSettings,
  useUpdateProfile,
  useUpdateEmail,
  useUpdatePreferences,
  useUpdateNotificationSettings,
} from '../../../hooks/useSettings';
import { apiClient } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { mockUser } from '../../mocks/mockData';

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

describe('useSettings Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      authReady: true,
      accessToken: 'test-token',
      user: mockUser,
      setUser: vi.fn(),
    } as ReturnType<typeof useAuthStore>);
  });

  describe('useUserProfile', () => {
    it('should fetch user profile successfully', async () => {
      vi.mocked(apiClient.getUserProfile).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUser);
      expect(apiClient.getUserProfile).toHaveBeenCalled();
    });
  });

  describe('useUserPreferences', () => {
    it('should fetch user preferences successfully', async () => {
      const mockPreferences = {
        language: 'he',
        theme: 'light',
      };

      vi.mocked(apiClient.getUserPreferences).mockResolvedValue({
        success: true,
        data: mockPreferences,
      });

      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPreferences);
    });
  });

  describe('useNotificationSettings', () => {
    it('should fetch notification settings successfully', async () => {
      const mockSettings = {
        pushNotifications: true,
        emailNotifications: true,
        newMessageNotifications: true,
        shoppingListUpdates: true,
        groupInvitations: true,
      };

      vi.mocked(apiClient.getNotificationSettings).mockResolvedValue({
        success: true,
        data: mockSettings,
      });

      const { result } = renderHook(() => useNotificationSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSettings);
    });
  });

  describe('useUpdateProfile', () => {
    it('should update profile successfully', async () => {
      const updatedProfile = {
        ...mockUser,
        firstName: 'Updated',
        lastName: 'Name',
      };

      vi.mocked(apiClient.updateProfile).mockResolvedValue({
        success: true,
        data: updatedProfile,
      });

      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        firstName: 'Updated',
        lastName: 'Name',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.updateProfile).toHaveBeenCalledWith({
        firstName: 'Updated',
        lastName: 'Name',
      });
    });
  });

  describe('useUpdateEmail', () => {
    it('should update email successfully', async () => {
      vi.mocked(apiClient.updateEmail).mockResolvedValue({
        success: true,
        data: { ...mockUser, email: 'new@example.com' },
      });

      const { result } = renderHook(() => useUpdateEmail(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        email: 'new@example.com',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.updateEmail).toHaveBeenCalledWith({
        email: 'new@example.com',
      });
    });
  });

  describe('useUpdatePreferences', () => {
    it('should update preferences successfully', async () => {
      vi.mocked(apiClient.updatePreferences).mockResolvedValue({
        success: true,
        data: {
          language: 'en',
          theme: 'dark',
        },
      });

      const { result } = renderHook(() => useUpdatePreferences(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        language: 'en',
        theme: 'dark',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.updatePreferences).toHaveBeenCalledWith({
        language: 'en',
        theme: 'dark',
      });
    });
  });

  describe('useUpdateNotificationSettings', () => {
    it('should update notification settings successfully', async () => {
      const mockSettings = {
        pushNotifications: false,
        emailNotifications: true,
        newMessageNotifications: true,
        shoppingListUpdates: false,
        groupInvitations: true,
      };

      vi.mocked(apiClient.updateNotificationSettings).mockResolvedValue({
        success: true,
        data: mockSettings,
      });

      const { result } = renderHook(() => useUpdateNotificationSettings(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockSettings);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.updateNotificationSettings).toHaveBeenCalledWith(mockSettings);
    });
  });
});

