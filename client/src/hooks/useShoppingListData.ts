"use client";
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { IShoppingList, IItem, IShoppingSessionData } from '../types';

interface ShoppingListData {
  shoppingList: IShoppingList | null;
  items: IItem[];
  shoppingSession: IShoppingSessionData | null;
  isLoading: boolean;
  error: Error | null;
  purchasedItems: number;
  totalItems: number;
}

export function useShoppingListData(listId: string): ShoppingListData {
  const apiClient = new ApiClient();
  const { authReady, accessToken } = useAuthStore();
  
  const {
    data: fullData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['shopping-lists', 'full-data', listId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/shopping-lists/${listId}?include=items,stats,session`);
        return response?.data?.data || response?.data || response; 
      } catch (error) {
        console.error('🚨 [useShoppingListData] Error fetching unified data:', error);
        return null;
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: authReady && !!accessToken && !!listId,
  });

  const shoppingList = fullData?.shoppingList || null;
  const items = fullData?.items || [];
  const shoppingSession = fullData?.shoppingSession || null;
  const stats = fullData?.stats || { totalItems: 0, purchasedItems: 0 };

  const purchasedItems = stats.purchasedItems || 0;
  const totalItems = stats.totalItems || 0;

  return {
    shoppingList,
    items: Array.isArray(items) ? items : [],
    shoppingSession,
    isLoading,
    error,
    purchasedItems,
    totalItems,
  };
}
