import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';
import websocketService from '../services/websocket';
import { IGroup, IGroupMember, IWebSocketEvents } from '../types';
import { useAuthStore } from '../store/authStore';
import { AxiosError } from 'axios';
import { useMutationFactory } from './useMutationFactory';

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
  return useMutationFactory<unknown, { name: string; description?: string }>({
    mutationFn: async (groupData) => {
      const response = await apiClient.createGroup(groupData);
      return response.data;
    },
    successMessage: 'groups.createSuccess',
    invalidateQueries: [groupKeys.lists()],
  });
};

export const useUpdateGroup = () => {
  return useMutationFactory<
    unknown,
    { groupId: string; groupData: { name?: string; description?: string; settings?: { allowMemberInvite?: boolean; requireApproval?: boolean; maxMembers?: number } } }
  >({
    mutationFn: async ({ groupId, groupData }) => {
      const response = await apiClient.updateGroup(groupId, groupData);
      return response.data;
    },
    successMessage: 'groups.updateSuccess',
    invalidateQueries: (_data, { groupId }) => [groupKeys.detail(groupId), groupKeys.lists()],
  });
};

export const useDeleteGroup = () => {
  return useMutationFactory<unknown, string>({
    mutationFn: async (groupId: string) => {
      const response = await apiClient.deleteGroup(groupId);
      return response.data;
    },
    successMessage: 'groups.deleteSuccess',
    invalidateQueries: [groupKeys.lists()],
  });
};

export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  const { showSuccess } = useNotification();

  return useMutationFactory<unknown, string>({
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
  });
};

export const useInviteToGroup = () => {
  return useMutationFactory<
    unknown,
    { groupId: string; inviteData: { email: string; role: 'member' | 'admin' } }
  >({
    mutationFn: async ({ groupId, inviteData }) => {
      const response = await apiClient.inviteToGroup(groupId, inviteData);
      return response.data;
    },
    successMessage: 'groups.inviteSuccess',
    invalidateQueries: (_data, { groupId }) => [groupKeys.detail(groupId)],
  });
};

export const useCancelGroupInvitation = () => {
  return useMutationFactory<unknown, { groupId: string; inviteCode: string }>({
    mutationFn: async ({ groupId, inviteCode }) => {
      const response = await apiClient.cancelGroupInvitation(groupId, inviteCode);
      return response.data;
    },
    successMessage: 'groups.settings.invitationCancelled',
    invalidateQueries: (_data, { groupId }) => [groupKeys.detail(groupId)],
  });
};

export const useRemoveGroupMember = () => {
  return useMutationFactory<unknown, { groupId: string; memberId: string }>({
    mutationFn: async ({ groupId, memberId }) => {
      const response = await apiClient.removeGroupMember(groupId, memberId);
      return response.data;
    },
    successMessage: 'groups.removeMemberSuccess',
    invalidateQueries: (_data, { groupId }) => [groupKeys.detail(groupId), groupKeys.lists()],
  });
};

export const useUpdateMemberRole = () => {
  return useMutationFactory<unknown, { groupId: string; memberId: string; newRole: 'admin' | 'member' }>({
    mutationFn: async ({ groupId, memberId, newRole }) => {
      const response = await apiClient.updateMemberRole(groupId, memberId, newRole);
      return response.data;
    },
    successMessage: 'groups.updateRoleSuccess',
    invalidateQueries: (_data, { groupId }) => [groupKeys.detail(groupId), groupKeys.lists()],
  });
};

export const useTransferOwnership = () => {
  return useMutationFactory<unknown, { groupId: string; newOwnerId: string }>({
    mutationFn: async ({ groupId, newOwnerId }) => {
      const response = await apiClient.transferOwnership(groupId, newOwnerId);
      return response.data;
    },
    successMessage: 'groups.transferOwnershipSuccess',
    invalidateQueries: (_data, { groupId }) => [groupKeys.detail(groupId), groupKeys.lists()],
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
  return useMutationFactory<unknown, { groupId: string; requestId: string }>({
    mutationFn: ({ groupId, requestId }) =>
      apiClient.approveJoinRequest(groupId, requestId),
    successMessage: 'groups.joinRequestApproved',
    invalidateQueries: (_data, { groupId }) => [groupKeys.detail(groupId), groupKeys.lists(), ['invitations', 'join-requests']],
  });
};

export const useRejectJoinRequest = () => {
  return useMutationFactory<unknown, { groupId: string; requestId: string }>({
    mutationFn: ({ groupId, requestId }) =>
      apiClient.rejectJoinRequest(groupId, requestId),
    successMessage: 'groups.joinRequestRejected',
    invalidateQueries: (_data, { groupId }) => [groupKeys.detail(groupId), ['invitations', 'join-requests']],
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
