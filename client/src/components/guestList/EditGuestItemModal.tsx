"use client";

import { memo, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Edit } from "lucide-react";
import { z } from "zod";
import { Button, Input, TextArea, Dropdown, Modal } from "../common";
import { useModalScrollLock } from "../../hooks/useModalScrollLock";
import { GuestItem, ICategory } from "../../types";
import { useGuestListsStore } from "../../store/guestListsStore";
import { useNotification } from "../../contexts/NotificationContext";

interface EditGuestItemModalProps {
  item: GuestItem | null;
  listId: string;
  onClose: () => void;
  categories?: ICategory[];
}

type EditGuestItemFormData = {
  name: string;
  quantity: number;
  unit?: string;
  categoryId?: string;
  notes?: string;
  brand?: string;
};

export const EditGuestItemModal = memo(function EditGuestItemModal({
  item,
  listId,
  onClose,
  categories = [],
}: EditGuestItemModalProps) {
  const t = useTranslations("AddItemModal");
  const tItems = useTranslations("ShoppingListItems");
  const { updateItem } = useGuestListsStore();
  const { showError } = useNotification();

  useModalScrollLock(!!item);

  const editGuestItemSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("nameRequired")).max(100, t("nameMaxLength")),
        quantity: z
          .number()
          .min(1, t("quantityMin"))
          .max(999, t("quantityMaxGuest")),
        unit: z.string().optional(),
        categoryId: z.string().optional(),
        notes: z.string().optional(),
        brand: z.string().optional(),
      }),
    [t]
  );

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
        showError(error.message);
      } else {
        showError("notifications.unknownError");
      }
    }
  };

  if (!item) return null;

  return (
    <Modal
      title={tItems("editItem")}
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
          placeholder={t("itemName")}
          error={errors.name?.message}
          label={t("itemName")}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            {...register("quantity", { valueAsNumber: true })}
            type="number"
            placeholder="1"
            error={errors.quantity?.message}
            label={t("quantity")}
            min={1}
          />
          <Dropdown
            {...register("unit")}
            label={t("unit")}
            options={[
              { value: "piece", label: tItems("piece") },
              { value: "kg", label: tItems("kg") },
              { value: "g", label: tItems("g") },
              { value: "l", label: tItems("l") },
              { value: "ml", label: tItems("ml") },
              { value: "package", label: tItems("package") },
            ]}
            value={watch("unit") || "piece"}
            onSelect={(value) => setValue("unit", value as string)}
          />
        </div>

        {categories.length > 0 && (
          <Dropdown
            {...register("categoryId")}
            label={t("category")}
            options={[
              { value: "", label: t("noCategory") },
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
          placeholder={t("brand")}
          error={errors.brand?.message}
          label={t("brand")}
        />

        <TextArea
          {...register("notes")}
          placeholder={t("notes")}
          error={errors.notes?.message}
          label={t("notes")}
          rows={3}
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            fullWidth
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
          >
            {t("save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
});
