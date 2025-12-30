"use client";

import { Button } from "../common";
import { cn } from "../../lib/utils";
import { Calendar, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowIcon } from "../common/Arrow";
import { IShoppingList } from "../../types";

interface ShoppingListHeaderBarProps {
  shoppingList: IShoppingList;
  groupId: string;
  locale: string;
  onAddItems: () => void;
}

export function ShoppingListHeaderBar({
  shoppingList,
  groupId,
  locale,
  onAddItems,
}: ShoppingListHeaderBarProps) {
  const router = useRouter();
  const t = useTranslations("ShoppingList");

  const formattedDate = new Intl.DateTimeFormat(locale ?? "he-IL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="flex flex-col gap-6 rounded-3xl bg-card p-6 shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <Button
            onClick={() => router.push(`/${locale}/groups/${groupId}?tab=lists`)}
            variant='surface'
            size='md'
            rounded
            aria-label="Back to lists"
          >
            <ArrowIcon />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-text-primary">
                {shoppingList?.name}
              </h1>
              {shoppingList?.priority && (
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    "bg-primaryT-100 text-primaryT-700"
                  )}
                >
                  {shoppingList.priority}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-text-muted">
              {shoppingList?.description || t("description")}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Button
            onClick={onAddItems}
            icon={<Plus className="h-5 w-5" />}
            className="bg-gradient-to-r from-primaryT-500 to-secondaryT-500 px-5 py-2.5 text-text-on-primary shadow-xl transition hover:shadow-2xl"
          >
            {t("addItem")}
          </Button>
        </div>
      </div>

      <div className="lg:hidden">
        <Button
          onClick={onAddItems}
          fullWidth
          icon={<Plus className="h-5 w-5" />}
          className="bg-gradient-to-r from-primaryT-500 to-secondaryT-500 py-3 text-text-on-primary shadow-xl transition hover:shadow-2xl"
        >
          {t("addItem")}
        </Button>
      </div>
    </header>
  );
}

