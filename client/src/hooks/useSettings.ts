import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useNotification } from '@/contexts/NotificationContext';

// Query Keys
export const settingsKeys = {
  all: ['settings'] as const,
  profile: () => [...settingsKeys.all, 'profile'] as const,
  preferences: () => [...settingsKeys.all, 'preferences'] as const,
  notifications: () => [...settingsKeys.all, 'notifications'] as const,
};

// Get User Profile Query
export const useUserProfile = () => {
  return useQuery({
    queryKey: settingsKeys.profile(),
    queryFn: async () => {
      const response = await apiClient.getUserProfile();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Get User Preferences Query
export const useUserPreferences = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: settingsKeys.preferences(),
    queryFn: async () => {
      const response = await apiClient.getUserPreferences();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    enabled: options?.enabled !== false, // Default to true, but can be disabled
  });
};

// Get Notification Settings Query
export const useNotificationSettings = () => {
  return useQuery({
    queryKey: settingsKeys.notifications(),
    queryFn: async () => {
      const response = await apiClient.getNotificationSettings();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Update Profile Mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (profileData: { firstName: string; lastName: string; username?: string }) => {
      const response = await apiClient.updateProfile(profileData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.profile(), data);
      showSuccess('notifications.profileUpdated');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

// Update Email Mutation
export const useUpdateEmail = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (emailData: { email: string }) => {
      const response = await apiClient.updateEmail(emailData);
      return response.data;
    },
      onSuccess: (data) => {
        // Update profile in cache
        queryClient.setQueryData(settingsKeys.profile(), data);
        showSuccess('emailUpdated');
      },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

// Update Preferences Mutation
export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (preferencesData: { language: string; theme: string }) => {
      const response = await apiClient.updatePreferences(preferencesData);
      return response.data;
    },
    onSuccess: (data) => {
      // Update preferences in cache
      queryClient.setQueryData(settingsKeys.preferences(), data);
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

// Update Notification Settings Mutation
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (settings: {
      pushNotifications: boolean;
      emailNotifications: boolean;
      newMessageNotifications: boolean;
      shoppingListUpdates: boolean;
      groupInvitations: boolean;
    }) => {
      const response = await apiClient.updateNotificationSettings(settings);
      return response.data;
    },
      onSuccess: (data) => {
        // Update notification settings in cache and user preferences
        queryClient.setQueryData(settingsKeys.notifications(), data);
        queryClient.setQueryData(settingsKeys.preferences(), data);
        showSuccess('settings.notificationSettingsUpdateSuccess');
      },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

// Logout Mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  const { clearUser } = useAuthStore();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async () => {
      // Cancel all ongoing queries first
      queryClient.cancelQueries();
      
      // Clear all queries from cache
      queryClient.clear();
      
      // Clear user from store (this also clears token from localStorage)
      clearUser();
      
      // Call logout API
      await apiClient.logout();
      
      return null;
    },
    onSuccess: () => {
      showSuccess('notifications.logoutSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

// Delete Account Mutation
export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  return useMutation({
    mutationFn: async () => {
      await apiClient.deleteAccount();
      return null;
    },
    onSuccess: () => {
      // Clear all queries from cache
      queryClient.clear();
      // Clear user from store
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
      showSuccess('deleteSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};
