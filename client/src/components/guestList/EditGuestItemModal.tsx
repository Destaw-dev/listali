"use client";

import { memo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Edit } from "lucide-react";
import { z } from "zod";
import { Button, Input, TextArea, Dropdown, Modal } from "../common";
import { useModalScrollLock } from "../../hooks/useModalScrollLock";
import { useAvailableCategories } from "../../hooks/useItems";
import { GuestItem, ICategory } from "../../types";
import { useGuestListsStore } from "../../store/guestListsStore";

interface EditGuestItemModalProps {
  item: GuestItem | null;
  listId: string;
  onClose: () => void;
  categories?: ICategory[];
}

const editGuestItemSchema = z.object({
  name: z.string().min(1, "שם הפריט נדרש").max(100, "שם הפריט לא יכול להיות יותר מ-100 תווים"),
  quantity: z.number().min(1, "כמות חייבת להיות לפחות 1").max(999, "כמות לא יכולה להיות יותר מ-999"),
  unit: z.string().optional(),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
  brand: z.string().optional(),
});

type EditGuestItemFormData = z.infer<typeof editGuestItemSchema>;

export const EditGuestItemModal = memo(function EditGuestItemModal({
  item,
  listId,
  onClose,
  categories = [],
}: EditGuestItemModalProps) {
  const t = useTranslations("AddItemModal");
  const tItems = useTranslations("ShoppingListItems");
  const { updateItem } = useGuestListsStore();

  useModalScrollLock(!!item);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<EditGuestItemFormData>({
    resolver: zodResolver(editGuestItemSchema),
    defaultValues: {
      name: item?.name || "",
      quantity: item?.quantity || 1,
      unit: item?.unit || "piece",
      categoryId: item?.categoryId || "",
      notes: item?.notes || "",
      brand: item?.brand || "",
    },
  });

  useEffect(() => {
    if (item) {
      reset({
        name: item.name || "",
        quantity: item.quantity || 1,
        unit: item.unit || "piece",
        categoryId: item.categoryId || "",
        notes: item.notes || "",
        brand: item.brand || "",
      });
    }
  }, [item, reset]);

  const onSubmit = async (data: EditGuestItemFormData) => {
    if (!item) return;

    try {
      updateItem(listId, item.id, {
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        categoryId: data.categoryId || undefined,
        notes: data.notes || undefined,
        brand: data.brand || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Error updating guest item:", error);
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  if (!item) return null;

  return (
    <Modal
      title={tItems("editItem") || "ערוך פריט"}
      onClose={onClose}
      iconHeader={
        <div className="p-2 bg-primary-500 rounded-full">
          <Edit className="w-5 h-5 text-text-primary" />
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register("name")}
          type="text"
          placeholder={t("itemName") || "שם הפריט"}
          error={errors.name?.message}
          label={t("itemName") || "שם הפריט"}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            {...register("quantity", { valueAsNumber: true })}
            type="number"
            placeholder="1"
            error={errors.quantity?.message}
            label={t("quantity") || "כמות"}
            min={1}
          />
          <Dropdown
            {...register("unit")}
            label={t("unit") || "יחידה"}
            options={[
              { value: "piece", label: tItems("piece") || "יחידה" },
              { value: "kg", label: tItems("kg") || "ק\"ג" },
              { value: "g", label: tItems("g") || "גרם" },
              { value: "l", label: tItems("l") || "ליטר" },
              { value: "ml", label: tItems("ml") || "מ\"ל" },
              { value: "package", label: tItems("package") || "חבילה" },
            ]}
            value={watch("unit") || "piece"}
            onSelect={(value) => setValue("unit", value as string)}
          />
        </div>

        {categories.length > 0 && (
          <Dropdown
            {...register("categoryId")}
            label={t("category") || "קטגוריה"}
            options={[
              { value: "", label: t("noCategory") || "ללא קטגוריה" },
              ...categories.map((cat) => ({
                value: cat._id || "",
                label: cat.name || "",
              })),
            ]}
            value={watch("categoryId") || ""}
            onSelect={(value) => setValue("categoryId", value as string)}
          />
        )}

        <Input
          {...register("brand")}
          type="text"
          placeholder={t("brand") || "מותג (אופציונלי)"}
          error={errors.brand?.message}
          label={t("brand") || "מותג"}
        />

        <TextArea
          {...register("notes")}
          placeholder={t("notes") || "הערות (אופציונלי)"}
          error={errors.notes?.message}
          label={t("notes") || "הערות"}
          rows={3}
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            fullWidth
          >
            {t("cancel") || "ביטול"}
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
          >
            {t("save") || "שמור"}
          </Button>
        </div>
      </form>
    </Modal>
  );
});
