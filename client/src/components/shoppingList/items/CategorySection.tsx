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
          "group flex w-full items-center justify-between py-3 px-3 rounded-xl transition-all duration-200 hover:bg-surface/50 active:scale-[0.99]",
          tone === "purchased" ? "opacity-70" : "opacity-100"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex size-9 items-center justify-center rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-105",
            tone === "purchased"
              ? "bg-surface-hover text-text-secondary"
              : "bg-[var(--color-icon-primary-bg)] text-[var(--color-icon-primary-fg)]"
          )}>
            {icon}
          </div>
          <div className="text-start">
            <h3 className="text-[15px] font-bold text-text-primary">{title}</h3>
            <span className="text-[11px] font-medium text-text-muted">
              {totalItems} {tItems("items")}
            </span>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-text-secondary transition-colors group-hover:text-text-primary" />
        ) : (
          <ChevronDown className="h-5 w-5 text-text-secondary transition-colors group-hover:text-text-primary" />
        )}
      </button>

      {isOpen && (
        <div className="mt-1">
          {groups.map((group) => (
            <div key={group.categoryId} className="mt-4 first:mt-2">
              <div className="bg-surface/60 flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary mb-1 border border-border/30">
                <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                <span className="text-[12px] font-bold tracking-tight text-text-primary uppercase">
                  {group.categoryName}
                </span>
                <span className="text-[10px] font-semibold text-text-muted bg-surface-hover px-1.5 py-0.5 rounded-full">
                  {group.items.length}
                </span>
              </div>

              <div className="space-y-0">
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
