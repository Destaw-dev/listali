"use client";

import { Button } from "@/components/common/Button";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

interface AddItemFabProps {
  onClick: () => void;
}

export function AddItemFab({ onClick }: AddItemFabProps) {
  const t = useTranslations("ShoppingList");

  return (
    <div className="fixed bottom-6 right-6 z-40 md:bottom-10 md:right-10">
      <Button
        onClick={onClick}
        rounded
        size="lg"
        className="flex items-center gap-2 bg-gradient-to-r from-primaryT-500 to-secondaryT-500 px-6 py-3 text-base text-text-on-primary shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl md:px-8"
        icon={<Plus className="h-5 w-5" />}
      >
        {t("addItem")}
      </Button>
    </div>
  );
}

