import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

// Query Keys
export const invitationKeys = {
  all: ['invitations'] as const,
  lists: () => [...invitationKeys.all, 'list'] as const,
  list: (filters: string) => [...invitationKeys.lists(), { filters }] as const,
};

// Invitations List Query
export const useInvitations = () => {
  return useQuery({
    queryKey: invitationKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.getMyInvitations();
      return response.data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 1,
  });
};

// Accept Invitation Mutation
export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await apiClient.acceptInvitation(invitationId);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch invitations list
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
      // Also invalidate groups since user joined a new group
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      showSuccess('invitations.acceptSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

// Decline Invitation Mutation
export const useDeclineInvitation = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await apiClient.declineInvitation(invitationId);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch invitations list
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
      showSuccess('invitations.declineSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
}; 