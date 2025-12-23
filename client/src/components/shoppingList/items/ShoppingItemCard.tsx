import { useTranslations } from "next-intl";
import { Edit, Info, Trash2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";

interface ShoppingItemCardProps {
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
  onEdit 
}: ShoppingItemCardProps) {
  const tItems = useTranslations("ShoppingListItems");
  const brand = item?.brand ?? item?.product?.brand;
  const unitLabel = item?.unit ? tItems(String(item.unit)) : "";

  const getPriorityBadge = () => {
    switch (item.priority) {
      case 'high': return <Badge variant='priority' size="xs" rounded={true}>{tItems("priority.high")}</Badge>;
      case 'medium': return <Badge variant='warning' size="xs" rounded={true}>{tItems("priority.medium")}</Badge>;
      case 'low': return <Badge variant='default' size="xs" rounded={true}>{tItems("priority.low")}</Badge>;
      default: return null;
    }
  };

  return (
    <article className={cn(
      "relative flex items-center gap-2 bg-white py-3 pl-2 pr-1 active:bg-slate-50 transition-colors hover:bg-slate-50 cursor-pointer",
      item?.isPurchased && "bg-slate-50/50"
    )}>
      
      <Button
      variant="checkbox"
      checked={item?.isPurchased}
      onClick={() => item?.isPurchased ? onUnpurchase(item._id) : onOpenPurchaseModal(item)}
      disabled={isLoading}
      />

      <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-100" onClick={() => onPreview(item)}>
        {item?.product?.image ? (
          <img src={item.product.image} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <div className="grid h-full w-full place-items-center"><Package className="h-4 w-4 text-slate-200" /></div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col" onClick={() => onPreview(item)}>
        <div className="flex items-center gap-1.5">
          <h3 className={cn(
            "truncate text-[15px] font-semibold text-slate-800",
            item?.isPurchased && "line-through text-slate-400 font-normal"
          )}>
            {item?.name}
          </h3>

        </div>
        <div className="flex items-center gap-1 text-[12px] text-slate-500">
          <span className="font-medium">{item.quantity} {unitLabel}</span>
          {brand && <span className="truncate opacity-70">• {brand}</span>}
          <div className="hidden sm:block">
        {!item?.isPurchased && item.priority && (
            getPriorityBadge()
        )}
      </div>
        </div>
              <div className="block sm:hidden">
        {!item?.isPurchased && item.priority && (
            getPriorityBadge()
        )}
      </div>
      </div>


      <div className="flex shrink-0 items-center gap-1">
        {!item?.isPurchased && (
          <>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onEdit?.(item)}
            className="p-2 text-slate-400 hover:text-primaryT-500 cursor-pointer"
            aria-label="עריכה"
          >
            <Edit className="h-4 w-4 hover:text-primaryT-500" />
          </Button>
            <Button
              variant="ghost"
              size="xs"
              className="p-2 text-slate-400 hover:text-error-500 cursor-pointer"
              aria-label="מחיקה"
            >
              <Trash2 className="h-4 w-4 hover:text-error-500" />
            </Button>
          </>
        )}
        {item?.isPurchased && (
           <Button
            variant="ghost"
            size="xs"
            onClick={() => onPreview(item)}
            rounded={true}
            className="p-2 text-slate-300 hover:text-slate-400 cursor-pointer"
            aria-label="מידע"
          >
            <Info className="h-4 w-4" />
          </Button>
        )}
      </div>

    </article>
  );
}