import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useNotification } from '@/contexts/NotificationContext';

export const settingsKeys = {
  all: ['settings'] as const,
  profile: () => [...settingsKeys.all, 'profile'] as const,
  preferences: () => [...settingsKeys.all, 'preferences'] as const,
  notifications: () => [...settingsKeys.all, 'notifications'] as const,
};

export const useUserProfile = () => {
  const { authReady, accessToken } = useAuthStore();
  
  return useQuery({
    queryKey: settingsKeys.profile(),
    queryFn: async () => {
      const response = await apiClient.getUserProfile();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: authReady && !!accessToken,
  });
};

export const useUserPreferences = (options?: { enabled?: boolean }) => {
  const { authReady, accessToken } = useAuthStore();
  
  return useQuery({
    queryKey: settingsKeys.preferences(),
    queryFn: async () => {
      const response = await apiClient.getUserPreferences();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: authReady && !!accessToken && (options?.enabled !== false),
  });
};

export const useNotificationSettings = () => {
  const { authReady, accessToken } = useAuthStore();
  
  return useQuery({
    queryKey: settingsKeys.notifications(),
    queryFn: async () => {
      const response = await apiClient.getNotificationSettings();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: authReady && !!accessToken,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  const { setUser, user: currentUser } = useAuthStore();

  return useMutation({
    mutationFn: async (profileData: { firstName: string; lastName: string; username?: string }) => {
      const response = await apiClient.updateProfile(profileData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.profile(), data);
      if (currentUser && data) {
        setUser({
          ...currentUser,
          ...data,
          groups: data.groups || currentUser.groups,
        });
      }
      showSuccess('notifications.profileUpdated');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useUpdateEmail = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (emailData: { email: string }) => {
      const response = await apiClient.updateEmail(emailData);
      return response.data;
    },
      onSuccess: (data) => {
        if (data) {
          queryClient.setQueryData(settingsKeys.profile(), data);
        }
        showSuccess('notifications.emailUpdated');
      },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useNotification();
  const { setUser, user: currentUser } = useAuthStore();

  return useMutation({
    mutationFn: async (preferencesData: { language: string; theme: string }) => {
      const response = await apiClient.updatePreferences(preferencesData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.preferences(), data);
      if (currentUser && data) {
        setUser({
          ...currentUser,
          preferences: {
            ...currentUser.preferences,
            ...data,
          },
        });
      }
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  const { setUser, user: currentUser } = useAuthStore();

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
        queryClient.setQueryData(settingsKeys.notifications(), data);
        queryClient.setQueryData(settingsKeys.preferences(), data);
        if (currentUser && data) {
          setUser({
            ...currentUser,
            preferences: {
              ...currentUser.preferences,
              ...data,
            },
          });
        }
        showSuccess('settings.notificationSettingsUpdateSuccess');
      },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { clearUser } = useAuthStore();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async () => {
      queryClient.cancelQueries();
      
      queryClient.clear();
      
      clearUser();
      
      await apiClient.logout();
      
      return null;
    },
    onSuccess: () => {
      showSuccess('notifications.logoutSuccess');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  return useMutation({
    mutationFn: async () => {
      await apiClient.deleteAccount();
      return null;
    },
    onSuccess: () => {
      queryClient.clear();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
      showSuccess('deleteSuccess');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};
