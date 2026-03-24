"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Plus, Sparkles } from "lucide-react";
import { usePopularItems, useCreateMultipleItems } from "../../hooks/useItems";
import { IItem } from "../../types";
import { Button } from "../common";
import { extractNameFromProduct } from "../../lib/utils";

interface SmartSuggestionsProps {
  groupId: string;
  listId: string;
  currentItems: IItem[];
}

export function SmartSuggestions({ groupId, listId, currentItems }: SmartSuggestionsProps) {
  const t = useTranslations("SmartSuggestions");
  const { data: popularItems = [] } = usePopularItems(groupId);
  const createItemsMutation = useCreateMultipleItems();

  const suggestions = useMemo(() => {
    if (!popularItems.length) return [];

    const normalize = (s: string) => s.toLowerCase().trim();
    const currentNames = new Set(
      currentItems.map((item) => normalize(extractNameFromProduct(item) || ""))
    );

    return popularItems
      .filter((item) => !currentNames.has(normalize(item.name)))
      .slice(0, 5);
  }, [popularItems, currentItems]);

  const handleAdd = async (item: { name: string; defaultUnit?: string; category?: { _id: string } | string }) => {
    await createItemsMutation.mutateAsync([{
      name: item.name,
      quantity: 1,
      unit: item.defaultUnit || 'piece',
      category: typeof item.category === 'object' ? item.category?._id : item.category,
      shoppingListId: listId,
    }]);
  };

  if (suggestions.length === 0) return null;

  return (
    <section className="rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 p-4 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-100 dark:border-indigo-900/50">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
          {t("title")}
        </h3>
      </div>
      
      <ul role="list" aria-label={t("title")} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {suggestions.map((item) => (
          <li key={item.product?._id ?? item._id.product ?? item.name}
            className="flex min-w-[140px] flex-col gap-2 rounded-xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800"
          >
            <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {item.name}
            </span>
            <Button
              size="xs"
              variant="outline"
              className="w-full justify-center border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-indigo-800 dark:hover:bg-indigo-900/50"
              onClick={() => handleAdd(item)}
              disabled={createItemsMutation.isPending}
              icon={<Plus className="h-3 w-3" />}
            >
              {t("add")}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
