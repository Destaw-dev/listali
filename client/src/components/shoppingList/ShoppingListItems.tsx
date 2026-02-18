"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  useAvailableCategories,
  usePurchaseItem,
  useUnpurchaseItem,
  useUpdateItem,
  useDeleteItem,
} from "../../hooks/useItems";
import { CheckCircle, ShoppingBag } from "lucide-react";
import { ConfirmDialog, LoadingSpinner } from "../common";
import { CategorySection } from "./items/CategorySection";
import { PurchaseQuantityModal } from "./items/PurchaseQuantityModal";
import { ProductDetailsModal } from "./items/ProductDetailsModal";
import { EditItemModal } from "./items/EditItemModal";
import { ICategory, IItem } from "../../types";
import { UnpurchaseQuantityModal } from "./items/UnpurchaseQuantityModal";
import { PurchaseAllButton } from "./PurchaseAllButton";
import { usePurchaseAllItems } from "../../hooks/usePurchaseAllItems";

interface ShoppingListItemsProps {
  items: IItem[];
  listId: string;
  groupId: string;
  loading: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const ShoppingListItems = memo(function ShoppingListItems({
  items,
  listId,
  groupId,
  loading,
  canEdit = false,
  canDelete = false,
}: ShoppingListItemsProps) {
  const tItems = useTranslations("ShoppingListItems");
  const tCommon = useTranslations("common");

  const purchaseItemMutation = usePurchaseItem();
  const unpurchaseItemMutation = useUnpurchaseItem();
  const updateItemMutation = useUpdateItem();
  const deleteItemMutation = useDeleteItem();
  const purchaseAllItemsMutation = usePurchaseAllItems();
  const { data: categories = [] } = useAvailableCategories();

  const [purchaseModalItem, setPurchaseModalItem] = useState<IItem | null>(null);
  const [unpurchaseModalItem, setUnpurchaseModalItem] = useState<IItem | null>(null);
  const [productPreview, setProductPreview] = useState<IItem | null>(null);
  const [editModalItem, setEditModalItem] = useState<IItem | null>(null);
  const [itemIdToDelete, setItemIdToDelete] = useState<string | null>(null);
  const [undoState, setUndoState] = useState<Array<{ itemId: string; purchasedQuantity: number; checked: boolean }> | null>(null);

  const isItemLoading = useCallback(
    (itemId: string) =>
      (purchaseItemMutation.isPending &&
        itemId === purchaseItemMutation.variables?.itemId) ||
      (unpurchaseItemMutation.isPending &&
        itemId === unpurchaseItemMutation.variables?.itemId) ||
      (updateItemMutation.isPending &&
        itemId === updateItemMutation.variables?.itemId) ||
      (deleteItemMutation.isPending &&
        itemId === deleteItemMutation.variables?.itemId),
    [
      purchaseItemMutation.isPending,
      purchaseItemMutation.variables?.itemId,
      unpurchaseItemMutation.isPending,
      unpurchaseItemMutation.variables?.itemId,
      updateItemMutation.isPending,
      updateItemMutation.variables?.itemId,
      deleteItemMutation.isPending,
      deleteItemMutation.variables?.itemId,
    ]
  );

  // const isQuantityUpdating = useCallback(
  //   (itemId: string) =>
  //     updateItemMutation.isPending &&
  //     itemId === updateItemMutation.variables?.itemId,
  //   [
  //     updateItemMutation.isPending,
  //     updateItemMutation.variables?.itemId,
  //   ]
  // );

  const handlePurchase = useCallback(
   async (itemId: string, quantityToPurchase?: number) => {
      
      if (isItemLoading(itemId) || quantityToPurchase === undefined || quantityToPurchase <= 0) return;

   await purchaseItemMutation.mutateAsync({
      itemId,
      shoppingListId: listId,
      groupId,
      quantityToPurchase,
    });
    setPurchaseModalItem(null);
    },
    [groupId, isItemLoading, listId, purchaseItemMutation]
  );

  const handleUnpurchase = useCallback(
    async (item:IItem, quantityToUnpurchase?: number) => {
      if (isItemLoading(item._id)) return;

   await unpurchaseItemMutation.mutateAsync({
      itemId: item._id,
      shoppingListId: listId,
      groupId,
      quantityToUnpurchase,
    });
    setUnpurchaseModalItem(null);
    },
    [groupId, isItemLoading, listId, unpurchaseItemMutation, setUnpurchaseModalItem]
  );

  const handleEditItem = useCallback(
    (item: IItem) => {
      setEditModalItem(item);
    },
    []
  );

  const handleUpdateItem = useCallback(
    async (itemData: {
      name?: string;
      quantity?: number;
      unit?: string;
      category?: string;
      brand?: string;
      priority?: 'low' | 'medium' | 'high';
      notes?: string;
    }) => {
      if (!editModalItem?._id) return;
      
      await updateItemMutation.mutateAsync({
        itemId: editModalItem._id,
        shoppingListId: listId,
        itemData,
      });
      setEditModalItem(null);
    },
    [editModalItem, updateItemMutation]
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      setItemIdToDelete(itemId);
    },
    []
  );

  const handleConfirmDeleteItem = useCallback(() => {
    if (!itemIdToDelete) return;
    deleteItemMutation.mutate(
      {
        itemId: itemIdToDelete,
        shoppingListId: listId,
      },
      {
        onSettled: () => setItemIdToDelete(null),
      }
    );
  }, [deleteItemMutation, itemIdToDelete, listId]
  );

  const handlePurchaseAll = useCallback(async () => {
    const result = await purchaseAllItemsMutation.mutateAsync({
      items,
      shoppingListId: listId,
      groupId,
    });
    setUndoState(result.previousStates);
  }, [purchaseAllItemsMutation, items, listId, groupId]);

  const handleUndoPurchaseAll = useCallback(async () => {
    if (!undoState) return;
    
    const unpurchasePromises = undoState.map(async (state) => {
      const item = items.find((i) => i._id === state.itemId);
      if (!item) return;
      
      const currentPurchased = item.purchasedQuantity || 0;
      const quantityToUnpurchase = currentPurchased - state.purchasedQuantity;
      
      if (quantityToUnpurchase > 0) {
        await unpurchaseItemMutation.mutateAsync({
          itemId: state.itemId,
          shoppingListId: listId,
          groupId,
          quantityToUnpurchase,
        });
      }
    });
    
    await Promise.all(unpurchasePromises);
    setUndoState(null);
  }, [undoState, items, unpurchaseItemMutation, listId, groupId]);

  const unpurchasedCount = useMemo(() => {
    return items.filter((item) => {
      const totalQty = item.quantity || 1;
      const purchasedQty = item.purchasedQuantity || 0;
      return !item.isPurchased && purchasedQty < totalQty;
    }).length;
  }, [items]);

  const groupedItems = useMemo(() => {
    const purchased: Record<
      string,
      { categoryId: string; categoryName: string; items: IItem[] }
    > = {};
    const unpurchased: Record<
      string,
      { categoryId: string; categoryName: string; items: IItem[] }
    > = {};

    items.forEach((item) => {
      const categoryId = typeof item.category === 'string' 
        ? item.category 
        : (item.category as { _id?: string } | undefined)?._id || "no-category";
      const categoryName =
        (typeof item.category === 'object' && item.category !== null && 'name' in item.category
          ? (item.category as { name?: string }).name
          : undefined) ||
        categories.find((c: ICategory) => c._id === categoryId)?.name ||
        tItems("noCategory");
      
      const target = (item.status === 'purchased' || item.isPurchased) ? purchased : unpurchased;
      
      if (!target[categoryId]) {
        target[categoryId] = {
          categoryId,
          categoryName,
          items: [],
        };
      }
      
      target[categoryId].items.push(item);
    });

    const sortCategories = (
      map: Record<
        string,
        { categoryId: string; categoryName: string; items: IItem[] }
      >
    ) =>
      Object.values(map).sort((a, b) =>
        a.categoryName.localeCompare(b.categoryName, "he")
      );

    return {
      purchased: sortCategories(purchased),
      unpurchased: sortCategories(unpurchased),
    };
  }, [categories, items, tItems]);
  
  if (loading) {
    return (
      <div className="rounded-3xl bg-card p-12 text-center shadow-xl">
        <LoadingSpinner />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-3xl bg-card p-12 text-center shadow-xl">
        <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-text-muted" />
        <h3 className="mb-2 text-lg font-semibold text-text-primary">
          {tItems("noItems")}
        </h3>
        <p className="text-text-muted">{tItems("addItemsMessage")}</p>
      </div>
    );
  }

    return (
    <>
      <div className="rounded-3xl bg-card px-3 py-6 shadow-xl sm:px-6">
        <header className=" flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {tItems("listItems")} <span className="text-sm text-text-muted">({items.length} {tItems("items")})</span>
            </h2>
          </div>
          <PurchaseAllButton
            onPurchaseAll={handlePurchaseAll}
            unpurchasedCount={unpurchasedCount}
            isLoading={purchaseAllItemsMutation.isPending}
            showUndo={!!undoState}
            setUndoState={setUndoState}
            onUndo={handleUndoPurchaseAll}
          />
        </header>

        <div>
          {groupedItems.unpurchased.length > 0 && (
            <CategorySection
              title={tItems("unpurchasedItems")}
              icon={<ShoppingBag className="h-5 w-5 text-primary" />}
              groups={groupedItems.unpurchased}
              onOpenPurchaseModal={(item) => setPurchaseModalItem(item)}
              onUnpurchase={(item) => setUnpurchaseModalItem(item)}
              onPreview={(item) => setProductPreview(item)}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              canEdit={canEdit}
              canDelete={canDelete}
              isItemLoading={isItemLoading}
            />
          )}

          {groupedItems.purchased.length > 0 && (
            <CategorySection
              title={tItems("purchasedItems")}
              icon={<CheckCircle className="h-5 w-5 text-success" />}
              groups={groupedItems.purchased}
              onOpenPurchaseModal={(item) => setPurchaseModalItem(item)}
              onUnpurchase={(item) => setUnpurchaseModalItem(item)}
              onPreview={(item) => setProductPreview(item)}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              canEdit={canEdit}
              canDelete={canDelete}
              isItemLoading={isItemLoading}
              defaultOpen={false}
              tone="purchased"
            />
          )}
        </div>
      </div>

      <PurchaseQuantityModal
        item={purchaseModalItem}
        isLoading={purchaseItemMutation.isPending}
        onClose={() => setPurchaseModalItem(null)}
        onConfirm={(quantity) => {
          if (purchaseModalItem?._id) {
            handlePurchase(purchaseModalItem._id, quantity);
          }
        }}
        tItems={tItems}
      />

      <UnpurchaseQuantityModal
        item={unpurchaseModalItem}
        isLoading={unpurchaseItemMutation.isPending}
        onClose={() => setUnpurchaseModalItem(null)}
        onConfirm={(quantity) => {
          if (unpurchaseModalItem?._id) {
            handleUnpurchase(unpurchaseModalItem, quantity);
          }
        }}
        tItems={tItems}
      />

      <ProductDetailsModal
        item={productPreview}
        onClose={() => setProductPreview(null)}
        tItems={tItems}
        tCommon={tCommon}
      />

      <EditItemModal
        item={editModalItem}
        onClose={() => setEditModalItem(null)}
        onSubmit={handleUpdateItem}
        isLoading={updateItemMutation.isPending}
      />

      <ConfirmDialog
        isOpen={Boolean(itemIdToDelete)}
        onClose={() => !deleteItemMutation.isPending && setItemIdToDelete(null)}
        onConfirm={handleConfirmDeleteItem}
        title={tCommon("delete")}
        message={tItems("deleteConfirm")}
        confirmText={tCommon("delete")}
        cancelText={tCommon("cancel")}
        variant="danger"
        isLoading={deleteItemMutation.isPending}
      />
      </>
    );
  });
