import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';
import websocketService from '../services/websocket';
import { IGroup, IGroupMember, IWebSocketEvents } from '../types';
import { useAuthStore } from '../store/authStore';
import { AxiosError } from 'axios';

export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: (filters: string) => [...groupKeys.lists(), { filters }] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
};

export const useGroups = () => {
  const { authReady, accessToken } = useAuthStore();
  
  return useQuery({
    queryKey: groupKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.getGroups();
      return response.data || [];
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
    enabled: authReady && !!accessToken,
  });
};

export const useGroup = (groupId: string) => {
  const queryClient = useQueryClient();
  const { authReady, accessToken } = useAuthStore();
  
  return useQuery({
    queryKey: groupKeys.detail(groupId),
    queryFn: async () => {
      const response = await apiClient.getGroup(groupId);
      return response.data;
    },
    enabled: authReady && !!accessToken && !!groupId,
    staleTime: 2 * 60 * 1000,
    retry: (failureCount: number, error: Error) => {
      if (error instanceof AxiosError && error.response?.status === 403) {
        queryClient.removeQueries({ queryKey: groupKeys.detail(groupId) });
        queryClient.setQueryData(groupKeys.detail(groupId), undefined);
        queryClient.setQueryData(groupKeys.detail(groupId), null);
        return false;
      }
      return failureCount < 1;
    },
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (groupData: { name: string; description?: string }) => {
      const response = await apiClient.createGroup(groupData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      showSuccess('groups.createSuccess');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async ({ groupId, groupData }: { groupId: string; groupData: { name?: string; description?: string; settings?: { allowMemberInvite?: boolean; requireApproval?: boolean; maxMembers?: number } } }) => {
      const response = await apiClient.updateGroup(groupId, groupData);
      return response.data;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      showSuccess('groups.updateSuccess');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const response = await apiClient.deleteGroup(groupId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      showSuccess('groups.deleteSuccess');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await apiClient.joinGroup(inviteCode);
      return response.data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
        showSuccess('groups.joinSuccess');
      } else {
        showSuccess('groups.joinRequestPending');
      }
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useInviteToGroup = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async ({ groupId, inviteData }: { groupId: string; inviteData: { email: string; role: 'member' | 'admin' } }) => {
      const response = await apiClient.inviteToGroup(groupId, inviteData);
      return response.data;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      showSuccess('groups.inviteSuccess');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useCancelGroupInvitation = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async ({ groupId, inviteCode }: { groupId: string; inviteCode: string }) => {
      const response = await apiClient.cancelGroupInvitation(groupId, inviteCode);
      return response.data;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      showSuccess('groups.settings.invitationCancelled');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async ({ groupId, memberId }: { groupId: string; memberId: string }) => {
      const response = await apiClient.removeGroupMember(groupId, memberId);
      return response.data;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      showSuccess('groups.removeMemberSuccess');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async ({ groupId, memberId, newRole }: { groupId: string; memberId: string; newRole: 'admin' | 'member' }) => {
      const response = await apiClient.updateMemberRole(groupId, memberId, newRole);
      return response.data;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      showSuccess('groups.updateRoleSuccess');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useTransferOwnership = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async ({ groupId, newOwnerId }: { groupId: string; newOwnerId: string }) => {
      const response = await apiClient.transferOwnership(groupId, newOwnerId);
      return response.data;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      showSuccess('groups.transferOwnershipSuccess');
    },
    onError: (error: Error) => {
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
      queryClient.cancelQueries({ queryKey: groupKeys.detail(groupId) });
      
      queryClient.removeQueries({ queryKey: groupKeys.detail(groupId) });
      
      queryClient.setQueryData(groupKeys.detail(groupId), undefined);
      
      queryClient.setQueryData(groupKeys.lists(), (oldData: IGroup[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter((group: IGroup) => group._id !== groupId);
      });
      
      showSuccess('groups.leaveSuccess');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useApproveJoinRequest = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: ({ groupId, requestId }: { groupId: string; requestId: string }) =>
      apiClient.approveJoinRequest(groupId, requestId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['invitations', 'join-requests'] });
      showSuccess('groups.joinRequestApproved');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useRejectJoinRequest = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: ({ groupId, requestId }: { groupId: string; requestId: string }) =>
      apiClient.rejectJoinRequest(groupId, requestId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: ['invitations', 'join-requests'] });
      showSuccess('groups.joinRequestRejected');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useGroupMemberRoleWebSocket = (groupId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!groupId) return;

    websocketService.connect();

    const handleMemberRoleUpdated = (data: IWebSocketEvents['memberRoleUpdated']) => {
      if (data.groupId !== groupId) return;

      if (data.updaterId === user?._id) return;

      queryClient.setQueryData(groupKeys.detail(groupId), (oldGroup: IGroup | undefined) => {
        if (!oldGroup) return oldGroup;

        const updatedMembers = oldGroup.members?.map((member: IGroupMember) => {
          const memberUserId =
            typeof member.user === 'object' ? (member.user.id || member.userId) : member.user;

          if (memberUserId === data.userId) {
            return {
              ...member,
              role: data.role,
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

      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    };

    const handleOwnershipTransferred = (data: IWebSocketEvents['ownershipTransferred']) => {
      if (data.groupId !== groupId) return;

      if (data.transferredBy === user?._id) return;

      queryClient.setQueryData(groupKeys.detail(groupId), (oldGroup: IGroup | undefined) => {
        if (!oldGroup) return oldGroup;

        const updatedMembers = oldGroup.members?.map((member: IGroupMember) => {
          const memberUserId =
            typeof member.user === 'object' ? (member.user.id || member.userId) : member.user;

          if (memberUserId === data.previousOwnerId) {
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
          owner: data.newOwnerId,
        };
      });

      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    };

    const unsubscribeRole = websocketService.on('memberRoleUpdated', handleMemberRoleUpdated);
    
    const unsubscribeOwnership = websocketService.on('ownershipTransferred', handleOwnershipTransferred);

    return () => {
      unsubscribeRole();
      unsubscribeOwnership();
    };
  }, [groupId, queryClient, user?._id]);
};
