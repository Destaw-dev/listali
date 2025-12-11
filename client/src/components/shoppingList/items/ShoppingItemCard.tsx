"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  Info,
  Package,
  Trash2,
  Edit,
  ShoppingCart,
  Circle,
} from "lucide-react";
import { Button } from "@/components/common";

export interface ShoppingItemCardProps {
  item: any;
  isLoading: boolean;
  onOpenPurchaseModal: (item: any) => void;
  onUnpurchase: (itemId: string) => void;
  onPreview: (item: any) => void;
  onEdit?: (item: any) => void;
}

export function ShoppingItemCard({
  item,
  isLoading,
  onOpenPurchaseModal,
  onUnpurchase,
  onPreview,
  onEdit,
}: ShoppingItemCardProps) {
  const tItems = useTranslations("ShoppingListItems");
  const tCommon = useTranslations("common");

  const hasImage = Boolean(item?.product?.image);
  const brand = item?.brand ?? item?.product?.brand;
  const unitLabel = item?.unit ? tItems(String(item.unit)) : undefined;

  const badge = useMemo(() => {
    if (!item?.priority) return null;
    const map: Record<string, { text: string; cls: string }> = {
      high:   { text: tItems("priority.high" as any)   ?? "עדיפות גבוהה",   cls: "bg-rose-600 text-white" },
      medium: { text: tItems("priority.medium" as any) ?? "עדיפות בינונית", cls: "bg-amber-500 text-white" },
      low:    { text: tItems("priority.low" as any)    ?? "עדיפות נמוכה",   cls: "bg-emerald-600 text-white" },
    };
    const conf = map[item.priority] ?? map.low;
    return (
      <span className={`rounded-full px-2 py-1 text-xs font-semibold shadow ${conf.cls}`}>
        {conf.text}
      </span>
    );
  }, [item?.priority, tItems]);

  const handleTogglePurchased = useCallback(() => {
    if (item?.isPurchased) onUnpurchase(item._id);
    else onOpenPurchaseModal(item);
  }, [item, onOpenPurchaseModal, onUnpurchase]);

  // const handleDecrease = useCallback(() => {
  //   if (item.quantity <= 1 || isQuantityUpdating) return;
  //   onUpdateQuantity(item._id, item.quantity - 1);
  // }, [item, isQuantityUpdating, onUpdateQuantity]);

  // const handleIncrease = useCallback(() => {
  //   if (isQuantityUpdating) return;
  //   onUpdateQuantity(item._id, item.quantity + 1);
  // }, [item, isQuantityUpdating, onUpdateQuantity]);

  return (
    <article className="w-full rounded-2xl bg-white p-4 shadow-lg transition hover:shadow-md">
      {/* header row — במובייל הכל בערימה; מ-sম לצד-לצד */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* leading: toggle + image + text */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {/* toggle */}
          <button
            type="button"
            onClick={handleTogglePurchased}
            disabled={isLoading}
            aria-label={item?.isPurchased ? tItems("markPending") : tItems("markPurchased")}
            className={`grid size-10 place-items-center rounded-full border shadow-sm transition ${
              item?.isPurchased
                ? "border-emerald-200 text-emerald-600"
                : "border-slate-200 text-slate-400"
            }`}
          >
            {item?.isPurchased ? <Check className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
          </button>

          {/* thumbnail */}
          <div className="size-14 overflow-hidden rounded-xl ring-1 ring-slate-200 bg-slate-50 shrink-0">
            {hasImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.product.image}
                alt={item.product?.name || item.name}
                className="h-full w-full object-contain"
                loading="lazy"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <Package className="h-5 w-5 text-slate-300" />
              </div>
            )}
          </div>

          {/* text block */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-800">{item?.name}</h3>
              {badge}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
              {brand && <span className="truncate">{brand}</span>}
              <span className="text-slate-400">•</span>
              <span className="truncate">{item.category?.name ?? tItems("uncategorized")}</span>
              {typeof item.quantity === "number" && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="truncate">
                    {item.quantity} {unitLabel}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* actions — במובייל ירד למטה; בדסקטופ בצד ימין */}
        <div className="flex flex-wrap items-center gap-2 sm:self-start">
          {!item?.isPurchased ? (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={handleTogglePurchased}
                disabled={isLoading}
                icon={<ShoppingCart className="h-4 w-4" />}
              >
                {tItems("markPurchased")}
              </Button>

             
                <Button variant="ghost" size="md">
                  <Edit className="h-4 w-4 text-primaryT-500" />
                </Button>

              <Button variant="ghost" size="md" aria-label={tCommon("delete")} >
                <Trash2 className="h-4 w-4 text-error" />
              </Button>
            </>
          ) : (
            <Button
              variant="success"
              size="md"
              onClick={handleTogglePurchased}
              disabled={isLoading}
              icon={<ShoppingCart className="h-4 w-4" />}
            >
              {tItems("markPending")}
            </Button>
          )}
        </div>
      </div>

      {/* footer */}
      <div className="mt-3 border-t border-slate-200 pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            icon={<Info className="h-4 w-4" />}
            onClick={() => onPreview(item)}
          >
            {tItems("viewDetails")}
          </Button>
      </div>
    </article>
  );
}
