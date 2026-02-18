import { memo } from "react";
import { useTranslations } from "next-intl";
import { Edit, Info, Trash2, Package } from "lucide-react";
import { cn, extractImageUrl, extractNameFromProduct } from "../../../lib/utils";
import { Button, Badge } from "../../common";
import { IItem } from "../../../types";

interface ShoppingItemCardProps {
  item: IItem;
  isLoading: boolean;
  onOpenPurchaseModal: (item: IItem) => void;
  onUnpurchase: (item: IItem) => void;
  onPreview: (item: IItem) => void;
  onEdit?: (item: IItem) => void;
  onDelete?: (itemId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const ShoppingItemCard = memo(function ShoppingItemCard({ 
  item, 
  isLoading, 
  onOpenPurchaseModal, 
  onUnpurchase, 
  onPreview, 
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}: ShoppingItemCardProps) {
  const tCommon = useTranslations("common");
  const tItems = useTranslations("ShoppingListItems");
  const product = item.product;
  const productBrand = typeof product === 'object' && product !== null && 'brand' in product ? (product as { brand?: string }).brand : undefined;
  const brand = item?.brand ?? productBrand;
  const unitLabel = item?.unit ? tItems(String(item.unit)) : "";

  const getPriorityBadge = () => {
    switch (item.priority) {
      case 'high': return <Badge variant='priority' size="xs" rounded={true}>{tItems("priority.high")}</Badge>;
      case 'medium': return <Badge variant='warning' size="xs" rounded={true}>{tItems("priority.medium")}</Badge>;
      case 'low': return <Badge variant='default' size="xs" rounded={true}>{tItems("priority.low")}</Badge>;
      default: return null;
    }
  };

  const isPartiallyPurchased = 
    !!(item?.isPartiallyPurchased || (item?.purchasedQuantity && item.purchasedQuantity > 0 && item.purchasedQuantity < item.quantity));
  const purchasedQty = item?.purchasedQuantity || 0;
  const remainingQty = item?.remainingQuantity || (item?.quantity - purchasedQty);
  
  const getQuantityDisplay = () => {
    if (isPartiallyPurchased) {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-status-warning-soft)] border border-warning/20">
            <span className="text-xs font-bold text-warning">
              {purchasedQty}/{item.quantity} {unitLabel}
            </span>
          </div>
          <span className="text-xs text-text-muted">
            {tItems("remainingQuantityLabel", { remaining: remainingQty, unit: unitLabel })}
          </span>
          {brand && (
            <span className="text-xs text-text-muted/70 px-2 py-0.5 rounded bg-surface-hover">
              {brand}
            </span>
          )}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--color-icon-primary-bg)] border border-primary/20">
          <span className="text-xs font-bold text-[var(--color-icon-primary-fg)]">
            {item.quantity} {unitLabel}
          </span>
        </div>
        {brand && (
          <span className="text-xs text-text-muted/70 px-2 py-0.5 rounded bg-surface-hover">
            {brand}
          </span>
        )}
      </div>
    );
  };

  return (
    <article className={cn(
      "group relative bg-gradient-to-br from-card to-surface/30 rounded-xl overflow-hidden transition-all duration-300 mt-3",
      "border border-border/50 hover:border-primary/30",
      "shadow-md hover:shadow-lg",
      item?.isPurchased && "opacity-70"
    )}>
      {/* סרגל צבעוני עליון */}
      <div className={cn(
        "absolute top-0 inset-x-0 h-1 transition-all duration-300",
        item?.isPurchased
          ? "bg-gradient-to-l from-success/50 to-success/70"
          : "bg-gradient-to-l from-primary/50 via-accent/50 to-secondary/50"
      )} />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 pt-4">
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <div className="flex-shrink-0">
            <Button
              variant="checkbox"
              checked={item?.isPurchased}
              onClick={() => {
                if (item?.isPurchased) {
                  onUnpurchase(item);
                } else {
                  onOpenPurchaseModal(item);
                }
              }}
              disabled={isLoading}
            />
          </div>

          {/* תמונת המוצר */}
          <div
            className="relative size-16 sm:size-18 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-surface to-surface-hover border border-border/40 shadow-sm transition-all duration-200 hover:scale-105 cursor-pointer"
            onClick={() => onPreview(item)}
          >
            {extractImageUrl(item.image) ? (
              <img src={extractImageUrl(item.image)} alt={item.name} className="h-full w-full object-contain p-1.5" />
            ) : typeof item?.product === 'object' && item.product.image ? (
              <img src={extractImageUrl(item.product.image)} alt={item.name} className="h-full w-full object-contain p-1.5" />
            ) : (
              <div className="grid h-full w-full place-items-center bg-surface-hover">
                <Package className="h-6 w-6 text-text-muted/50" />
              </div>
            )}

            {/* אינדיקטור סטטוס */}
            {item?.isPurchased && (
              <div className="absolute -top-1 -end-1 size-6 bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center shadow-md border-2 border-card">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}
          </div>

          {/* תוכן המוצר - מובייל */}
          <div className="flex-1 min-w-0 sm:hidden cursor-pointer" onClick={() => onPreview(item)}>
            <h3 className={cn(
              "text-sm font-bold text-text-primary mb-1 leading-tight line-clamp-2",
              item?.isPurchased && !isPartiallyPurchased && "line-through text-text-muted/70"
            )}>
              {extractNameFromProduct(item)}
            </h3>
          </div>
        </div>

        {/* תוכן המוצר - דסקטופ */}
        <div className="flex-1 min-w-0 hidden sm:block cursor-pointer" onClick={() => onPreview(item)}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={cn(
              "text-base font-bold text-text-primary leading-tight",
              item?.isPurchased && !isPartiallyPurchased && "line-through text-text-muted/70"
            )}>
              {extractNameFromProduct(item)}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {getQuantityDisplay()}
            {!item?.isPurchased && item.priority && (
              <>
                {getPriorityBadge()}
              </>
            )}
          </div>
        </div>

      </div>

      <div className="sm:hidden px-3 pb-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {getQuantityDisplay()}
        {!item?.isPurchased && item.priority && (
          <>
            {getPriorityBadge()}
            </>
        )}
        </div>
      </div>
        <div className="flex items-center gap-2 justify-end  pe-3 pb-3">
          {!item?.isPurchased && (
            <>
              {canEdit && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit?.(item)}
                  aria-label={tCommon("edit")}
                  disabled={isLoading}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete?.(item._id)}
                  aria-label={tCommon("delete")}
                  disabled={isLoading}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
          {item?.isPurchased && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onPreview(item)}
              aria-label={tItems("viewDetails")}
            >
              <Info className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
    </article>
  );
});
