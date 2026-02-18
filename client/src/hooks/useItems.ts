import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiClient } from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';
import { useAuthStore } from '../store/authStore';
import { ICreateMultipleItemsInput, IItem, ISubCategory, IShoppingList, IShoppingSession } from '../types';

interface ShoppingListFullData {
  shoppingList?: IShoppingList;
  items?: IItem[];
  stats?: {
    totalItems: number;
    purchasedItems: number;
    remainingItems: number;
    progress: number;
  };
  shoppingSession?: IShoppingSession;
}

export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'lists'] as const,
  list: (shoppingListId: string) => [...itemKeys.lists(), shoppingListId] as const,
  detail: (itemId: string) => [...itemKeys.all, 'detail', itemId] as const,
};

export const useItems = (shoppingListId: string, options?: {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
  sort?: string;
  populateProduct?: boolean;
}) => {
  const { authReady, accessToken } = useAuthStore();
  
  return useQuery({
    queryKey: itemKeys.list(shoppingListId),
    queryFn: async () => {
      const response = await apiClient.getItems(shoppingListId, options)
      return response.data || [];
    },
    enabled: authReady && !!accessToken && !!shoppingListId,
  });
};

export const useItem = (itemId: string) => {
  const { authReady, accessToken } = useAuthStore();

  return useQuery({
    queryKey: itemKeys.detail(itemId),
    queryFn: () => apiClient.getItemById(itemId),
    enabled: authReady && !!accessToken && !!itemId,
  });
};

export interface PopularItem {
  _id: { name: string; category: string | null; unit: string };
  count: number;
  avgPrice: number | null;
  lastPurchased: string | null;
  product: string | null;
  isManualEntry: boolean;
  image?: string;
  brand?: string;
  name: string;
}

export const usePopularItems = (groupId: string, enabled = true) => {
  const { authReady, accessToken } = useAuthStore();

  return useQuery({
    queryKey: ['items', 'popular', groupId],
    queryFn: (): Promise<PopularItem[]> => apiClient.getPopularItems(groupId),
    enabled: authReady && !!accessToken && !!groupId && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: (itemData: {
      name: string;
      description?: string;
      quantity: number;
      unit: string;
      category: string;
      brand?: string;
      estimatedPrice?: number;
      priority?: 'low' | 'medium' | 'high';
      notes?: string;
      alternatives?: string[];
      shoppingListId: string;
      product?: string;
      isManualEntry?: boolean;
    }) => {
      const cleanData = {
        ...itemData,
        category: itemData.category || '',
      };
      return apiClient.createItem(cleanData);
    },
    onSuccess: (data, variables) => {
      const shoppingListId = variables.shoppingListId;
      queryClient.invalidateQueries({ queryKey: itemKeys.list(shoppingListId) });
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data', shoppingListId] });
      showSuccess('items.createSuccess');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useCreateMultipleItems = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: (items: ICreateMultipleItemsInput[]) => apiClient.createMultipleItems(items),
    onSuccess: (data, variables) => {
      const shoppingListId = variables[0]?.shoppingListId;
      if (shoppingListId) {
        queryClient.invalidateQueries({ queryKey: itemKeys.list(shoppingListId) });
        queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data', shoppingListId] });
        showSuccess('items.createMultipleSuccess');
      }
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};



export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: ({ itemId, itemData }: {
      itemId: string;
      shoppingListId: string;
      itemData: {
        name?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        category?: string;
        brand?: string;
        estimatedPrice?: number;
        priority?: 'low' | 'medium' | 'high';
        notes?: string;
        alternatives?: string[];
      };
    }) => apiClient.updateItem(itemId, itemData),
    onSuccess: (data, { itemId, shoppingListId }) => {
      const updatedItem = data?.data;
      if (updatedItem) {
        queryClient.setQueryData(['shopping-lists', 'full-data', shoppingListId], (oldData: ShoppingListFullData | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            items: oldData.items?.map((item: IItem) =>
              item._id === itemId ? { ...item, ...updatedItem } : item
            ) ?? oldData.items,
          };
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data', shoppingListId] });
      }
      showSuccess('items.updateSuccess');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: ({ itemId }: { itemId: string; shoppingListId: string }) =>
      apiClient.deleteItem(itemId),
    onMutate: async ({ itemId, shoppingListId }) => {
      await queryClient.cancelQueries({ queryKey: ['shopping-lists', 'full-data', shoppingListId] });
      const previous = queryClient.getQueryData(['shopping-lists', 'full-data', shoppingListId]);
      queryClient.setQueryData(['shopping-lists', 'full-data', shoppingListId], (oldData: ShoppingListFullData | undefined) => {
        if (!oldData) return oldData;
        const items = (oldData.items ?? []).filter((item: IItem) => item._id !== itemId);
        return {
          ...oldData,
          items,
          stats: oldData.stats ? {
            ...oldData.stats,
            totalItems: items.length,
            purchasedItems: items.filter((i: IItem) => i.status === 'purchased').length,
            remainingItems: items.filter((i: IItem) => i.status !== 'purchased').length,
          } : oldData.stats,
        };
      });
      return { previous };
    },
    onSuccess: (_, { shoppingListId }) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data', shoppingListId] });
      showSuccess('items.deleteSuccess');
    },
    onError: (error: Error, { shoppingListId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['shopping-lists', 'full-data', shoppingListId], context.previous);
      }
      handleApiError(error);
    },
  });
};

export const usePurchaseItem = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: ({ itemId, quantityToPurchase, actualPrice }: { 
      itemId: string; 
      shoppingListId: string; 
      groupId: string;
      quantityToPurchase?: number;
      actualPrice?: number;
    }) => 
      apiClient.purchaseItem(itemId, { quantityToPurchase, actualPrice }),
    onSuccess: (data, { itemId, shoppingListId }) => {
      queryClient.setQueryData(['shopping-lists', 'full-data', shoppingListId], (oldData: ShoppingListFullData | undefined) => {
        if (!oldData) return oldData;
        
        const updatedItems = (oldData.items?.map((item: IItem) => {
          if (item._id === itemId) {
            const updatedItem = data.data || item;
            const purchasedQty = updatedItem.purchasedQuantity || item.purchasedQuantity || 0;
            const isFullyPurchased = purchasedQty >= item.quantity;
            const isPartiallyPurchased = purchasedQty > 0 && purchasedQty < item.quantity;
            return {
              ...item,
              ...updatedItem,
              status: (isFullyPurchased ? 'purchased' : (isPartiallyPurchased ? 'partially_purchased' : 'pending')) as IItem['status'],
              isPurchased: isFullyPurchased,
              isPartiallyPurchased: isPartiallyPurchased,
              purchasedQuantity: purchasedQty,
              remainingQuantity: Math.max(0, item.quantity - purchasedQty),
            } as IItem;
          }
          return item;
        }) || oldData.items || []) as IItem[];
        
        const updatedStats = oldData.stats ? {
          ...oldData.stats,
          purchasedItems: updatedItems.filter((item) => item.status === 'purchased').length,
          remainingItems: updatedItems.filter((item) => item.status !== 'purchased').length,
          progress: updatedItems.length > 0 ? Math.round((updatedItems.filter((item) => item.status === 'purchased').length / updatedItems.length) * 100) : 0
        } : oldData.stats;
        
        return {
          ...oldData,
          items: updatedItems,
          stats: updatedStats
        };
      });
      
      showSuccess('items.purchaseSuccess');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useUnpurchaseItem = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: ({ itemId, quantityToUnpurchase }: { itemId: string; shoppingListId: string; groupId: string; quantityToUnpurchase?: number }) => 
      apiClient.unpurchaseItem(itemId, { quantityToUnpurchase }),
    onSuccess: (data, { itemId, shoppingListId, quantityToUnpurchase }) => {
      queryClient.setQueryData(['shopping-lists', 'full-data', shoppingListId], (oldData: ShoppingListFullData | undefined) => {
        if (!oldData) return oldData;
        
        const updatedItems = oldData.items?.map((item: IItem) => {
          if (item._id === itemId) {
            return {
              ...item,
              status: (Math.max(0, (item.purchasedQuantity || 0) - (quantityToUnpurchase || 0)) === 0 ? 'pending' : 'partially_purchased') as IItem['status'],
              isPurchased: false,
              isPartiallyPurchased: (Math.max(0, (item.purchasedQuantity || 0) - (quantityToUnpurchase || 0)) > 0 ? true : false),
              purchasedQuantity: Math.max(0, (item.purchasedQuantity || 0) - (quantityToUnpurchase || 0)),
              remainingQuantity: Math.max(0, item.quantity - (item.purchasedQuantity || 0) + (quantityToUnpurchase || 0)),
            };
          }
          return item;
        }) || oldData.items || [];
        
        const updatedStats = oldData.stats ? {
          ...oldData.stats,
          purchasedItems: updatedItems.filter((item) => item.status === 'purchased').length,
          remainingItems: updatedItems.filter((item) => item.status !== 'purchased').length,
          progress: updatedItems.length > 0 ? Math.round((updatedItems.filter((item) => item.status === 'purchased').length / updatedItems.length) * 100) : 0
        } : oldData.stats;
        
        return {
          ...oldData,
          items: updatedItems,
          stats: updatedStats
        };
      });
      
      showSuccess('items.unpurchaseSuccess');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useMarkItemNotAvailable = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: ({ itemId }: { itemId: string }) => 
      apiClient.markItemNotAvailable(itemId),
    onSuccess: (data, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
      showSuccess('items.notAvailableSuccess');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useUpdateItemQuantity = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => 
      apiClient.updateItemQuantity(itemId, quantity),
    onSuccess: (data, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
      showSuccess('items.quantityUpdateSuccess');
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};

export const useAvailableCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.getAvailableCategories()
      return response.data || [];
    },
  });
};

export const useAvailableUnits = () => {
  return useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const response = await apiClient.getAvailableUnits()
      return response.data || [];
    },
  });
}; 

export const useAllSubCategories = () => {
  return useQuery({
    queryKey: ['subCategories', 'all'],
    queryFn: async () => {
      const response = await apiClient.get('/sub-categories/active');
      return response?.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useSubCategoriesByCategory = (categoryId?: string | null, enabled: boolean = false) => {
  const { data: allSubCategories = [], isLoading } = useAllSubCategories();
  
  const subCategories = useMemo(() => {
    if (!enabled || !categoryId) return [];
    return allSubCategories.filter((sc: ISubCategory) => {
      const scCategoryId = typeof sc.categoryId === 'string' 
        ? sc.categoryId 
        : (typeof sc.categoryId === 'object' && sc.categoryId !== null && '_id' in sc.categoryId 
          ? (sc.categoryId as { _id: string })._id 
          : undefined);
      return scCategoryId === categoryId;
    });
  }, [allSubCategories, categoryId, enabled]);

  return {
    data: subCategories,
    isLoading,
  };
};
