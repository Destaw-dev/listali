import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { GuestList, GuestItem } from '../types';
import { GUEST_LIMITS } from '../constants/guestLimits';
import { notifyStorageChange } from '../hooks/useStorageMonitor';

interface GuestListsStore {
  lists: GuestList[];
  
  createList: (data: { title: string; description?: string; priority?: 'low' | 'medium' | 'high'; status?: 'active' | 'completed' | 'archived' } | string) => GuestList;
  updateList: (listId: string, updates: Partial<Pick<GuestList, 'title' | 'description' | 'priority' | 'status'>>) => void;
  deleteList: (listId: string) => void;
  getList: (listId: string) => GuestList | undefined;
  
  addItem: (listId: string, name: string, quantity?: number, unit?: string, categoryId?: string, brand?: string, image?: string, notes?: string, productId?: string) => GuestItem;
  toggleItem: (listId: string, itemId: string) => void;
  removeItem: (listId: string, itemId: string) => void;
  updateItem: (listId: string, itemId: string, updates: Partial<Pick<GuestItem, 'name' | 'quantity' | 'unit' | 'categoryId' | 'notes' | 'brand'>>) => void;
  purchaseItem: (listId: string, itemId: string, quantityToPurchase?: number) => void;
  unpurchaseItem: (listId: string, itemId: string, quantityToUnpurchase?: number) => void;
  purchaseAllItems: (listId: string) => { itemIds: string[]; previousStates: Array<{ itemId: string; purchasedQuantity: number; checked: boolean }> };
  undoPurchaseAll: (listId: string, previousStates: Array<{ itemId: string; purchasedQuantity: number; checked: boolean }>) => void;
  
  clearAllLists: () => void;
  getListsCount: () => number;
  getItemsCount: (listId: string) => number;
}

const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useGuestListsStore = create<GuestListsStore>()(
  devtools(
    persist(
      (set, get) => ({
        lists: [],

        createList: (data: { title: string; description?: string; priority?: 'low' | 'medium' | 'high'; status?: 'active' | 'completed' | 'archived' } | string) => {
          const state = get();
          
          if (state.lists.length >= GUEST_LIMITS.MAX_LISTS) {
            throw new Error(`${GUEST_LIMITS.MAX_LISTS} guest lists limit reached`);
          }
          
          const listData = typeof data === 'string' 
            ? { title: data }
            : data;
          
          const now = new Date();
          const newList: GuestList = {
            id: generateId(),
            title: listData.title.trim().slice(0, 100),
            description: listData.description?.trim(),
            priority: listData.priority || 'medium',
            status: listData.status || 'active',
            items: [],
            createdAt: now,
            updatedAt: now,
          };
          
          set((state) => ({
            lists: [...state.lists, newList],
          }));
          
          notifyStorageChange();
          return newList;
        },

        updateList: (listId: string, updates: Partial<Pick<GuestList, 'title' | 'description' | 'priority' | 'status'>>) => {
          set((state) => ({
            lists: state.lists.map((list) =>
              list.id === listId
                ? {
                    ...list,
                    ...(updates.title !== undefined && { title: updates.title.trim().slice(0, 100) }),
                    ...(updates.description !== undefined && { description: updates.description?.trim() }),
                    ...(updates.priority !== undefined && { priority: updates.priority }),
                    ...(updates.status !== undefined && { status: updates.status }),
                    updatedAt: new Date(),
                  }
                : list
            ),
          }));
          notifyStorageChange();
        },

        deleteList: (listId: string) => {
          set((state) => ({
            lists: state.lists.filter((list) => list.id !== listId),
          }));
          notifyStorageChange();
        },

        getList: (listId: string) => {
          return get().lists.find((list) => list.id === listId);
        },

        addItem: (listId: string, name: string, quantity: number = 1, unit?: string, categoryId?: string, brand?: string, image?: string, notes?: string, product?: string) => {
          const state = get();
          const list = state.lists.find((l) => l.id === listId);
          
          if (!list) {
            throw new Error('List not found');
          }
          
          if (list.items.length >= GUEST_LIMITS.MAX_ITEMS_PER_LIST) {
            throw new Error(`${GUEST_LIMITS.MAX_ITEMS_PER_LIST} items per list limit reached`);
          }
          
          const newItem: GuestItem = {
            id: generateId(),
            name: name.trim().slice(0, 100),
            quantity: Math.max(1, Math.floor(quantity)),
            checked: false,
            createdAt: new Date(),
            unit: unit || 'piece',
            categoryId: categoryId,
            brand: brand,
            image: image,
            notes: notes,
            productId: product,
          };

          
          set((state) => ({
            lists: state.lists.map((l) =>
              l.id === listId
                ? {
                    ...l,
                    items: [...l.items, newItem],
                    updatedAt: new Date(),
                  }
                : l
            ),
          }));
          
          notifyStorageChange();
          return newItem;
        },

        toggleItem: (listId: string, itemId: string) => {
          set((state) => ({
            lists: state.lists.map((list) =>
              list.id === listId
                ? {
                    ...list,
                    items: list.items.map((item) =>
                      item.id === itemId
                        ? { ...item, checked: !item.checked }
                        : item
                    ),
                    updatedAt: new Date(),
                  }
                : list
            ),
          }));
          notifyStorageChange();
        },

        removeItem: (listId: string, itemId: string) => {
          set((state) => ({
            lists: state.lists.map((list) =>
              list.id === listId
                ? {
                    ...list,
                    items: list.items.filter((item) => item.id !== itemId),
                    updatedAt: new Date(),
                  }
                : list
            ),
          }));
          notifyStorageChange();
        },

        updateItem: (listId: string, itemId: string, updates: Partial<Pick<GuestItem, 'name' | 'quantity' | 'unit' | 'categoryId' | 'notes' | 'brand'>>) => {
          set((state) => ({
            lists: state.lists.map((list) =>
              list.id === listId
                ? {
                    ...list,
                    items: list.items.map((item) =>
                      item.id === itemId
                        ? {
                            ...item,
                            ...(updates.name && { name: updates.name.trim().slice(0, 100) }),
                            ...(updates.quantity !== undefined && { quantity: Math.max(1, Math.floor(updates.quantity)) }),
                            ...(updates.unit !== undefined && { unit: updates.unit }),
                            ...(updates.categoryId !== undefined && { categoryId: updates.categoryId }),
                            ...(updates.notes !== undefined && { notes: updates.notes }),
                            ...(updates.brand !== undefined && { brand: updates.brand }),
                          }
                        : item
                    ),
                    updatedAt: new Date(),
                  }
                : list
            ),
          }));
          notifyStorageChange();
        },

        purchaseItem: (listId: string, itemId: string, quantityToPurchase?: number) => {
          set((state) => {
            const list = state.lists.find((l) => l.id === listId);
            if (!list) return state;

            return {
              lists: state.lists.map((l) => {
                if (l.id !== listId) return l;

                return {
                  ...l,
                  items: l.items.map((item) => {
                    if (item.id !== itemId) return item;

                    const totalQty = item.quantity || 1;
                    const currentPurchased = item.purchasedQuantity || 0;
                    const qtyToPurchase = quantityToPurchase ?? totalQty;
                    const newPurchasedQty = Math.min(currentPurchased + qtyToPurchase, totalQty);
                    const isFullyPurchased = newPurchasedQty >= totalQty;
                    const purchasedAt = isFullyPurchased ? new Date() : null;

                    return {
                      ...item,
                      purchasedQuantity: newPurchasedQty,
                      checked: isFullyPurchased,
                      purchasedAt: purchasedAt,
                    };
                  }),
                  updatedAt: new Date(),
                };
              }),
            };
          });
          notifyStorageChange();
        },

        unpurchaseItem: (listId: string, itemId: string, quantityToUnpurchase?: number) => {
          set((state) => {
            const list = state.lists.find((l) => l.id === listId);
            if (!list) return state;

            return {
              lists: state.lists.map((l) => {
                if (l.id !== listId) return l;

                return {
                  ...l,
                  items: l.items.map((item) => {
                    if (item.id !== itemId) return item;

                    const currentPurchased = item.purchasedQuantity || 0;
                    const totalQty = item.quantity || 1;
                    const qtyToUnpurchase = quantityToUnpurchase ?? currentPurchased;
                    const newPurchasedQty = Math.max(0, currentPurchased - qtyToUnpurchase);
                    const purchasedAt = newPurchasedQty > 0 && newPurchasedQty < totalQty ? new Date() : null;

                    return {
                      ...item,
                      purchasedQuantity: newPurchasedQty,
                      checked: newPurchasedQty > 0 && newPurchasedQty >= totalQty,
                      purchasedAt: purchasedAt,
                    };
                  }),
                  updatedAt: new Date(),
                };
              }),
            };
          });
          notifyStorageChange();
        },

        purchaseAllItems: (listId: string) => {
          const state = get();
          const list = state.lists.find((l) => l.id === listId);
          if (!list) {
            return { itemIds: [], previousStates: [] };
          }

          const previousStates = list.items
            .filter((item) => {
              const totalQty = item.quantity || 1;
              const purchasedQty = item.purchasedQuantity || 0;
              return !item.checked && purchasedQty < totalQty;
            })
            .map((item) => ({
              itemId: item.id,
              purchasedQuantity: item.purchasedQuantity || 0,
              checked: item.checked,
            }));

          const itemIds = previousStates.map((s) => s.itemId);

          set((state) => ({
            lists: state.lists.map((l) => {
              if (l.id !== listId) return l;

              return {
                ...l,
                items: l.items.map((item) => {
                  const totalQty = item.quantity || 1;
                  const purchasedQty = item.purchasedQuantity || 0;
                  const isUnpurchased = !item.checked && purchasedQty < totalQty;
                  const purchasedAt = isUnpurchased ? new Date() : null;

                  if (isUnpurchased) {
                    return {
                      ...item,
                      purchasedQuantity: totalQty,
                      checked: true,
                      purchasedAt: purchasedAt,
                    };
                  }
                  return item;
                }),
                updatedAt: new Date(),
              };
            }),
          }));

          notifyStorageChange();
          return { itemIds, previousStates };
        },

        undoPurchaseAll: (listId: string, previousStates: Array<{ itemId: string; purchasedQuantity: number; checked: boolean }>) => {
          set((state) => ({
            lists: state.lists.map((l) => {
              if (l.id !== listId) return l;

              return {
                ...l,
                items: l.items.map((item) => {
                  const previousState = previousStates.find((s) => s.itemId === item.id);
                  const purchasedAt = previousState?.checked ? new Date() : null;
                  if (previousState) {
                    return {
                      ...item,
                      purchasedQuantity: previousState.purchasedQuantity,
                      checked: previousState.checked,
                      purchasedAt: purchasedAt,
                    };
                  }
                  return item;
                }),
                updatedAt: new Date(),
              };
            }),
          }));

          notifyStorageChange();
        },

        clearAllLists: () => {
          set({ lists: [] });
          notifyStorageChange();
        },

        getListsCount: () => {
          return get().lists.length;
        },

        getItemsCount: (listId: string) => {
          const list = get().lists.find((l) => l.id === listId);
          return list?.items.length ?? 0;
        },
      }),
      {
        name: 'guest-lists-storage',
        partialize: (state) => ({ lists: state.lists }),
      }
    )
  )
);
