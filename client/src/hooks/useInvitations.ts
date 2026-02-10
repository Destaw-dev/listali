import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';
import { useAuthStore } from '../store/authStore';

export const invitationKeys = {
  all: ['invitations'] as const,
  lists: () => [...invitationKeys.all, 'list'] as const,
  list: (filters: string) => [...invitationKeys.lists(), { filters }] as const,
};

export const useInvitations = () => {
  const { authReady, accessToken } = useAuthStore();
  
  return useQuery({
    queryKey: invitationKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.getMyInvitations();
      return response.data || [];
    },
    staleTime: 1 * 60 * 1000,
    retry: 1,
    enabled: authReady && !!accessToken,
  });
};

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await apiClient.acceptInvitation(invitationId);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['invitations', 'join-requests'] });

      const apiResponse = response as { data?: unknown; message?: string };

      if (apiResponse?.data) {
        showSuccess('invitations.acceptSuccess');
      } else {
        showSuccess('groups.joinRequestPending');
      }
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useDeclineInvitation = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await apiClient.declineInvitation(invitationId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
      showSuccess('invitations.declineSuccess');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useJoinRequests = () => {
  const { authReady, accessToken } = useAuthStore();
  
  return useQuery({
    queryKey: [...invitationKeys.all, 'join-requests'],
    queryFn: async () => {
      const response = await apiClient.getMyJoinRequests();
      return response.data || [];
    },
    staleTime: 1 * 60 * 1000,
    retry: 1,
    enabled: authReady && !!accessToken,
  });
}; 