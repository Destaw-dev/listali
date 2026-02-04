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

export function ShoppingItemCard({ 
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
        <div className="flex sm:items-end sm:flex-row flex-col sm:gap-1 text-[12px] text-text-primary">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-[12px] text-text-primary">
            {tItems("purchasedQuantityLabel", { 
              purchased: purchasedQty, 
              total: item.quantity, 
              unit: unitLabel 
            }) || `${purchasedQty}/${item.quantity} ${unitLabel}`}
          </span>
          <span className="text-[11px] text-text-primary">
            {tItems("remainingQuantityLabel", { 
              remaining: remainingQty, 
              unit: unitLabel 
            }) || `נותר: ${remainingQty} ${unitLabel}`}
          </span>
        </div>
        {brand && <span className="truncate opacity-70">• {brand}</span>}
        <div className="hidden sm:block">
    {!item?.isPurchased  && item.priority && (
        getPriorityBadge()
        )}
      </div>
        </div>
      );
    }
    return (
    <div className="flex sm:items-center sm:flex-row flex-col sm:gap-1 text-[12px] text-text-primary">
    <span className="font-medium text-text-primary">{item.quantity} {unitLabel}</span>
    {brand && <span className="truncate opacity-70">• {brand}</span>}
    <div className="hidden sm:block">
    {!item?.isPurchased &&  item.priority && (
        getPriorityBadge()
        )}
      </div>
      </div>
    );
  };

  return (
    <article className={cn(
      "flex flex-col sm:flex-row sm:items-center gap-2 bg-card py-4 pl-2 pr-1 active:bg-card/80 transition-colors hover:bg-surface cursor-pointer border-2 border-border rounded-lg p-2 mt-2",
    )}>
      <div className="flex items-center gap-2">
      <Button
      variant="checkbox"
      checked={item?.isPurchased}
      onClick={() => {
        if (item?.isPurchased ) {
          onUnpurchase(item);
        } else {
          onOpenPurchaseModal(item);
        }
      }}
      disabled={isLoading}
      />

      <div className="size-30 shrink-0 overflow-hidden rounded-lg" onClick={() => onPreview(item)}>
        {extractImageUrl(item.image) ? (
          <img src={extractImageUrl(item.image)} alt={item.name} className="h-full w-full object-contain p-1" />
        ) : typeof item?.product === 'object' && item.product.image ? (
          <img src={extractImageUrl(item.product.image)} alt={item.name} className="h-full w-full object-contain p-1" />
        ) : (
          <div className="grid h-full w-full place-items-center"><Package className="h-4 w-4 text-border" /></div>
        )}
      </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col" onClick={() => onPreview(item)}>
        <div className="flex items-center gap-1.5">
          <h3 className={cn(
            "truncate text-[15px] font-semibold text-text-primary",
            item?.isPurchased && !isPartiallyPurchased && "line-through text-muted font-normal"
          )}>
            {extractNameFromProduct(item)}
          </h3>

        </div>
        {getQuantityDisplay()}
              <div className="block sm:hidden">
        {!item?.isPurchased  && item.priority && (
            getPriorityBadge()
        )}
      </div>
      </div>


      <div className="flex shrink-0 items-center gap-1">
        {!item?.isPurchased && (
          <>
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit?.(item)}
              aria-label="עריכה"
              disabled={isLoading}
            >
              <Edit className="h-4 w-4 text-white" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete?.(item._id)}
              aria-label="מחיקה"
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 text-white" />
            </Button>
          )}
          </>
        )}
        {item?.isPurchased && (
           <Button
            variant="primary"
            size="sm"
            onClick={() => onPreview(item)}
            rounded={true}
            aria-label="מידע"
          >
            <Info className="h-4 w-4 text-muted" />
          </Button>
        )}
      </div>

    </article>
  );
}