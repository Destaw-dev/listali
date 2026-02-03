"use client";

import { memo, useMemo, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { ShoppingBag, CheckCircle } from "lucide-react";
import { GuestItem, ICategory, IItem } from "../../types";
import { CategorySection } from "../shoppingList/items/CategorySection";
import { ProductDetailsModal } from "../shoppingList/items/ProductDetailsModal";
import { PurchaseQuantityModal } from "../shoppingList/items/PurchaseQuantityModal";
import { UnpurchaseQuantityModal } from "../shoppingList/items/UnpurchaseQuantityModal";
import { EditGuestItemModal } from "./EditGuestItemModal";
import { PurchaseAllButton } from "../shoppingList/PurchaseAllButton";

interface GuestListItemsProps {
  items: GuestItem[];
  listId: string;
  onToggle: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  onPurchase: (itemId: string, quantity: number) => void;
  onUnpurchase: (itemId: string, quantity: number) => void;
  onEdit: (item: GuestItem) => void;
  onPurchaseAll?: () => { itemIds: string[]; previousStates: Array<{ itemId: string; purchasedQuantity: number; checked: boolean }> };
  onUndoPurchaseAll?: (previousStates: Array<{ itemId: string; purchasedQuantity: number; checked: boolean }>) => void;
  categories?: ICategory[];
}

// Convert GuestItem to IItem format for CategorySection
const convertGuestItemToIItem = (item: GuestItem, categories: ICategory[]): IItem => {
  const category = item.categoryId ? categories.find((c) => c._id === item.categoryId) : undefined;
  const totalQty = item.quantity || 1;
  const purchasedQty = item.purchasedQuantity || 0;
  const isPartiallyPurchased = purchasedQty > 0 && purchasedQty < totalQty;
  
  return {
    _id: item.id,
    id: item.id,
    name: item.name,
    quantity: totalQty,
    unit: item.unit || "piece",
    isPurchased: item.checked && !isPartiallyPurchased,
    isPartiallyPurchased: isPartiallyPurchased,
    
    purchasedQuantity: purchasedQty,
    remainingQuantity: totalQty - purchasedQty,
    status: item.checked ? ("purchased" as const) : ("pending" as const),
    category: category || item.categoryId || "",
    notes: item.notes,
    brand: item.brand,
    image: item.image,
    product: undefined,
    addedBy: "",
    shoppingList: "",
    priority: "low" as const,
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
  };
};

export const GuestListItems = memo(function GuestListItems({
  items,
  listId,
  onToggle,
  onDelete,
  onPurchase,
  onUnpurchase,
  onEdit,
  onPurchaseAll,
  onUndoPurchaseAll,
  categories = [],
}: GuestListItemsProps) {
  const tItems = useTranslations("ShoppingListItems");
  const tCommon = useTranslations("common");
  
  const [productPreview, setProductPreview] = useState<IItem | null>(null);
  const [purchaseModalItem, setPurchaseModalItem] = useState<IItem | null>(null);
  const [unpurchaseModalItem, setUnpurchaseModalItem] = useState<IItem | null>(null);
  const [editModalItem, setEditModalItem] = useState<GuestItem | null>(null);
  const [undoState, setUndoState] = useState<Array<{ itemId: string; purchasedQuantity: number; checked: boolean }> | null>(null);

  const handleOpenPurchaseModal = useCallback((item: IItem) => {
    setPurchaseModalItem(item);
  }, []);

  const handleUnpurchaseClick = useCallback((item: IItem) => {
    setUnpurchaseModalItem(item);
  }, []);

  const handlePurchaseConfirm = useCallback((quantity: number) => {
    if (purchaseModalItem?._id) {
      onPurchase(purchaseModalItem._id, quantity);
      setPurchaseModalItem(null);
    }
  }, [purchaseModalItem, onPurchase]);

  const handleUnpurchaseConfirm = useCallback((quantity: number) => {
    if (unpurchaseModalItem?._id) {
      onUnpurchase(unpurchaseModalItem._id, quantity);
      setUnpurchaseModalItem(null);
    }
  }, [unpurchaseModalItem, onUnpurchase]);

  const handleEditItem = useCallback((item: IItem) => {
    const guestItem = items.find((i) => i.id === item._id);
    if (guestItem) {
      setEditModalItem(guestItem);
    }
  }, [items]);

  const handlePreview = useCallback((item: IItem) => {
    setProductPreview(item);
  }, []);

  const handlePurchaseAll = useCallback(() => {
    if (!onPurchaseAll) return;
    const result = onPurchaseAll();
    setUndoState(result.previousStates);
  }, [onPurchaseAll]);

  const handleUndoPurchaseAll = useCallback(() => {
    if (!onUndoPurchaseAll || !undoState) return;
    onUndoPurchaseAll(undoState);
    setUndoState(null);
  }, [onUndoPurchaseAll, undoState]);

  const unpurchasedCount = useMemo(() => {
    return items.filter((item) => {
      const totalQty = item.quantity || 1;
      const purchasedQty = item.purchasedQuantity || 0;
      return !item.checked && purchasedQty < totalQty;
    }).length;
  }, [items]);

  const groupedItems = useMemo(() => {
    const purchased: GuestItem[] = [];
    const unpurchased: GuestItem[] = [];

    items.forEach((item) => {
      const totalQty = item.quantity || 1;
      const purchasedQty = item.purchasedQuantity || 0;
      if (item.checked || (purchasedQty > 0 && purchasedQty === totalQty)) {
        purchased.push(item);
      } else if (purchasedQty < totalQty) {
        unpurchased.push(item);
      }
    });

    const unpurchasedByCategory: Record<string, GuestItem[]> = {};
    const unpurchasedUncategorized: GuestItem[] = [];

    unpurchased.forEach((item) => {
      if (item.categoryId) {
        if (!unpurchasedByCategory[item.categoryId]) {
          unpurchasedByCategory[item.categoryId] = [];
        }
        unpurchasedByCategory[item.categoryId].push(item);
      } else {
        unpurchasedUncategorized.push(item);
      }
    });

    const purchasedByCategory: Record<string, GuestItem[]> = {};
    const purchasedUncategorized: GuestItem[] = [];

    purchased.forEach((item) => {
      if (item.categoryId) {
        if (!purchasedByCategory[item.categoryId]) {
          purchasedByCategory[item.categoryId] = [];
        }
        purchasedByCategory[item.categoryId].push(item);
      } else {
        purchasedUncategorized.push(item);
      }
    });

    const getCategoryName = (categoryId: string): string => {
      const category = categories.find((c) => c._id === categoryId);
      return category?.name || "No Category";
    };

    const unpurchasedGroups = [
      ...(unpurchasedUncategorized.length > 0
        ? [
            {
              categoryId: "uncategorized",
              categoryName: tItems("uncategorized") || "Uncategorized",
              items: unpurchasedUncategorized.map((item) => convertGuestItemToIItem(item, categories)),
            },
          ]
        : []),
      ...Object.entries(unpurchasedByCategory).map(([categoryId, categoryItems]) => ({
        categoryId,
        categoryName: getCategoryName(categoryId),
        items: categoryItems.map((item) => convertGuestItemToIItem(item, categories)),
      })),
    ];

    const purchasedGroups = [
      ...(purchasedUncategorized.length > 0
        ? [
            {
              categoryId: "uncategorized",
              categoryName: tItems("uncategorized") || "Uncategorized",
              items: purchasedUncategorized.map((item) => convertGuestItemToIItem(item, categories)),
            },
          ]
        : []),
      ...Object.entries(purchasedByCategory).map(([categoryId, categoryItems]) => ({
        categoryId,
        categoryName: getCategoryName(categoryId),
        items: categoryItems.map((item) => convertGuestItemToIItem(item, categories)),
      })),
    ];

    return { unpurchasedGroups, purchasedGroups };
  }, [items, categories, tItems]);

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-card p-12 text-center shadow-xl">
        <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-text-muted" />
        <h3 className="mb-2 text-lg font-semibold text-text-primary">
          {tItems("noItems")}
        </h3>
        <p className="text-text-muted">{tItems("addItemsMessage") || "Add items to get started"}</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-3xl bg-card px-3 py-6 shadow-xl sm:px-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {tItems("listItems")} <span className="text-sm text-text-muted">({items.length} {tItems("items")})</span>
            </h2>
          </div>
          {onPurchaseAll && (
            <PurchaseAllButton
              onPurchaseAll={handlePurchaseAll}
              unpurchasedCount={unpurchasedCount}
              showUndo={!!undoState}
              onUndo={handleUndoPurchaseAll}
            />
          )}
        </header>

        <div>
          {groupedItems.unpurchasedGroups.length > 0 && (
            <CategorySection
              title={tItems("unpurchasedItems") || "Unpurchased Items"}
              icon={<ShoppingBag className="h-5 w-5 text-primary-500" />}
              groups={groupedItems.unpurchasedGroups}
              onOpenPurchaseModal={handleOpenPurchaseModal}
              onUnpurchase={handleUnpurchaseClick}
              onPreview={handlePreview}
              onEdit={handleEditItem}
              onDelete={onDelete}
              canEdit={true}
              canDelete={true}
              isItemLoading={() => false}
            />
          )}

          {groupedItems.purchasedGroups.length > 0 && (
            <CategorySection
              title={tItems("purchasedItems") || "Purchased Items"}
              icon={<CheckCircle className="h-5 w-5 text-success-600" />}
              groups={groupedItems.purchasedGroups}
              onOpenPurchaseModal={handleOpenPurchaseModal}
              onUnpurchase={handleUnpurchaseClick}
              onPreview={handlePreview}
              onEdit={handleEditItem}
              onDelete={onDelete}
              canEdit={true}
              canDelete={true}
              isItemLoading={() => false}
              defaultOpen={false}
              tone="purchased"
            />
          )}
        </div>
      </div>

      <ProductDetailsModal
        item={productPreview}
        onClose={() => setProductPreview(null)}
        tItems={tItems}
        tCommon={tCommon}
      />

      {purchaseModalItem && (
        <PurchaseQuantityModal
          item={purchaseModalItem}
          isLoading={false}
          onClose={() => setPurchaseModalItem(null)}
          onConfirm={handlePurchaseConfirm}
          tItems={tItems}
        />
      )}

      {unpurchaseModalItem && (
        <UnpurchaseQuantityModal
          item={unpurchaseModalItem}
          isLoading={false}
          onClose={() => setUnpurchaseModalItem(null)}
          onConfirm={handleUnpurchaseConfirm}
          tItems={tItems}
        />
      )}

      <EditGuestItemModal
        item={editModalItem}
        listId={listId}
        onClose={() => setEditModalItem(null)}
        categories={categories}
      />
    </>
  );
});
