"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, ChevronUp, Package, Pause, Play } from "lucide-react";
import { cn, extractNameFromProduct, extractImageUrl } from "../../lib/utils";
import { Button } from "../common";
import { PurchaseQuantityModal } from "./items/PurchaseQuantityModal";
import { UnpurchaseQuantityModal } from "./items/UnpurchaseQuantityModal";
import { ProductDetailsModal } from "./items/ProductDetailsModal";
import { usePurchaseItem, useUnpurchaseItem } from "../../hooks/useItems";
import { useShoppingSessionActions } from "./ShoppingModeCard";
import { useElapsedTimer } from "../../hooks/useElapsedTimer";
import { ICategory, IItem, IShoppingSession } from "../../types";

interface ActiveShoppingViewProps {
  listId: string;
  groupId: string;
  listName: string;
  items: IItem[];
  categories: ICategory[];
  currentSession: IShoppingSession;
  activeSessions: IShoppingSession[];
  totalItems: number;
  purchasedItems: number;
  onBack: () => void;
}


const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const CircularProgressRing = memo(function CircularProgressRing({
  purchased,
  total,
  label,
}: {
  purchased: number;
  total: number;
  label: string;
}) {
  const percent = total > 0 ? purchased / total : 0;
  const offset = CIRCUMFERENCE * (1 - percent);

  return (
    <div className="relative flex-shrink-0">
      <svg width="140" height="140" viewBox="0 0 120 120" role="img" aria-label={`${purchased}/${total} ${label}`}>
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--color-border)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={RADIUS}
          fill="none"
          stroke="var(--color-primary-500, #3b82f6)"
          strokeWidth="8"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold text-text-primary leading-none">{purchased}/{total}</span>
        <span className="text-[10px] text-text-muted mt-1 leading-tight px-2">{label}</span>
      </div>
    </div>
  );
});

const ActiveShoppersRow = memo(function ActiveShoppersRow({
  sessions,
  label,
  moreLabel,
}: {
  sessions: IShoppingSession[];
  label: string;
  moreLabel: (count: number) => string;
}) {
  const visible = sessions.slice(0, 5);
  const overflow = sessions.length - 5;
  if (sessions.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-xs text-text-muted">{label}</p>
      <div className="flex items-center gap-1">
        {visible.map((s) => {
          const user = s.user;
          const initials = user
            ? (`${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`).toUpperCase() ||
              user.username?.[0]?.toUpperCase() || "?"
            : "?";
          return (
            <div
              key={s.id ?? s._id}
              className="size-9 rounded-full border-2 border-card bg-primary-100 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0"
              title={user ? `${user.firstName} ${user.lastName}` : ""}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={initials} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-primary-700">{initials}</span>
              )}
            </div>
          );
        })}
        {overflow > 0 && (
          <div className="size-9 rounded-full border-2 border-card bg-surface-hover flex items-center justify-center shadow-sm">
            <span className="text-xs font-semibold text-text-muted">{moreLabel(overflow)}</span>
          </div>
        )}
      </div>
    </div>
  );
});


const ShoppingActiveItemRow = memo(function ShoppingActiveItemRow({
  item,
  categories,
  isLoading,
  purchased,
  onOpenPurchaseModal,
  onOpenUnpurchaseModal,
  onPreview,
  tItems,
}: {
  item: IItem;
  categories: ICategory[];
  isLoading: boolean;
  purchased: boolean;
  onOpenPurchaseModal: (item: IItem) => void;
  onOpenUnpurchaseModal: (item: IItem) => void;
  onPreview: (item: IItem) => void;
  tItems: ReturnType<typeof useTranslations>;
}) {
  const categoryId =
    typeof item.category === "string"
      ? item.category
      : (item.category as { _id?: string } | undefined)?._id ?? "";
  const category = categories.find((c) => c._id === categoryId);
  const unitLabel = item.unit ? tItems(String(item.unit)) : "";
  const name = extractNameFromProduct(item);

  const isPartial =
    !purchased &&
    !!(item.purchasedQuantity && item.purchasedQuantity > 0 && item.purchasedQuantity < item.quantity);

  const productImage =
    extractImageUrl(item.image) ||
    (typeof item.product === "object" && item.product?.image
      ? extractImageUrl(item.product.image)
      : null);

  const handleCheckbox = useCallback(() => {
    if (purchased) onOpenUnpurchaseModal(item);
    else onOpenPurchaseModal(item);
  }, [purchased, item, onOpenPurchaseModal, onOpenUnpurchaseModal]);

  return (
    <article
      className={cn(
        "flex items-center gap-3 py-3 border-b border-border/30 min-h-[64px]",
        purchased && "opacity-55"
      )}
    >
      <Button
        variant="checkbox"
        size="lg"
        checked={purchased}
        onClick={handleCheckbox}
        disabled={isLoading}
        aria-label={name}
      />

      <Button
        variant="ghost"
        onClick={() => onPreview(item)}
        className="relative !p-0 size-12 flex-shrink-0 rounded-xl bg-surface border border-border/40 overflow-hidden hover:opacity-80"
      >
        {productImage ? (
          <img src={productImage} alt={name} className="h-full w-full object-contain p-1" />
        ) : category?.icon ? (
          <span className="text-xl">{category.icon}</span>
        ) : (
          <Package className="h-5 w-5 text-text-muted/50" />
        )}
        {purchased && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/40 rounded-xl">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </Button>

      <Button variant="ghost" onClick={() => onPreview(item)} className="flex-1 min-w-0 !justify-start !p-0 h-auto rounded-none text-start">
        <p className={cn(
          "font-semibold text-base text-text-primary leading-tight",
          purchased && "line-through text-text-muted"
        )}>
          {name}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {isPartial && (
            <span className="text-xs font-bold text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-lg">
              {item.purchasedQuantity}/{item.quantity} {unitLabel}
            </span>
          )}
          <p className="text-sm text-text-muted">
            {!isPartial && `${item.quantity} ${unitLabel}`}
            {item.brand ? ` · ${item.brand}` : ""}
            {category ? ` · ${category.name}` : ""}
          </p>
        </div>
      </Button>
    </article>
  );
});


export const ActiveShoppingView = memo(function ActiveShoppingView({
  listId,
  groupId,
  listName,
  items,
  categories,
  currentSession,
  activeSessions,
  totalItems,
  purchasedItems,
  onBack,
}: ActiveShoppingViewProps) {
  const t = useTranslations("ShoppingListPage.activeShopping");
  const tItems = useTranslations("ShoppingListItems");
  const tCommon = useTranslations("common");

  const isRunning = currentSession.status === "active";
  const elapsed = useElapsedTimer(currentSession.startedAt, isRunning);

  const {
    handleStopShopping,
    handlePauseShopping,
    handleResumeShopping,
    isAnyMutationPending,
    stopShoppingMutation,
    pauseShoppingMutation,
    resumeShoppingMutation,
  } = useShoppingSessionActions(listId);

  const purchaseItemMutation = usePurchaseItem();
  const unpurchaseItemMutation = useUnpurchaseItem();

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [purchaseModalItem, setPurchaseModalItem] = useState<IItem | null>(null);
  const [unpurchaseModalItem, setUnpurchaseModalItem] = useState<IItem | null>(null);
  const [productPreview, setProductPreview] = useState<IItem | null>(null);
  const [purchasedSectionOpen, setPurchasedSectionOpen] = useState(false);

  const unpurchasedItems = useMemo(
    () => items.filter((i) => !i.isPurchased && i.status !== "purchased"),
    [items]
  );
  const purchasedItemsList = useMemo(
    () => items.filter((i) => i.isPurchased || i.status === "purchased"),
    [items]
  );

  const categoryChips = useMemo(() => {
    const map: Record<string, { id: string; name: string }> = {};
    unpurchasedItems.forEach((item) => {
      const catId =
        typeof item.category === "string"
          ? item.category
          : (item.category as { _id?: string } | undefined)?._id ?? "no-category";
      if (!map[catId]) {
        const cat = categories.find((c) => c._id === catId);
        map[catId] = { id: catId, name: cat?.name ?? catId };
      }
    });
    return Object.values(map);
  }, [unpurchasedItems, categories]);

  const filteredUnpurchased = useMemo(() => {
    if (categoryFilter === "all") return unpurchasedItems;
    return unpurchasedItems.filter((item) => {
      const catId =
        typeof item.category === "string"
          ? item.category
          : (item.category as { _id?: string } | undefined)?._id ?? "";
      return catId === categoryFilter;
    });
  }, [unpurchasedItems, categoryFilter]);

  const allDone = totalItems > 0 && purchasedItems === totalItems;

  const activeCategoryFilter =
    categoryFilter === "all" || categoryChips.some((c) => c.id === categoryFilter)
      ? categoryFilter
      : "all";

  const isItemLoading = useCallback(
    (itemId: string) =>
      (purchaseItemMutation.isPending && purchaseItemMutation.variables?.itemId === itemId) ||
      (unpurchaseItemMutation.isPending && unpurchaseItemMutation.variables?.itemId === itemId),
    [purchaseItemMutation.isPending, purchaseItemMutation.variables?.itemId,
     unpurchaseItemMutation.isPending, unpurchaseItemMutation.variables?.itemId]
  );

  const handlePurchase = useCallback(
    async (itemId: string, qty?: number) => {
      if (!qty || qty <= 0) return;
      await purchaseItemMutation.mutateAsync({ itemId, shoppingListId: listId, groupId, quantityToPurchase: qty });
      setPurchaseModalItem(null);
    },
    [purchaseItemMutation, listId, groupId]
  );

  const handleUnpurchase = useCallback(
    async (item: IItem, qty?: number) => {
      await unpurchaseItemMutation.mutateAsync({ itemId: item._id, shoppingListId: listId, groupId, quantityToUnpurchase: qty });
      setUnpurchaseModalItem(null);
    },
    [unpurchaseItemMutation, listId, groupId]
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      <header className="flex items-center justify-between px-3 pt-4 pb-3 bg-card border-b border-border gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          aria-label="חזרה לרשימה"
          className="flex-shrink-0"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        <h1 className="flex-1 text-base font-semibold text-text-primary text-center truncate px-1">
          {listName}
        </h1>

        <Button
          variant="ghost"
          size="sm"
          onClick={isRunning ? handlePauseShopping : handleResumeShopping}
          disabled={isAnyMutationPending}
          loading={pauseShoppingMutation.isPending || resumeShoppingMutation.isPending}
          aria-label={isRunning ? t("pauseShopping") : t("resumeShopping")}
          className="flex-shrink-0"
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </header>
      <section className="flex flex-col items-center gap-3 px-5 py-5 bg-card border-b border-border/50 flex-shrink-0">
        <div
          className={cn(
            "text-3xl font-mono font-bold tracking-widest tabular-nums",
            isRunning ? "text-text-primary" : "text-text-muted"
          )}
          suppressHydrationWarning
        >
          {elapsed}
        </div>

        <CircularProgressRing
          purchased={purchasedItems}
          total={totalItems}
          label={t("progressLabel")}
        />

        <ActiveShoppersRow
          sessions={activeSessions}
          label={t("shoppingWithMe")}
          moreLabel={(n) => t("moreShoppers", { count: n })}
        />
      </section>
      {categoryChips.length > 1 && (
        <div
          className="flex gap-2 px-4 py-2.5 overflow-x-auto flex-shrink-0 bg-surface border-b border-border/30"
          dir="ltr"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <Button
            variant={activeCategoryFilter === "all" ? "primary" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter("all")}
            className="flex-shrink-0 rounded-full whitespace-nowrap"
          >
            {t("allCategories")}
          </Button>
          {categoryChips.map((chip) => (
            <Button
              key={chip.id}
              variant={activeCategoryFilter === chip.id ? "primary" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(chip.id)}
              className="flex-shrink-0 rounded-full whitespace-nowrap"
            >
              {chip.name}
            </Button>
          ))}
        </div>
      )}
      <main className="flex-1 overflow-y-auto px-4">
        <div className="pt-4 pb-1">
          <h2 className="text-sm font-semibold text-text-primary">
            {t("remainingSection", { count: unpurchasedItems.length })}
          </h2>
        </div>

        {filteredUnpurchased.map((item) => (
          <ShoppingActiveItemRow
            key={item._id}
            item={item}
            categories={categories}
            isLoading={isItemLoading(item._id)}
            purchased={false}
            onOpenPurchaseModal={setPurchaseModalItem}
            onOpenUnpurchaseModal={setUnpurchaseModalItem}
            onPreview={setProductPreview}
            tItems={tItems}
          />
        ))}
        {purchasedItemsList.length > 0 && (
          <div className="mt-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPurchasedSectionOpen((o) => !o)}
              className="w-full !justify-start gap-2 text-text-muted hover:text-text-primary"
            >
              {purchasedSectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {t("purchasedSection", { count: purchasedItemsList.length })}
            </Button>

            {purchasedSectionOpen &&
              purchasedItemsList.map((item) => (
                <ShoppingActiveItemRow
                  key={item._id}
                  item={item}
                  categories={categories}
                  isLoading={isItemLoading(item._id)}
                  purchased={true}
                  onOpenPurchaseModal={setPurchaseModalItem}
                  onOpenUnpurchaseModal={setUnpurchaseModalItem}
                  onPreview={setProductPreview}
                  tItems={tItems}
                />
              ))}
          </div>
        )}

        <div className="h-2" />
      </main>

      <footer
        className="flex-shrink-0 px-4 pt-3 bg-card border-t border-border"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        {allDone && (
          <p className="text-center text-sm text-success font-medium mb-2 animate-bounce">
            {t("allItemsDone")}
          </p>
        )}
        <Button
          variant={allDone ? "success" : "destructive"}
          size="lg"
          className={cn("w-full rounded-2xl", allDone && "animate-pulse")}
          onClick={handleStopShopping}
          disabled={isAnyMutationPending}
          loading={stopShoppingMutation.isPending}
        >
          {t("finishShopping")}
        </Button>
      </footer>

      <PurchaseQuantityModal
        item={purchaseModalItem}
        isLoading={purchaseItemMutation.isPending}
        onClose={() => setPurchaseModalItem(null)}
        onConfirm={(qty) => { if (purchaseModalItem?._id) handlePurchase(purchaseModalItem._id, qty); }}
        tItems={tItems}
      />

      <UnpurchaseQuantityModal
        item={unpurchaseModalItem}
        isLoading={unpurchaseItemMutation.isPending}
        onClose={() => setUnpurchaseModalItem(null)}
        onConfirm={(qty) => { if (unpurchaseModalItem) handleUnpurchase(unpurchaseModalItem, qty); }}
        tItems={tItems}
      />

      <ProductDetailsModal
        item={productPreview}
        onClose={() => setProductPreview(null)}
        tItems={tItems}
        tCommon={tCommon}
      />
    </div>
  );
});
