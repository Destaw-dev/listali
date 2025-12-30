"use client";

import { memo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button, Input, TextArea, Dropdown } from "../../common";
import { useModalScrollLock } from "../../../hooks/useModalScrollLock";
import { useAvailableCategories } from "../../../hooks/useItems";
import { itemSchema } from "../../../lib/schemas";
import { z } from "zod";

import { IItem, ICategory } from "../../../types";

interface EditItemModalProps {
  item: IItem | null;
  onClose: () => void;
  onSubmit: (itemData: {
    name?: string;
    quantity?: number;
    unit?: string;
    category?: string;
    brand?: string;
    priority?: 'low' | 'medium' | 'high';
    notes?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export const EditItemModal = memo(function EditItemModal({
  item,
  onClose,
  onSubmit,
  isLoading = false,
}: EditItemModalProps) {
  const t = useTranslations("AddItemModal");
  const tItems = useTranslations("ShoppingListItems");
  const { data: categories = [] } = useAvailableCategories();

  useModalScrollLock(!!item);

  const isFromCatalog = !!(item && !item.isManualEntry && item.product);
  const isPartiallyPurchasedForSchema = 
    !!(item?.isPartiallyPurchased || (item?.purchasedQuantity && item.purchasedQuantity > 0 && item.purchasedQuantity < item.quantity));
  const purchasedQtyForSchema = item?.purchasedQuantity || 0;

  const itemSchemaInstance = isPartiallyPurchasedForSchema
    ? itemSchema(t).extend({
        quantity: z.number()
          .min(purchasedQtyForSchema, `הכמות חייבת להיות לפחות ${purchasedQtyForSchema} (הכמות שנקנתה)`)
          .max(10000, t('quantityMax')),
      })
    : itemSchema(t);
  type ItemFormData = z.infer<typeof itemSchemaInstance>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchemaInstance),
    defaultValues: {
      name: "",
      quantity: 1,
      unit: "piece",
      category: "",
      priority: "medium",
      notes: "",
      brand: "",
    },
  });

  useEffect(() => {
    if (item) {
      reset({
        name: item.name || "",
        quantity: item.quantity || 1,
        unit: item.unit || "piece",
        category: typeof item.category === 'string' ? item.category : item.category?._id || "",
        priority: item.priority || "medium",
        notes: item.notes || "",
        brand: item.brand || (typeof item.product === 'object' && item.product !== null && 'brand' in item.product ? (item.product as { brand?: string }).brand : '') || "",
      });
    }
  }, [item, reset]);

  const isPartiallyPurchased = 
    !!(item?.isPartiallyPurchased || (item?.purchasedQuantity && item.purchasedQuantity > 0 && item.purchasedQuantity < item.quantity));
  const purchasedQty = item?.purchasedQuantity || 0;
  const currentQuantity = watch("quantity") || item?.quantity || 0;
  const unitLabel = item?.unit ? tItems(String(item.unit)) : "";

  const onSubmitForm = async (data: ItemFormData) => {
    if (isFromCatalog) {
      await onSubmit({
        quantity: data.quantity,
        priority: data.priority,
        notes: data.notes || undefined,
      });
    } else {
      await onSubmit({
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        category: data.category || undefined,
        brand: data.brand || undefined,
        priority: data.priority,
        notes: data.notes || undefined,
      });
    }
  };

  if (!item) return null;

  const units = [
    { value: "piece", label: tItems("piece") },
    { value: "kg", label: tItems("kg") },
    { value: "g", label: tItems("g") },
    { value: "l", label: tItems("l") },
    { value: "ml", label: tItems("ml") },
    { value: "package", label: tItems("package") },
    { value: "box", label: tItems("box") },
    { value: "bag", label: tItems("bag") },
    { value: "bottle", label: tItems("bottle") },
    { value: "can", label: tItems("can") },
  ];

  const priorityOptions = [
    { value: "low", label: t("priorityLow") },
    { value: "medium", label: t("priorityMedium") },
    { value: "high", label: t("priorityHigh") },
  ];

  const categoryOptions = [
    { value: "", label: t("selectCategory") },
    ...categories.map((cat: ICategory) => ({
      value: cat._id,
      label: cat.name,
    })),
  ];


  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
      aria-labelledby="edit-item-dialog-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-card shadow-2xl transition-all animate-[fadeIn_.15s_ease-out] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 px-6 pt-6 pb-4 sticky top-0 bg-card border-b border-border">
          <h3 id="edit-item-dialog-title" className="text-lg font-semibold text-text-primary">
            {tItems("editItem") || "ערוך פריט"}
          </h3>
          <Button variant="ghost" size="md" onClick={onClose} aria-label={t("cancel")} disabled={isLoading}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        <form onSubmit={handleSubmit(onSubmitForm)} className="px-6 pb-6 pt-4 space-y-4">
          {isFromCatalog && (
            <div className="mb-4 p-3 bg-primaryT-50 dark:bg-primaryT-900/20 rounded-lg border border-primaryT-100 ">
              <p className="text-sm text-primary dark:text-primaryT-200">
                {tItems("catalogItemEditNote") || "זהו מוצר מהקטלוג. ניתן לערוך רק כמות, עדיפות והערות."}
              </p>
            </div>
          )}

          {isPartiallyPurchased && (
            <div className="mb-4 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-100 dark:border-warning-800 space-y-2">
              <p className="text-sm font-medium text-warning dark:text-warningT-100">
                {tItems("partiallyPurchasedEditTitle") || "מוצר זה נקנה חלקית"}
              </p>
              <div className="text-sm text-warning dark:text-warningT-200 space-y-1">
                <p>
                  {tItems("purchasedQuantityLabel", { 
                    purchased: purchasedQty, 
                    total: item.quantity, 
                    unit: unitLabel 
                  }) || `נקנה: ${purchasedQty}/${item.quantity} ${unitLabel}`}
                </p>
                <p>
                  {tItems("remainingQuantityLabel", { 
                    remaining: item.quantity - purchasedQty, 
                    unit: unitLabel 
                  }) || `נותר: ${item.quantity - purchasedQty} ${unitLabel}`}
                </p>
              </div>
              {currentQuantity < purchasedQty && (
                <p className="text-sm font-medium text-error dark:text-error-400 mt-2">
                  {tItems("quantityWarning", { 
                    newQuantity: currentQuantity, 
                    purchasedQuantity: purchasedQty 
                  }) || `⚠️ שים לב: הכמות החדשה (${currentQuantity}) קטנה מהכמות שנקנתה (${purchasedQty}). הכמות שנקנתה תתעדכן אוטומטית.`}
                </p>
              )}
            </div>
          )}
                <Input
                  {...register("name")}
                  label={t("itemName")}
                  placeholder={t("itemNamePlaceholder")}
                  error={errors.name?.message}
                  disabled={ Boolean(isFromCatalog) || isLoading}

                />

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      {...register("quantity", { valueAsNumber: true })}
                      type="number"
                      label={t("quantity")}
                      min={isPartiallyPurchased ? purchasedQty : 1}
                      step="1"
                      error={errors.quantity?.message}
                      disabled={isLoading}
                      />
                    {isPartiallyPurchased && (
                      <p className="text-xs text-slate-500 mt-1">
                        {tItems("purchasedInfo", { 
                          purchased: purchasedQty, 
                          unit: unitLabel 
                        }) || `נקנה כבר: ${purchasedQty} ${unitLabel}`}
                      </p>
                    )}
                  </div>
                  <Dropdown
                  label={t("unit")}
                    placeholder={t("unit")}
                    variant="default"
                    size="md"
                    fullWidth
                    error={errors.unit?.message}
                    options={units}
                    value={watch("unit")}
                    onSelect={(value) => setValue("unit", value as string)}
                    disabled={isFromCatalog || isLoading}
                  />
              </div>

                <Dropdown
                  placeholder={t("selectCategory")}
                  variant="default"
                  label={t("category")}
                  size="md"
                  fullWidth
                  error={errors.category?.message}
                  options={categoryOptions}
                  value={watch("category") || ""}
                  onSelect={(value) => setValue("category", value as string)}
                  disabled={isFromCatalog || isLoading}
                />

                <Input
                  {...register("brand")}
                  label={tItems("brandLabel") || "מותג"}
                  placeholder={tItems("brandLabel") || "מותג"}
                  error={errors.brand?.message}
                  disabled={isFromCatalog || isLoading}
                />

            <Dropdown
              placeholder={t("priority")}
              variant="default"
              label={t("priority")}
              size="md"
              fullWidth
              error={errors.priority?.message}
              options={priorityOptions}
              value={watch("priority")}
              onSelect={(value) => setValue("priority", value as 'low' | 'medium' | 'high')}
              disabled={isLoading}
            />

            <TextArea
              {...register("notes")}
              rows={3}
              label={t("notes")}
              placeholder={t("notesPlaceholder")}
              error={errors.notes?.message}
              disabled={isLoading}
            />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={onClose}
              disabled={isLoading}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? (tItems("updating") || "מעדכן...") : (tItems("update") || "עדכן")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});

