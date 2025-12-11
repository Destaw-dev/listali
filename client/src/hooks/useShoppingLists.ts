import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

export const shoppingListKeys = {
  all: ['shoppingLists'] as const,
  lists: () => [...shoppingListKeys.all, 'lists'] as const,
  list: (groupId: string) => [...shoppingListKeys.lists(), groupId] as const,
  detail: (listId: string) => [...shoppingListKeys.all, 'detail', listId] as const,
};

export const useGroupShoppingLists = (groupId: string) => {
  return useQuery({
    queryKey: shoppingListKeys.list(groupId),
    queryFn: async() => {
      const response = await apiClient.getGroupShoppingLists(groupId)
      return response.data || [];
    },
    enabled: !!groupId,
    refetchOnWindowFocus: false
  });
};

export const useShoppingList = (listId: string) => {
  return useQuery({
    queryKey: shoppingListKeys.detail(listId),
    queryFn: async() => {
      const response = await apiClient.getShoppingList(listId)
      return response.data || {};
    },
    enabled: !!listId,
    refetchOnWindowFocus: false
  });
};

export const useCreateShoppingList = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: ({ groupId, listData }: { groupId: string; listData: { name: string; description?: string; priority?: 'low'|'medium'|'high'; dueDate?: string; tags?: string[] } }) => {
      const listDataWithGroupId = { ...listData, groupId };
      return apiClient.createShoppingList(groupId, listDataWithGroupId);
    },
    onMutate: async ({ groupId, listData }) => {
      await queryClient.cancelQueries({ queryKey: shoppingListKeys.list(groupId) });
      const prev = queryClient.getQueryData<any[]>(shoppingListKeys.list(groupId));

      const tempId = `temp-${Date.now()}`;
      queryClient.setQueryData(shoppingListKeys.list(groupId), (current: any[] = []) => ([
        { _id: tempId, name: listData.name, priority: listData.priority ?? 'medium', status: 'active', metadata: { itemsCount: 0, completedItemsCount: 0 } },
        ...current
      ]));

      return { prev, groupId, tempId };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(shoppingListKeys.list(ctx.groupId), ctx.prev);
      handleApiError(err);
    },
    onSuccess: (data, { groupId }, ctx) => {
      queryClient.setQueryData(shoppingListKeys.list(groupId), (current: any[] = []) =>
        current.map(l => l._id === ctx?.tempId ? data.data : l)
      );
      showSuccess('shoppingLists.createSuccess');
    }
  });
};

export const useUpdateShoppingList = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: ({ listId, listData }: { listId: string; listData: { name?: string; description?: string; priority?: 'low'|'medium'|'high'; dueDate?: string; tags?: string[]; assignedTo?: string } }) =>
      apiClient.updateShoppingList(listId, listData),
    onMutate: async ({ listId, listData }) => {
      await queryClient.cancelQueries({ queryKey: shoppingListKeys.detail(listId) });
      const prevDetail = queryClient.getQueryData<any>(shoppingListKeys.detail(listId));
      queryClient.setQueryData(shoppingListKeys.detail(listId), (d: any) => ({ ...d, ...listData }));
      return { prevDetail, listId };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prevDetail) queryClient.setQueryData(shoppingListKeys.detail(ctx.listId), ctx.prevDetail);
      handleApiError(err);
    },
    onSuccess: (data, { listId }) => {
      queryClient.setQueryData(shoppingListKeys.list(data.data.group?._id), (lists: any[] | undefined) =>
        lists?.map(l => l._id === listId ? data.data : l)
      );
      showSuccess('shoppingLists.updateSuccess');
    }
  });
};

export const useDeleteShoppingList = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: ({ listId, groupId }: { listId: string; groupId: string }) => apiClient.deleteShoppingList(listId),
    onMutate: async ({ listId, groupId }) => {
      await queryClient.cancelQueries({ queryKey: shoppingListKeys.list(groupId) });
      const prev = queryClient.getQueryData<any[]>(shoppingListKeys.list(groupId));
      queryClient.setQueryData(shoppingListKeys.list(groupId), (current: any[] = []) =>
        current.filter(l => l._id !== listId)
      );
      return { prev, groupId };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(shoppingListKeys.list(ctx.groupId), ctx.prev);
      handleApiError(err);
    },
    onSuccess: (_data, { groupId }) => {
      showSuccess('shoppingLists.deleteSuccess');
    }
  });
};


export const useAddItemToList = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: ({ listId, itemData }: { listId: string; itemData: { name: string; quantity?: number; unit?: string; product?: string; category?: string; priority?: 'low'|'medium'|'high'; notes?: string; estimatedPrice?: number; actualPrice?: number } }) =>
      apiClient.addItemToList(listId, itemData),
    onMutate: async ({ listId }) => {
      await queryClient.cancelQueries({ queryKey: shoppingListKeys.detail(listId) });
      const prev = queryClient.getQueryData<any>(shoppingListKeys.detail(listId));
      queryClient.setQueryData(shoppingListKeys.detail(listId), (d: any) => ({
        ...d,
        metadata: {
          ...d?.metadata,
          itemsCount: (d?.metadata?.itemsCount ?? 0) + 1
        }
      }));
      return { prev, listId };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(shoppingListKeys.detail(ctx.listId), ctx.prev);
      handleApiError(e);
    },
    onSuccess: () => {
      showSuccess('items.addSuccess');
    }
  });
};

export const useRemoveItemFromList = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
      apiClient.removeItemFromList(listId, itemId),
    onMutate: async ({ listId }) => {
      await queryClient.cancelQueries({ queryKey: shoppingListKeys.detail(listId) });
      const prev = queryClient.getQueryData<any>(shoppingListKeys.detail(listId));
      queryClient.setQueryData(shoppingListKeys.detail(listId), (d: any) => ({
        ...d,
        metadata: {
          ...d?.metadata,
          itemsCount: Math.max(0, (d?.metadata?.itemsCount ?? 1) - 1)
        }
      }));
      return { prev, listId };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(shoppingListKeys.detail(ctx.listId), ctx.prev);
      handleApiError(e);
    },
    onSuccess: () => {
      showSuccess('items.removeSuccess');
    }
  });
};


export const useCompleteShoppingList = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: ({ listId }: { listId: string }) => 
      apiClient.completeShoppingList(listId),
    onSuccess: (data, { listId }) => {
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.detail(listId) });
      showSuccess('shoppingLists.completeSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
}; 