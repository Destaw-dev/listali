"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  useAvailableCategories,
  usePurchaseItem,
  useUnpurchaseItem,
  useUpdateItem,
} from "@/hooks/useItems";
import { CheckCircle, ShoppingBag } from "lucide-react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { CategorySection } from "./items/CategorySection";
import { PurchaseQuantityModal } from "./items/PurchaseQuantityModal";
import { ProductDetailsModal } from "./items/ProductDetailsModal";

interface ShoppingListItemsProps {
  items: any[];
  listId: string;
  groupId: string;
  loading: boolean;
  onEditItem?: (item: any) => void;
}

export const ShoppingListItems = memo(function ShoppingListItems({
  items,
  listId,
  groupId,
  loading,
  onEditItem,
}: ShoppingListItemsProps) {
  const tItems = useTranslations("ShoppingListItems");
  const tCommon = useTranslations("common");

  const purchaseItemMutation = usePurchaseItem();
  const unpurchaseItemMutation = useUnpurchaseItem();
  const updateItemMutation = useUpdateItem();
  const { data: categories = [] } = useAvailableCategories();

  const [purchaseModalItem, setPurchaseModalItem] = useState<any | null>(null);
  const [productPreview, setProductPreview] = useState<any | null>(null);

  const isItemLoading = useCallback(
    (itemId: string) =>
      (purchaseItemMutation.isPending &&
        itemId === purchaseItemMutation.variables?.itemId) ||
      (unpurchaseItemMutation.isPending &&
        itemId === unpurchaseItemMutation.variables?.itemId),
    [
      purchaseItemMutation.isPending,
      purchaseItemMutation.variables?.itemId,
      unpurchaseItemMutation.isPending,
      unpurchaseItemMutation.variables?.itemId,
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
    (itemId: string, purchasedQuantity?: number) => {
      if (isItemLoading(itemId)) return;

    purchaseItemMutation.mutateAsync({
      itemId,
      shoppingListId: listId,
      groupId,
      purchasedQuantity,
    });
    },
    [groupId, isItemLoading, listId, purchaseItemMutation]
  );

  const handleUnpurchase = useCallback(
    (itemId: string) => {
      if (isItemLoading(itemId)) return;

    unpurchaseItemMutation.mutateAsync({
      itemId,
      shoppingListId: listId,
      groupId,
    });
    },
    [groupId, isItemLoading, listId, unpurchaseItemMutation]
  );

  // const handleUpdateQuantity = useCallback(
  //   (itemId: string, quantity: number) => {
  //     if (quantity <= 0 || isQuantityUpdating(itemId)) return;
  //     updateItemMutation.mutateAsync({
  //       itemId,
  //       itemData: { quantity },
  //     });
  //   },
  //   [isQuantityUpdating, updateItemMutation]
  // );

  const groupedItems = useMemo(() => {
    const purchased: Record<
      string,
      { categoryId: string; categoryName: string; items: any[] }
    > = {};
    const unpurchased: Record<
      string,
      { categoryId: string; categoryName: string; items: any[] }
    > = {};

    items.forEach((item: any) => {
      const categoryId = item.category?._id || item.category || "no-category";
      const categoryName =
        item.category?.name ||
        categories.find((c: any) => c._id === categoryId)?.name ||
        tItems("noCategory");
      
      const target = item.isPurchased ? purchased : unpurchased;
      
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
        { categoryId: string; categoryName: string; items: any[] }
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
              {tItems("listItems")}
            </h2>
            <p className="text-sm text-text-muted">
              {items.length} {tItems("items")}
            </p>
          </div>
        </header>

        <div className="">
          {groupedItems.unpurchased.length > 0 && (
            <CategorySection
              title={tItems("unpurchasedItems")}
              icon={<ShoppingBag className="h-5 w-5 text-primaryT-500" />}
              groups={groupedItems.unpurchased}
              onOpenPurchaseModal={(item) => setPurchaseModalItem(item)}
              onUnpurchase={handleUnpurchase}
              onPreview={(item) => setProductPreview(item)}
              onEdit={onEditItem}
              isItemLoading={isItemLoading}
            />
          )}

          {groupedItems.purchased.length > 0 && (
            <CategorySection
              title={tItems("purchasedItems")}
              icon={<CheckCircle className="h-5 w-5 text-success-600" />}
              groups={groupedItems.purchased}
              onOpenPurchaseModal={(item) => setPurchaseModalItem(item)}
              onUnpurchase={handleUnpurchase}
              onPreview={(item) => setProductPreview(item)}
              onEdit={onEditItem}
              isItemLoading={isItemLoading}
              defaultOpen={false}
              tone="purchased"
            />
          )}
        </div>
      </div>

      <PurchaseQuantityModal
        item={purchaseModalItem}
        onClose={() => setPurchaseModalItem(null)}
        onConfirm={(quantity) => {
          if (purchaseModalItem?._id) {
            handlePurchase(purchaseModalItem._id, quantity);
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
      </>
    );
  });

