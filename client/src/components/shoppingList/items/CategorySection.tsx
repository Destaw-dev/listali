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
    <section
      className={cn(
        "rounded-2xl px-2 py-3 sm:px-3",
        tone === "purchased" && "bg-success-50/40"
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-2xl px-2 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-card shadow-inner">
            {icon}
          </div>
          <div className="text-start">
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
            <p className="text-xs text-text-muted">
              {totalItems} {tItems("items")}
            </p>
          </div>
        </div>

        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-muted" />
        )}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-5 px-1 sm:px-2">
          {groups.map((group) => (
            <div key={group.categoryId} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
                <ShoppingBag className="h-4 w-4" />
                <span>{group.categoryName}</span>
                <span className="text-text-muted/70">({group.items.length})</span>
              </div>

              <div className="space-y-3">
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

