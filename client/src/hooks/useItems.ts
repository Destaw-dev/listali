import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { shoppingListKeys } from './useShoppingLists';

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
  return useQuery({
    queryKey: itemKeys.list(shoppingListId),
    queryFn: async () => {
      const response = await apiClient.getItems(shoppingListId, options)
      return response.data || [];
    },
    enabled: !!shoppingListId,
  });
};

export const useItem = (itemId: string) => {
  return useQuery({
    queryKey: itemKeys.detail(itemId),
    queryFn: () => apiClient.getItemById(itemId),
    enabled: !!itemId,
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
      // Ensure category is string, not empty object
      const cleanData = {
        ...itemData,
        category: itemData.category || '',
      };
      return apiClient.createItem(cleanData);
    },
    onSuccess: (data, variables) => {
      const shoppingListId = variables.shoppingListId;
      // Invalidate items list
      queryClient.invalidateQueries({ queryKey: itemKeys.list(shoppingListId) });
      // Invalidate shopping list full data to update the list
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data', shoppingListId] });
      showSuccess('items.createSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

export const useCreateMultipleItems = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: (items: Array<{
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
    }>) => apiClient.createMultipleItems(items),
    onSuccess: (data, variables) => {
      const shoppingListId = variables[0]?.shoppingListId;
      if (shoppingListId) {
        // Invalidate items list
        queryClient.invalidateQueries({ queryKey: itemKeys.list(shoppingListId) });
        // Invalidate shopping list full data to update the list
        queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data', shoppingListId] });
        showSuccess('items.createMultipleSuccess');
      }
    },
    onError: (error: any) => {
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
    onSuccess: (data, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
      // Invalidate shopping list full data to update the list
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data'] });
      showSuccess('items.updateSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: ({ itemId, shoppingListId }: { itemId: string; shoppingListId: string }) => 
      apiClient.deleteItem(itemId),
    onSuccess: (data, { shoppingListId }) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.list(shoppingListId) });
      showSuccess('items.deleteSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

export const usePurchaseItem = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: ({ itemId, shoppingListId, groupId, purchasedQuantity, actualPrice }: { 
      itemId: string; 
      shoppingListId: string; 
      groupId: string;
      purchasedQuantity?: number;
      actualPrice?: number;
    }) => 
      apiClient.purchaseItem(itemId, { purchasedQuantity, actualPrice }),
    onSuccess: (data, { itemId, shoppingListId, groupId, purchasedQuantity }) => {
      queryClient.setQueryData(['shopping-lists', 'full-data', shoppingListId], (oldData: any) => {
        if (!oldData) return oldData;
        
        const updatedItems = oldData.items?.map((item: any) => {
          if (item._id === itemId) {
            const purchasedQty = purchasedQuantity !== undefined ? purchasedQuantity : item.quantity;
            const isFullyPurchased = purchasedQty >= item.quantity;
            return {
              ...item,
              status: isFullyPurchased ? 'purchased' : 'pending',
              isPurchased: isFullyPurchased,
              isPartiallyPurchased: purchasedQty > 0 && purchasedQty < item.quantity,
              purchasedQuantity: purchasedQty,
              remainingQuantity: Math.max(0, item.quantity - purchasedQty),
            };
          }
          return item;
        }) || oldData.items;
        
        const updatedStats = oldData.stats ? {
          ...oldData.stats,
          purchasedItems: updatedItems.filter((item: any) => item.status === 'purchased').length,
          remainingItems: updatedItems.filter((item: any) => item.status !== 'purchased').length,
          progress: updatedItems.length > 0 ? Math.round((updatedItems.filter((item: any) => item.status === 'purchased').length / updatedItems.length) * 100) : 0
        } : oldData.stats;
        
        return {
          ...oldData,
          items: updatedItems,
          stats: updatedStats
        };
      });
      
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
      queryClient.invalidateQueries({ queryKey: itemKeys.list(shoppingListId) });
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.detail(shoppingListId) });
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.list(groupId) });
      
      showSuccess('items.purchaseSuccess');
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });
};

// Unpurchase item
export const useUnpurchaseItem = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();
  
  return useMutation({
    mutationFn: ({ itemId, shoppingListId, groupId }: { itemId: string; shoppingListId: string; groupId: string }) => 
      apiClient.unpurchaseItem(itemId),
    onSuccess: (data, { itemId, shoppingListId, groupId }) => {
      queryClient.setQueryData(['shopping-lists', 'full-data', shoppingListId], (oldData: any) => {
        if (!oldData) return oldData;
        
        const updatedItems = oldData.items?.map((item: any) => {
          if (item._id === itemId) {
            return {
              ...item,
              status: 'pending',
              isPurchased: false,
              isPartiallyPurchased: false,
              purchasedQuantity: 0,
              remainingQuantity: item.quantity,
            };
          }
          return item;
        }) || oldData.items;
        
        const updatedStats = oldData.stats ? {
          ...oldData.stats,
          purchasedItems: updatedItems.filter((item: any) => item.status === 'purchased').length,
          remainingItems: updatedItems.filter((item: any) => item.status !== 'purchased').length,
          progress: updatedItems.length > 0 ? Math.round((updatedItems.filter((item: any) => item.status === 'purchased').length / updatedItems.length) * 100) : 0
        } : oldData.stats;
        
        return {
          ...oldData,
          items: updatedItems,
          stats: updatedStats
        };
      });
      
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
      queryClient.invalidateQueries({ queryKey: itemKeys.list(shoppingListId) });
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.detail(shoppingListId) });
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.list(groupId) });
      
      showSuccess('items.unpurchaseSuccess');
    },
    onError: (error: any) => {
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
    onError: (error: any) => {
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
    onError: (error: any) => {
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

// All subcategories (loaded once, filtered client-side)
export const useAllSubCategories = () => {
  return useQuery({
    queryKey: ['subCategories', 'all'],
    queryFn: async () => {
      const response = await apiClient.get('/sub-categories/active');
      return response?.data?.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - subcategories don't change often
  });
};

// Subcategories by category (client-side filtered from all subcategories)
export const useSubCategoriesByCategory = (categoryId?: string | null, enabled: boolean = false) => {
  const { data: allSubCategories = [], isLoading } = useAllSubCategories();
  
  const subCategories = useMemo(() => {
    if (!enabled || !categoryId) return [];
    return allSubCategories.filter((sc: any) => {
      const scCategoryId = typeof sc.categoryId === 'string' ? sc.categoryId : sc.categoryId?._id || sc.categoryId;
      return scCategoryId === categoryId;
    });
  }, [allSubCategories, categoryId, enabled]);

  return {
    data: subCategories,
    isLoading,
  };
};