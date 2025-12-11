"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Package, X, Trash2 } from "lucide-react";
import { useAvailableCategories } from "@/hooks/useItems";
import { getProductUnit } from "@/lib/utils";
import { ProductsSelectionView } from "./AddItemsModal/ProductsSelectionView";
import { ItemForm } from "./AddItemsModal/ItemForm";
 

const itemSchema = z.object({
  name: z.string().min(1, "nameRequired").max(100, "nameMaxLength"),
  quantity: z.number().min(0.1, "quantityMin").max(10000, "quantityMax"),
  unit: z.string().min(1, "unitRequired").max(20, "unitMaxLength"),
  category: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  notes: z.string().max(500, "notesMaxLength").optional(),
  brand: z.string().max(100).optional(),
  description: z.string().max(200).optional(),
  product: z.string().optional(),
  image: z.string().optional(),
});

const itemsSchema = z.object({
  items: z.array(itemSchema).min(1, "atLeastOneItem"),
});

type ItemsFormData = z.infer<typeof itemsSchema>;
type SingleItemFormData = z.infer<typeof itemSchema>;

interface AddItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (items: SingleItemFormData[]) => Promise<void>;
  listId: string;
}


export default function AddItemsModal({
  isOpen,
  onClose,
  onSubmit,
  listId,
}: AddItemsModalProps) {
  const t = useTranslations("AddItemModal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProductsList, setShowProductsList] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const { data: categories = [] } = useAvailableCategories();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ItemsFormData>({
    resolver: zodResolver(itemsSchema),
    defaultValues: { items: [] },
  });

  const { fields, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");

  // Memoized callbacks
  const handleProductSelect = useCallback((product: any) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.some((p) => p._id === product._id);
      if (isSelected) {
        return prev.filter((p) => p._id !== product._id);
      }
      return [...prev, product];
    });
  }, []);

  const handleContinueToFillDetails = useCallback(() => {
    const items = selectedProducts.map((product) => {
      const categoryId = product.categoryId
        ? typeof product.categoryId === "string"
          ? product.categoryId
          : product.categoryId._id || product.categoryId
        : "";

      return {
        name: product.name || "",
        quantity: 1,
        unit: getProductUnit({
          defaultUnit: product.defaultUnit,
          units: product.units,
          name: product.name,
        }),
        category: categoryId,
        priority: "medium" as const,
        notes: "",
        brand: product.brand || "",
        description: product.description || "",
        product: product._id,
        image: product.image || "",
      };
    });

    reset({ items });
    setShowProductsList(false);
  }, [selectedProducts, reset]);

  const addManualItem = useCallback(() => {
    const items: any[] = [];

    if (selectedProducts.length > 0) {
      items.push(
        ...selectedProducts.map((product) => {
          const categoryId = product.categoryId
            ? typeof product.categoryId === "string"
              ? product.categoryId
              : product.categoryId._id || product.categoryId
            : "";

          return {
            name: product.name || "",
            quantity: 1,
            unit: product.defaultUnit || product.units?.[0] || "piece",
            category: categoryId,
            priority: "medium" as const,
            notes: "",
            brand: product.brand || "",
            description: product.description || "",
            product: product._id,
            image: product.image || "",
          };
        })
      );
    }

    items.push({
      name: "",
      quantity: 1,
      unit: "piece",
      priority: "medium" as const,
      notes: "",
      brand: "",
      description: "",
      image: "",
    });

    reset({ items });
    setShowProductsList(false);
  }, [selectedProducts, reset]);

  const selectedProductIds = useMemo(
    () => selectedProducts.map((p) => p._id),
    [selectedProducts]
  );

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      reset();
      setSelectedProducts([]);
      setShowProductsList(true);
      onClose();
    }
  }, [isSubmitting, reset, onClose]);

  const handleFormSubmit = useCallback(
    async (data: ItemsFormData) => {
      setIsSubmitting(true);
      try {
        await onSubmit(data.items);
        handleClose();
      } catch (error) {
        // Error handled by parent
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, handleClose]
  );

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedProducts([]);
      setShowProductsList(true);
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const modalTitle = showProductsList
    ? selectedProducts.length > 0
      ? selectedProducts.length === 1
        ? t("selectedProducts", { count: selectedProducts.length })
        : t("selectedProductsPlural", { count: selectedProducts.length })
      : t("addNewItem")
    : t("fillDetails", { count: fields.length });

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-surface shadow-xl rounded-none sm:rounded-2xl w-full sm:max-w-3xl h-full  sm:max-h-[100vh] flex flex-col">
        {/* Modal Header */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-surface-hover rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-secondary">{modalTitle}</h2>
              </div>
              {selectedProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedProducts([])}
                  className="text-xs text-text-primary hover:underline p-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('clearSelection')}
                </button>
              )}
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {showProductsList ? (
            <ProductsSelectionView
              onProductSelect={handleProductSelect}
              onAddManual={addManualItem}
              selectedProductIds={selectedProductIds}
              selectedProductsCount={selectedProducts.length}
              onContinue={handleContinueToFillDetails}
              isSubmitting={isSubmitting}
              t={t}
            />
          ) : (
            <ItemForm
              fields={fields}
              register={register}
              errors={errors}
              categories={categories}
              watchedItems={watchedItems}
              remove={(index) => {
                const item = watchedItems?.[index];
                remove(index);
                if (item?.product) {
                  setSelectedProducts((prev) =>
                    prev.filter((p) => p._id !== item.product)
                  );
                }
              }}
              onBack={() => {
                const currentProductIds = new Set(
                  watchedItems
                    ?.map((item: any) => item?.product)
                    .filter(Boolean) || []
                );
                setSelectedProducts((prev) =>
                  prev.filter((p) => currentProductIds.has(p._id))
                );
                setShowProductsList(true);
              }}
              onAddManual={addManualItem}
              onSubmit={handleSubmit(handleFormSubmit)}
              onClose={handleClose}
              isSubmitting={isSubmitting}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
}
