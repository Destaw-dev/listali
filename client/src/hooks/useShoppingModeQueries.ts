import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

export const shoppingKeys = {
  all: ['shopping'] as const,
  sessions: (listId: string) => [...shoppingKeys.all, 'sessions', listId] as const,
};

export const useStartShopping = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: (data: { listId: string; groupId: string; location?: any }) => 
      apiClient.post('/shopping/start', data),
    onMutate: async (variables) => {
      const queryKey = [...shoppingKeys.all, 'list-data', variables.listId];
      
      await queryClient.cancelQueries({ queryKey });
      
      const previousData = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        
        const mockSession = {
          _id: 'temp-' + Date.now(),
          listId: variables.listId,
          status: 'active',
          startedAt: new Date(),
          isActive: true,
          itemsPurchased: 0,
          totalItems: old.statistics?.totalItems || 0
        };
        
        return {
          ...old,
          currentUserSession: mockSession,
          activeSessions: [...(old.activeSessions || []), mockSession]
        };
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([...shoppingKeys.all, 'list-data', variables.listId], context.previousData);
      }
      handleApiError(err);
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['shopping-lists', 'full-data', variables.listId], (oldData: any) => {
        if (!oldData) return oldData;
        
        const newSession = {
          _id: data.data?.data?.sessionId,
          listId: variables.listId,
          userId: data.data?.data?.userId || 'current-user',
          status: 'active',
          startedAt: data.data?.data?.startedAt || new Date().toISOString(),
          isActive: true,
          itemsPurchased: 0,
          totalItems: data.data?.data?.totalItems || oldData.stats?.totalItems || 0
        };
        
        return {
          ...oldData,
          shoppingSession: {
            ...oldData.shoppingSession,
            currentUserSession: newSession,
            activeSessions: [...(oldData.shoppingSession?.activeSessions || []), newSession],
            totalActiveSessions: (oldData.shoppingSession?.totalActiveSessions || 0) + 1
          }
        };
      });
      
      queryClient.invalidateQueries({ queryKey: [...shoppingKeys.all, 'list-data', variables.listId] });
    },
  });
};

export const useStopShopping = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { sessionId: string; listId: string }) => 
      apiClient.post('/shopping/stop', data),
    onMutate: async (variables) => {
      const queryKey = [...shoppingKeys.all, 'list-data', variables.listId];
      
      await queryClient.cancelQueries({ queryKey });
      
      const previousData = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          currentUserSession: null,
          activeSessions: (old.activeSessions || []).filter((session: any) => 
            session._id !== variables.sessionId
          )
        };
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([...shoppingKeys.all, 'list-data', variables.listId], context.previousData);
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['shopping-lists', 'full-data', variables.listId], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          shoppingSession: {
            ...oldData.shoppingSession,
            currentUserSession: null,
            activeSessions: (oldData.shoppingSession?.activeSessions || []).filter((session: any) => 
              session._id !== variables.sessionId
            ),
            totalActiveSessions: Math.max(0, (oldData.shoppingSession?.totalActiveSessions || 0) - 1)
          }
        };
      });
      
      queryClient.invalidateQueries({ queryKey: [...shoppingKeys.all, 'list-data', variables.listId] });
    },
  });
};

export const usePauseShopping = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { sessionId: string; listId: string }) => 
      apiClient.post('/shopping/pause', data),
    onSuccess: (data, variables) => {
      
      queryClient.setQueryData(['shopping-lists', 'full-data', variables.listId], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          shoppingSession: {
            ...oldData.shoppingSession,
            currentUserSession: oldData.shoppingSession?.currentUserSession ? {
              ...oldData.shoppingSession.currentUserSession,
              status: 'paused'
            } : null,
            activeSessions: (oldData.shoppingSession?.activeSessions || []).map((session: any) => 
              session._id === variables.sessionId ? { ...session, status: 'paused' } : session
            )
          }
        };
      });
      
      queryClient.invalidateQueries({ queryKey: [...shoppingKeys.all, 'list-data', variables.listId] });
    },
  });
};


export const useResumeShopping = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { sessionId: string; listId: string }) => 
      apiClient.post('/shopping/resume', data),
    onSuccess: (data, variables) => {
      
      queryClient.setQueryData(['shopping-lists', 'full-data', variables.listId], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          shoppingSession: {
            ...oldData.shoppingSession,
            currentUserSession: oldData.shoppingSession?.currentUserSession ? {
              ...oldData.shoppingSession.currentUserSession,
              status: 'active'
            } : null,
            activeSessions: (oldData.shoppingSession?.activeSessions || []).map((session: any) => 
              session._id === variables.sessionId ? { ...session, status: 'active' } : session
            )
          }
        };
      });
      
      queryClient.invalidateQueries({ queryKey: [...shoppingKeys.all, 'list-data', variables.listId] });
    },
  });
};

export const useUpdateShoppingLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: { sessionId: string; location: any }) => 
      apiClient.put('/shopping/location', request),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: shoppingKeys.all });
    },
  });
};

export const useCurrentShoppingSession = (listId: string) => {
  return useQuery({
    queryKey: [...shoppingKeys.all, 'current-session', listId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/shopping/status/${listId}`);
        return response.data.data;
      } catch (error) {
        return null;
      }
    },
    enabled: !!listId,
    staleTime: 10000,
  });
};

export const useActiveShoppingSessions = (listId: string) => {
  return useQuery({
    queryKey: [...shoppingKeys.all, 'active-sessions', listId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/shopping/sessions/${listId}`);
        return response.data.data || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!listId,
    staleTime: 10000,
  });
};

export const useShoppingStats = (listId: string) => {
  return useQuery({
    queryKey: [...shoppingKeys.all, 'stats', listId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/shopping/stats/${listId}`);
        const data = response.data.data;
        return data;
      } catch (error) {
        return {
          totalItems: 0,
          purchasedItems: 0,
          remainingItems: 0,
          progress: 0,
        };
      }
    },
    enabled: !!listId,
    staleTime: 10000,
  });
}; 

export const useShoppingListData = (listId: string) => {
  return useQuery({
    queryKey: [...shoppingKeys.all, 'list-data', listId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/shopping/list-data/${listId}`);
        return response.data.data;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!listId,
    staleTime: 10000,
  });
}; 