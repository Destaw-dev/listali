"use client";

import { Button, Input, Dropdown } from "../common";
import { cn } from "../../lib/utils";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Search } from "lucide-react";

export type ShoppingStatusFilter = "all" | "unpurchased" | "purchased";

export interface ShoppingListCategoryStat {
  id: string;
  name: string;
  count: number;
}

interface ShoppingListFiltersProps {
  status: ShoppingStatusFilter;
  onStatusChange: (status: ShoppingStatusFilter) => void;
  category: string;
  onCategoryChange: (categoryId: string) => void;
  categories: ShoppingListCategoryStat[];
  totalItems: number;
  purchasedCount: number;
  unpurchasedCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function ShoppingListFilters({
  status,
  onStatusChange,
  category,
  onCategoryChange,
  categories,
  totalItems,
  purchasedCount,
  unpurchasedCount,
  searchQuery,
  onSearchChange,
}: ShoppingListFiltersProps) {
  const t = useTranslations("ShoppingListPage");

  const statusOptions = useMemo<
    Array<{ value: ShoppingStatusFilter; label: string; badge?: number }>
  >(
    () => [
      {
        value: "all",
        label: t("filters.all"),
        badge: totalItems,
      },
      {
        value: "unpurchased",
        label: t("filters.unpurchased"),
        badge: unpurchasedCount,
      },
      {
        value: "purchased",
        label: t("filters.purchased"),
        badge: purchasedCount,
      },
    ],
    [purchasedCount, t, totalItems, unpurchasedCount]
  );

  const handleStatusClick = (value: ShoppingStatusFilter) => () => {
    if (value === status) return;
    onStatusChange(value);
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t("searchPlaceholder")}
        icon={<Search className="h-4 w-4" />}
        variant='default'
        size="md"
        fullWidth
        containerClassName="w-full"
      />

      <div className="flex flex-wrap gap-2">
        {statusOptions.map(({ value, label, badge }) => {
          const isActive = status === value;
          return (
            <Button
              key={value}
              variant={isActive ? "primary" : "ghost"}
              size="sm"
              rounded
              shadow={isActive}
              onClick={handleStatusClick(value)}
              className={cn(
                "min-w-[120px] whitespace-nowrap transition-all duration-200",
              )}
            >
              <span>{label}</span>
              {typeof badge === "number" && (
                <span
                  className={cn(
                    "ms-2 rounded-full px-2 py-0.5 text-xs",
                    isActive
                      ? "bg-background-100 text-text-primary-700"
                      : "bg-card text-text-muted"
                  )}
                >
                  {badge}
                </span>
              )}
            </Button>
          );
        })}
        {categories.length > 0 && (
        <Dropdown
          options={categories.map((item) => ({
            label: `${item.name} (${item.count})`,
            value: item.id,
          }))}
          value={category}
          onSelect={(value) => onCategoryChange(value as string)}
          placeholder={t("filters.category")}
          variant={'default'}
          size="sm"
          className="min-w-[120px] whitespace-nowrap transition-all duration-200"
          triggerClassName="border-none shadow-sm hover:shadow-md focus:ring-0"

        />
        )}
      </div>
    </div>
  );
}

