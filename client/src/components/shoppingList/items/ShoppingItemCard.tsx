import { useTranslations } from "next-intl";
import { Edit, Info, Trash2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";

import { IItem } from "@/types";

interface ShoppingItemCardProps {
  item: IItem;
  isLoading: boolean;
  onOpenPurchaseModal: (item: IItem) => void;
  onUnpurchase: (itemId: string) => void;
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
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-[12px] text-muted">
            {tItems("purchasedQuantityLabel", { 
              purchased: purchasedQty, 
              total: item.quantity, 
              unit: unitLabel 
            }) || `${purchasedQty}/${item.quantity} ${unitLabel}`}
          </span>
          <span className="text-[11px] text-muted">
            {tItems("remainingQuantityLabel", { 
              remaining: remainingQty, 
              unit: unitLabel 
            }) || `נותר: ${remainingQty} ${unitLabel}`}
          </span>
        </div>
      );
    }
    return <span className="font-medium">{item.quantity} {unitLabel}</span>;
  };

  return (
    <article className={cn(
      "relative flex items-center gap-2 bg-card py-3 pl-2 pr-1 active:bg-card/80 transition-colors hover:bg-card/80 cursor-pointer",
      (item?.isPurchased) && "bg-success-50/50"
    )}>
      
      <Button
      variant="checkbox"
      checked={item?.isPurchased}
      onClick={() => {
        if (item?.isPurchased ) {
          onUnpurchase(item._id);
        } else {
          onOpenPurchaseModal(item);
        }
      }}
      disabled={isLoading}
      />

      <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-card ring-1 ring-border" onClick={() => onPreview(item)}>
        {typeof item?.product === 'object' && item?.product !== null && 'image' in item.product && (item.product as { image?: string }).image ? (
          <img src={(item.product as { image: string }).image} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <div className="grid h-full w-full place-items-center"><Package className="h-4 w-4 text-border" /></div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col" onClick={() => onPreview(item)}>
        <div className="flex items-center gap-1.5">
          <h3 className={cn(
            "truncate text-[15px] font-semibold text-primary",
            item?.isPurchased && !isPartiallyPurchased && "line-through text-muted font-normal"
          )}>
            {item?.name}
          </h3>

        </div>
        <div className="flex items-center gap-1 text-[12px] text-text-muted">
          {getQuantityDisplay()}
          {brand && <span className="truncate opacity-70">• {brand}</span>}
          <div className="hidden sm:block">
        {!item?.isPurchased && !isPartiallyPurchased && item.priority && (
            getPriorityBadge()
        )}
      </div>
        </div>
              <div className="block sm:hidden">
        {!item?.isPurchased && !isPartiallyPurchased && item.priority && (
            getPriorityBadge()
        )}
      </div>
      </div>


      <div className="flex shrink-0 items-center gap-1">
        {!item?.isPurchased && (
          <>
          {canEdit && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onEdit?.(item)}
              className="p-2 text-muted hover:text-primaryT-500 cursor-pointer"
              aria-label="עריכה"
              disabled={isLoading}
            >
              <Edit className="h-4 w-4 hover:text-primaryT-500" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onDelete?.(item._id)}
              className="p-2 text-muted hover:text-error-500 cursor-pointer"
              aria-label="מחיקה"
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 hover:text-error-500" />
            </Button>
          )}
          </>
        )}
        {item?.isPurchased && (
           <Button
            variant="ghost"
            size="xs"
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