"use client";

import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import { ShoppingItemCard } from "./ShoppingItemCard";

interface CategorySectionProps {
  title: string;
  icon: React.ReactNode;
  groups: Array<{
    categoryId: string;
    categoryName: string;
    items: any[];
  }>;
  onOpenPurchaseModal: (item: any) => void;
  onUnpurchase: (itemId: string) => void;
  onPreview: (item: any) => void;
  onEdit?: (item: any) => void;
  isItemLoading: (itemId: string) => boolean;
  defaultOpen?: boolean;
  tone?: "default" | "purchased";
}

export const CategorySection = memo(function CategorySection({
  title,
  icon,
  groups,
  onOpenPurchaseModal,
  onUnpurchase,
  onPreview,
  onEdit,
  isItemLoading,
  defaultOpen = true,
  tone = "default",
}: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const tItems = useTranslations("ShoppingListItems");

  const totalItems = groups.reduce(
    (accumulator, group) => accumulator + group.items.length,
    0
  );

  return (
    <section className={cn("mb-4 overflow-hidden transition-all")}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between py-2 pr-1 pl-2 transition-opacity active:opacity-60",
          tone === "purchased" ? "opacity-70" : "opacity-100"
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex size-7 items-center justify-center rounded-lg shadow-sm",
            tone === "purchased" ? "bg-slate-100" : "bg-primaryT-50 text-primaryT-600"
          )}>
            {icon}
          </div>
          <div className="text-right">
            <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
            <span className="text-[11px] font-medium text-slate-400">
              {totalItems} {tItems("items")}
            </span>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-300" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-300" />
        )}
      </button>

      {isOpen && (
        <div className="mt-1">
          {groups.map((group) => (
            <div key={group.categoryId} className="mt-3 first:mt-1">
              <div className="bg-slate-50/80 sticky top-0 z-10 flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-md">
                <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[12px] font-bold tracking-tight text-slate-500 uppercase">
                  {group.categoryName}
                </span>
                <span className="text-[10px] font-medium text-slate-300">
                  ({group.items.length})
                </span>
              </div>

              <div className="divide-y divide-slate-100 border-y border-slate-100">
                {group.items.map((item: any) => (
                  <ShoppingItemCard
                    key={item._id}
                    item={item}
                    isLoading={isItemLoading(item._id)}
                    onOpenPurchaseModal={onOpenPurchaseModal}
                    onUnpurchase={onUnpurchase}
                    onPreview={onPreview}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
});
