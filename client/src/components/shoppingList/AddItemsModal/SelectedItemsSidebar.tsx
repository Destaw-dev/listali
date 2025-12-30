import React, { memo, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Trash2, ShoppingCart, Plus } from 'lucide-react';
import { Button } from '@/components/common';
import { ItemFormSingle } from './ItemFormSingle';
import { getProductUnit, findExistingItem, findExistingItemById } from '@/lib/utils';
import { itemsSchema } from '@/lib/schemas';
import { IProduct, IManualProduct, ICategory, ItemInput, IItem, isManualProduct } from '@/types';

interface SelectedItemsSidebarProps {
  selectedProducts: (IProduct | IManualProduct)[];
  onProductRemove: (productId: string) => void;
  onSubmit: (items: ItemInput[]) => Promise<void>;
  onClose: () => void;
  onAddManual: () => void;
  onClearAllItems: () => void;
  categories: ICategory[];
  isSubmitting: boolean;
  t: (key: string) => string;
  existingItems?: IItem[]; // Items that already exist in the shopping list
  onMergeDuplicate?: (existingItemId: string, newQuantity: number) => Promise<void>;
  onEditExisting?: (existingItemId: string) => void;
}

export const SelectedItemsSidebar = memo(({
  selectedProducts,
  onProductRemove,
  onSubmit,
  onClose,
  onAddManual,
  onClearAllItems,
  categories,
  isSubmitting,
  t,
  existingItems = [],
  onMergeDuplicate,
}: SelectedItemsSidebarProps) => {
  const tForm = useTranslations('AddItemsModalItemForm');
  const tModal = useTranslations('AddItemModal');

  const itemsSchemaInstance = itemsSchema(t);
  
  type ItemsInput = z.infer<typeof itemsSchemaInstance>;

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ItemsInput>({
    resolver: zodResolver(itemsSchemaInstance),
    defaultValues: { items: [] },
  });

  const { fields, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");

  useEffect(() => {
    if (selectedProducts.length > 0) {
      const items = selectedProducts.map((product) => {
        const categoryId = isManualProduct(product) ? undefined : product.categoryId || undefined;

        const defaultUnit = isManualProduct(product)
          ? "piece"
          : getProductUnit({
              defaultUnit: product.defaultUnit,
              units: product.units,
              name: product.name,
            });

        return {
          name: product.name || "",
          quantity: 1,
          unit: defaultUnit,
          category: categoryId,
          priority: "medium" as const,
          notes: "",
          brand: product.brand || "",
          description: "",
          product: isManualProduct(product) ? undefined : product._id,
          image: product.image || "",
          units: product.units || [],
          isManualEntry: isManualProduct(product),
        };
      });

      reset({ items });
    } else {
      reset({ items: [] });
    }
  }, [selectedProducts, reset]);

  const handleFormSubmit = async (data: ItemsInput) => {
    await onSubmit(data.items);
  };

  const handleRemoveItem = (index: number) => {
    const item = watchedItems?.[index];
    remove(index);
    if (item?.product) {
      onProductRemove(item.product);
    }
  };

  const hasUntreatedDuplicates = useMemo(() => {
    if (!watchedItems || watchedItems.length === 0 || existingItems.length === 0) {
      return false;
    }

    return watchedItems.some((item) => {
      const normalizedName = (item?.name || '').trim().replace(/\s+/g, ' ');
      if (!normalizedName) return false;
      
      const existingItem = item?.product ? findExistingItemById(existingItems, item.product) : null;
      return !!existingItem;
    });
  }, [watchedItems, existingItems]);

  return (
    <div className="h-full flex flex-col bg-surface border-border">
      <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
          <h3 className="text-sm sm:text-lg font-bold text-text-secondary truncate">
            {fields.length === 1 
              ? tModal('selectedProducts', { count: 1 })
              : tModal('selectedProductsPlural', { count: fields.length })}
          </h3>
        </div>
        {fields.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAllItems}
            disabled={isSubmitting}
            icon={<Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />}
            className="flex-shrink-0"
          >
            <span className="hidden sm:inline">{t('clearAllItems')}</span>
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3">
        {fields.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('selectProductsFromCatalog')}</p>
          </div>
        ) : (
          fields.map((field, index) => {
            const item = watchedItems?.[index] as ItemInput | undefined;
            const product: IProduct | IManualProduct | undefined = item?.product 
              ? selectedProducts.find(p => p._id === item.product)
              : selectedProducts[index];
            const units = (product?.units || item?.units || []) as string[];

            // Check if this item is a duplicate
            const normalizedName = (item?.name || '').trim().replace(/\s+/g, ' ');
            const existingItem = existingItems.length > 0 && normalizedName ? findExistingItem(existingItems, {
              name: normalizedName,
              unit: item?.unit || 'piece',
              category: item?.category,
              product: item?.product,
            }) : null;

            return (
              <ItemFormSingle
                key={field.id}
                index={index}
                item={{ 
                  name: item?.name || '',
                  quantity: item?.quantity || 1,
                  unit: item?.unit || 'piece',
                  category: item?.category,
                  priority: item?.priority || 'medium',
                  notes: item?.notes,
                  brand: item?.brand,
                  description: item?.description,
                  product: item?.product || (product ? (typeof product === 'string' ? product : product._id) : undefined),
                  image: item?.image,
                  units,
                  isManual: 'isManual' in (item || {}) && (item as { isManual?: boolean }).isManual === true
                }}
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
                categories={categories}
                onRemove={() => handleRemoveItem(index)}
                canRemove={fields.length > 1}
                t={t}
                existingItem={existingItem || undefined}
                onMerge={onMergeDuplicate && existingItem ? async (newQuantity: number) => {
                  await onMergeDuplicate(existingItem._id, newQuantity);
                  handleRemoveItem(index);
                } : undefined}
              />
            );
          })
        )}
      </div>

      <div className="p-3 sm:p-4 border-t border-border space-y-2 flex-shrink-0">
        <Button
          variant="dashed"
          type="button"
          size="sm"
          fullWidth
          onClick={onAddManual}
          icon={<Plus className="w-3 h-3 sm:w-4 sm:h-4" />}
        >
          <span className="text-xs sm:text-sm">{tForm('addAnotherItem')}</span>
        </Button>
        {hasUntreatedDuplicates && (
            <p className="text-xs text-warning-600 dark:text-warning-400 text-center mt-1">
              {tForm('hasUntreatedDuplicates') || 'יש מוצרים קיימים ברשימה. אנא מזג או הסר אותם לפני הוספה'}
            </p>
          )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            type="button"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            fullWidth
            className="sm:size-lg"
          >
            <span className="text-xs sm:text-base">{tForm('cancel')}</span>
          </Button>
          <Button
            variant="primary"
            type="button"
            size="sm"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={isSubmitting || fields.length === 0 || hasUntreatedDuplicates}
            icon={<Plus className="w-3 h-3 sm:w-4 sm:h-4" />}
            fullWidth
            className="sm:size-lg"
          >
            <span className="text-xs sm:text-base">
              {isSubmitting
                ? tForm('adding')
                : fields.length === 1
                ? tForm('addItems', { count: fields.length })
                : tForm('addItemsPlural', { count: fields.length })}
            </span>
          </Button>

        </div>
      </div>
    </div>
  );
});

SelectedItemsSidebar.displayName = 'SelectedItemsSidebar';
