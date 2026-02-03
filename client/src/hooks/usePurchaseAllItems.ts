"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotification } from "../contexts/NotificationContext";
import { apiClient } from "../lib/api";
import { IItem } from "../types";
import { itemKeys } from "./useItems";
import { shoppingListKeys } from "./useShoppingLists";

interface PurchaseAllItemsParams {
  items: IItem[];
  shoppingListId: string;
  groupId: string;
}

interface PreviousItemState {
  itemId: string;
  purchasedQuantity: number;
  checked: boolean;
}

export const usePurchaseAllItems = () => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async ({ items, shoppingListId, groupId }: PurchaseAllItemsParams) => {
      const unpurchasedItems = items.filter((item) => {
        const totalQty = item.quantity || 1;
        const purchasedQty = item.purchasedQuantity || 0;
        return !item.isPurchased && purchasedQty < totalQty;
      });

      if (unpurchasedItems.length === 0) {
        return { previousStates: [], itemIds: [] };
      }

      const previousStates: PreviousItemState[] = unpurchasedItems.map((item) => ({
        itemId: item._id,
        purchasedQuantity: item.purchasedQuantity || 0,
        checked: item.isPurchased || false,
      }));

      const itemIds = unpurchasedItems.map((item) => item._id);
      await apiClient.batchPurchaseItems(itemIds, shoppingListId);

      return { previousStates, itemIds };
    },
    onSuccess: (data, { shoppingListId, groupId }) => {
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.detail(shoppingListId) });
      queryClient.invalidateQueries({ queryKey: shoppingListKeys.list(groupId) });
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data', shoppingListId] });

      showSuccess('items.purchaseAllSuccess', { count: String(data.previousStates.length) });
    },
    onError: (error: Error) => {
      handleApiError(error);
    },
  });
};
