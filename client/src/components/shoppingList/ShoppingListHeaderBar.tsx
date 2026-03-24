"use client";

import { useState } from "react";
import { Button } from "../common";
import { cn } from "../../lib/utils";
import { Calendar, Plus, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "../../i18n/navigation";
import { ArrowIcon } from "../common/Arrow";
import { IItem, IShoppingList } from "../../types";
import RecipeImportModal, { EditableItem } from "./RecipeImportModal";
import { useCreateMultipleItems } from "../../hooks/useItems";

interface ShoppingListHeaderBarProps {
  shoppingList: IShoppingList;
  groupId: string;
  locale: string;
  onAddItems: () => void;
  currentItems: IItem[];
}

export function ShoppingListHeaderBar({
  shoppingList,
  groupId,
  locale,
  onAddItems,
  currentItems,
}: ShoppingListHeaderBarProps) {
  const router = useRouter();
  const t = useTranslations("ShoppingList");
  const tNavigation = useTranslations("navigation");
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  
  const createItemsMutation = useCreateMultipleItems();

  const handleAddRecipeItems = async (items: EditableItem[]) => {
    const formattedItems = items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.categoryId,
      product: item.productId,
      shoppingListId: shoppingList._id,
      isManualEntry: !item.productId,
    }));

    await createItemsMutation.mutateAsync(formattedItems);
  };

  const formattedDate = new Intl.DateTimeFormat(locale ?? "he-IL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <>
    <header className="flex flex-col gap-6 rounded-3xl bg-card p-6 shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <Button
            onClick={() => router.push(`/groups/${groupId}?tab=lists`)}
            variant='surface'
            size='md'
            rounded
            aria-label={tNavigation("back")}
          >
            <ArrowIcon className="text-text-primary"/>
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
                    "bg-primary text-text-on-primary"
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
            onClick={() => setIsRecipeModalOpen(true)}
            variant="outline"
            icon={<Wand2 className="h-4 w-4" />}
          >
            {t("importRecipe")}
          </Button>
          <Button
            onClick={onAddItems}
            icon={<Plus className="h-5 w-5" />}
          >
            {t("addItem")}
          </Button>
        </div>
      </div>

      <div className="flex gap-3 lg:hidden">
        <Button
          onClick={() => setIsRecipeModalOpen(true)}
          variant="outline"
          className="flex-1 py-3 shadow-sm"
          icon={<Wand2 className="h-4 w-4" />}
        >
          {t("importRecipe")}
        </Button>
        <Button
          onClick={onAddItems}
          icon={<Plus className="h-5 w-5" />}
          className="flex-[2] bg-primary py-3 text-text-on-primary shadow-lg transition hover:bg-primary/90 hover:shadow-xl"
        >
          {t("addItem")}
        </Button>
      </div>
    </header>

    <RecipeImportModal
      isOpen={isRecipeModalOpen}
      onClose={() => setIsRecipeModalOpen(false)}
      onAddItems={handleAddRecipeItems}
      currentItems={currentItems}
    />
    </>
  );
}
