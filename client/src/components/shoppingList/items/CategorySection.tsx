"use client";

import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "../../../lib/utils";
import { ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import { ShoppingItemCard } from "./ShoppingItemCard";
import { IItem } from "../../../types";

interface CategorySectionProps {
  title: string;
  icon: React.ReactNode;
  groups: Array<{
    categoryId: string;
    categoryName: string;
    items: IItem[];
  }>;
  onOpenPurchaseModal: (item: IItem) => void;
  onUnpurchase: (item: IItem) => void;
  onPreview: (item: IItem) => void;
  onEdit?: (item: IItem) => void;
  onDelete?: (itemId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
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
  onDelete,
  canEdit = false,
  canDelete = false,
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
            tone === "purchased" ? "bg-neutral-100" : "bg-background-50 text-text-primary-600"
          )}>
            {icon}
          </div>
          <div className="text-start">
            <h3 className="text-[15px] font-bold text-text-secondary">{title}</h3>
            <span className="text-[11px] font-medium text-text-muted">
              {totalItems} {tItems("items")}
            </span>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-text-secondary" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-secondary" />
        )}
      </button>

      {isOpen && (
        <div className="mt-1">
          {groups.map((group) => (
            <div key={group.categoryId} className="mt-3 first:mt-1">
              <div className="bg-surface sticky top-0 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-sm">
                <ShoppingBag className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-[12px] font-bold tracking-tight text-neutral-500 uppercase">
                  {group.categoryName}
                </span>
                <span className="text-[10px] font-medium text-neutral-400">
                  ({group.items.length})
                </span>
              </div>

              <div className="divide-y divide-neutral-100 border-y border-neutral-100">
                {group.items.map((item) => (
                  <ShoppingItemCard
                    key={item._id}
                    item={item}
                    isLoading={isItemLoading(item._id)}
                    onOpenPurchaseModal={onOpenPurchaseModal}
                    onUnpurchase={(item) => onUnpurchase(item)}
                    onPreview={onPreview}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    canEdit={canEdit}
                    canDelete={canDelete}
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
