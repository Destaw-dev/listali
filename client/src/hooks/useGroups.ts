import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import websocketService from '@/services/websocket';
import { IWebSocketEvents } from '@/types';
import { useAuthStore } from '@/store/authStore';

// Query Keys
export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: (filters: string) => [...groupKeys.lists(), { filters }] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
};

// Groups List Query
export const useGroups = () => {
  return useQuery({
    queryKey: groupKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.getGroups();
      return response.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

// Single Group Query
export const useGroup = (groupId: string) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: groupKeys.detail(groupId),
    queryFn: async () => {
      const response = await apiClient.getGroup(groupId);
      return response.data;
    },
    enabled: !!groupId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if we get a 403 error (user is not a member)
      if (error?.response?.status === 403) {
        // Immediately remove the query from cache to prevent future attempts
        queryClient.removeQueries({ queryKey: groupKeys.detail(groupId) });
        // Also set the query data to undefined to prevent refetches
        queryClient.setQueryData(groupKeys.detail(groupId), undefined);
        // Disable the query by setting data to null
        queryClient.setQueryData(groupKeys.detail(groupId), null);
        return false;
      }
      return failureCount < 1;
    },
  });
};

// Create Group Mutation
export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (groupData: { name: string; description?: string }) => {
      const response = await apiClient.createGroup(groupData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch groups list
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      showSuccess('groups.createSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

// Update Group Mutation
export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async ({ groupId, groupData }: { groupId: string; groupData: { name: string; description?: string } }) => {
      const response = await apiClient.updateGroup(groupId, groupData);
      return response.data;
    },
    onSuccess: (_, { groupId }) => {
      // Invalidate and refetch specific group and groups list
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      showSuccess('groups.updateSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

// Delete Group Mutation
export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const response = await apiClient.deleteGroup(groupId);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch groups list
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      showSuccess('groups.deleteSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

// Join Group Mutation
export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await apiClient.joinGroup(inviteCode);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch groups list
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      showSuccess('groups.joinSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

// Invite to Group Mutation
export const useInviteToGroup = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async ({ groupId, inviteData }: { groupId: string; inviteData: { email: string; role: 'member' | 'admin' } }) => {
      const response = await apiClient.inviteToGroup(groupId, inviteData);
      return response.data;
    },
    onSuccess: (_, { groupId }) => {
      // Invalidate and refetch group details
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      showSuccess('groups.inviteSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

// Remove Group Member Mutation
export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async ({ groupId, memberId }: { groupId: string; memberId: string }) => {
      const response = await apiClient.removeGroupMember(groupId, memberId);
      return response.data;
    },
    onSuccess: (_, { groupId }) => {
      // Invalidate and refetch specific group and groups list
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      showSuccess('groups.removeMemberSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

// Update Member Role Mutation
export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async ({ groupId, memberId, newRole }: { groupId: string; memberId: string; newRole: 'admin' | 'member' }) => {
      const response = await apiClient.updateMemberRole(groupId, memberId, newRole);
      return response.data;
    },
    onSuccess: (_, { groupId }) => {
      // Invalidate and refetch specific group and groups list
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      showSuccess('groups.updateRoleSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

// Transfer Ownership Mutation
export const useTransferOwnership = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async ({ groupId, newOwnerId }: { groupId: string; newOwnerId: string }) => {
      const response = await apiClient.transferOwnership(groupId, newOwnerId);
      return response.data;
    },
    onSuccess: (_, { groupId }) => {
      // Invalidate and refetch specific group and groups list
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      showSuccess('groups.transferOwnershipSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};


export const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: ({ groupId }: { groupId: string }) => 
      apiClient.leaveGroup(groupId),
    onSuccess: (_, { groupId }) => {
      // Immediately cancel any ongoing queries for this specific group
      queryClient.cancelQueries({ queryKey: groupKeys.detail(groupId) });
      
      // Remove the specific group from cache since user is no longer a member
      queryClient.removeQueries({ queryKey: groupKeys.detail(groupId) });
      
      // Set the group query data to undefined to prevent any future refetches
      queryClient.setQueryData(groupKeys.detail(groupId), undefined);
      
      // Update the groups list cache directly to remove the group instead of invalidating
      queryClient.setQueryData(groupKeys.lists(), (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((group: any) => group._id !== groupId);
      });
      
      showSuccess('groups.leaveSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

// WebSocket hook for real-time member role updates and ownership transfers
export const useGroupMemberRoleWebSocket = (groupId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!groupId) return;

    // Ensure WebSocket is connected
    websocketService.connect();

    // Handler for member role updates
    const handleMemberRoleUpdated = (data: IWebSocketEvents['memberRoleUpdated']) => {
      // Only process events for this group
      if (data.groupId !== groupId) return;

      // Don't update if this user was the one who made the change
      // (they already got the update via the mutation)
      if (data.updaterId === user?._id) return;

      // Update the group data in the cache
      queryClient.setQueryData(groupKeys.detail(groupId), (oldGroup: any) => {
        if (!oldGroup) return oldGroup;

        // Update the member's role in the members array
        const updatedMembers = oldGroup.members?.map((member: any) => {
          const memberUserId =
            typeof member.user === 'object' ? member.user._id : member.user;

          if (memberUserId === data.userId) {
            return {
              ...member,
              role: data.role,
              // Update permissions based on new role
              permissions:
                data.role === 'admin'
                  ? {
                      canCreateLists: true,
                      canEditLists: true,
                      canDeleteLists: true,
                      canInviteMembers: true,
                      canManageMembers: true,
                    }
                  : {
                      canCreateLists: true,
                      canEditLists: true,
                      canDeleteLists: false,
                      canInviteMembers: oldGroup.settings?.allowMemberInvite || false,
                      canManageMembers: false,
                    },
            };
          }
          return member;
        });

        return {
          ...oldGroup,
          members: updatedMembers,
        };
      });

      // Also invalidate the groups list to ensure consistency
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    };

    // Handler for ownership transfers
    const handleOwnershipTransferred = (data: IWebSocketEvents['ownershipTransferred']) => {
      // Only process events for this group
      if (data.groupId !== groupId) return;

      // Don't update if this user was the one who made the change
      // (they already got the update via the mutation)
      if (data.transferredBy === user?._id) return;

      // Update the group data in the cache
      queryClient.setQueryData(groupKeys.detail(groupId), (oldGroup: any) => {
        if (!oldGroup) return oldGroup;

        // Update the members array: previous owner becomes admin, new owner becomes owner
        const updatedMembers = oldGroup.members?.map((member: any) => {
          const memberUserId =
            typeof member.user === 'object' ? member.user._id : member.user;

          if (memberUserId === data.previousOwnerId) {
            // Previous owner becomes admin
            return {
              ...member,
              role: 'admin',
              permissions: {
                canCreateLists: true,
                canEditLists: true,
                canDeleteLists: false,
                canInviteMembers: oldGroup.settings?.allowMemberInvite || false,
                canManageMembers: true,
              },
            };
          } else if (memberUserId === data.newOwnerId) {
            // New owner gets owner role
            return {
              ...member,
              role: 'owner',
              permissions: {
                canCreateLists: true,
                canEditLists: true,
                canDeleteLists: true,
                canInviteMembers: true,
                canManageMembers: true,
              },
            };
          }
          return member;
        });

        return {
          ...oldGroup,
          members: updatedMembers,
          owner: data.newOwnerId, // Update owner field if it exists
        };
      });

      // Also invalidate the groups list to ensure consistency
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    };

    // Listen for member role updates
    const unsubscribeRole = websocketService.on('memberRoleUpdated', handleMemberRoleUpdated);
    
    // Listen for ownership transfers
    const unsubscribeOwnership = websocketService.on('ownershipTransferred', handleOwnershipTransferred);

    return () => {
      unsubscribeRole();
      unsubscribeOwnership();
    };
  }, [groupId, queryClient, user?._id]);
};
