import React, { memo, useEffect, useMemo, useRef, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Trash2, ShoppingCart, Plus } from 'lucide-react';
import { Button } from '../../common';
import { ItemFormSingle } from './ItemFormSingle';
import { 
  getProductUnit, 
  findExistingItem, 
  findExistingItemById, 
  extractImageUrl, 
  extractNameFromProduct 
} from '../../../lib/utils';
import { itemsSchema } from '../../../lib/schemas';
import { 
  IProduct, 
  IManualProduct, 
  ICategory, 
  ItemInput, 
  IItem, 
  isManualProduct 
} from '../../../types';

interface SelectedItemsSidebarProps {
  selectedProducts: (IProduct & { quantity?: number } | IManualProduct)[];
  onProductRemove: (productId: string) => void;
  onSubmit: (items: ItemInput[]) => Promise<void>;
  onClose: () => void;
  onAddManual: () => void;
  onClearAllItems: () => void;
  categories: ICategory[];
  isSubmitting: boolean;
  t: (key: string) => string;
  existingItems?: IItem[];
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

  const itemsSchemaInstance = useMemo(() => itemsSchema(t), [t]);
  type ItemsInput = z.infer<typeof itemsSchemaInstance>;

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ItemsInput>({
    resolver: zodResolver(itemsSchemaInstance),
    defaultValues: { items: [] },
  });

  const { fields, remove, append, replace } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const prevSelectedProductsRef = useRef<string[]>([]);

  const createItemFromProduct = useCallback((product: IProduct | IManualProduct): ItemInput => {
    const categoryId = isManualProduct(product) ? undefined : product.categoryId || undefined;
    const defaultUnit = isManualProduct(product)
      ? "piece"
      : getProductUnit({
          defaultUnit: product.defaultUnit,
          units: product.units,
          name: extractNameFromProduct(product),
        });

    const imageUrl = extractImageUrl(product.image);
    const quantity = (product as IProduct & { quantity?: number }).quantity ?? 1;

    return {
      name: extractNameFromProduct(product) || "",
      quantity,
      unit: defaultUnit,
      category: categoryId,
      priority: "medium" as const,
      notes: "",
      brand: product.brand || "",
      description: "",
      product: isManualProduct(product) ? undefined : product._id,
      image: imageUrl,
      units: product.units || [],
      isManualEntry: isManualProduct(product),
    };
  }, []);

  useEffect(() => {
    const currentSelectedIds = selectedProducts
      .map((p) => p._id)
      .filter((id): id is string => !!id)
      .sort();

    const prevSelectedIds = prevSelectedProductsRef.current;

    const hasChanged =
      currentSelectedIds.length !== prevSelectedIds.length ||
      currentSelectedIds.some((id, index) => id !== prevSelectedIds[index]);

    if (!hasChanged) return;

    prevSelectedProductsRef.current = currentSelectedIds;

    if (selectedProducts.length === 0) {
      if (fields.length > 0) {
        replace([]);
      }
      return;
    }

    const currentProductIds = new Set(
      (watchedItems || [])
        .map((item) => item?.product)
        .filter((id): id is string => !!id)
    );

    const selectedProductIds = new Set(currentSelectedIds);

    const productsToAdd = selectedProducts.filter(
      (product) => product._id && !currentProductIds.has(product._id)
    );

    const indicesToRemove: number[] = [];
    (watchedItems || []).forEach((item, index) => {
      if (item?.product && !selectedProductIds.has(item.product)) {
        indicesToRemove.push(index);
      }
    });

    indicesToRemove.reverse().forEach((index) => remove(index));

    productsToAdd.forEach((product) => {
      append(createItemFromProduct(product));
    });

    if (fields.length === 0 && selectedProducts.length > 0) {
      const initialItems = selectedProducts.map(createItemFromProduct);
      replace(initialItems);
    }
  }, [selectedProducts, append, remove, replace, fields.length, watchedItems, createItemFromProduct]);

  const handleFormSubmit = useCallback(async (data: ItemsInput) => {
    await onSubmit(data.items);
  }, [onSubmit]);

  const handleRemoveItem = useCallback((index: number) => {
    const item = watchedItems?.[index];
    remove(index);
    if (item?.product) {
      onProductRemove(item.product);
    }
  }, [watchedItems, remove, onProductRemove]);

  const hasUntreatedDuplicates = useMemo(() => {
    if (!watchedItems?.length || !existingItems.length) {
      return false;
    }

    return watchedItems.some((item) => {
      if (!item?.name?.trim()) return false;
      
      const existingItem = item?.product 
        ? findExistingItemById(existingItems, item.product) 
        : null;
      
      return !!existingItem;
    });
  }, [watchedItems, existingItems]);

  const renderEmptyState = () => (
    <div className="text-center py-8 text-text-muted">
      <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{t('selectProductsFromCatalog')}</p>
    </div>
  );

  const renderItemForm = useCallback((field: ItemInput & { id: string }, index: number) => {
    const item = watchedItems?.[index] as ItemInput | undefined;
    
    const product: IProduct | IManualProduct | undefined = item?.product 
      ? selectedProducts.find(p => p._id === item.product)
      : selectedProducts[index];
    
    const units = (product?.units || item?.units || []) as string[];

    const normalizedName = item?.name?.trim().replace(/\s+/g, ' ') || '';
    const existingItem = existingItems.length > 0 && normalizedName 
      ? findExistingItem(existingItems, {
          name: normalizedName,
          unit: item?.unit || 'piece',
          category: item?.category,
          product: item?.product,
        }) 
      : null;

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
          image: extractImageUrl(item?.image),
          units,
          isManual: item?.isManualEntry,
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
        onMerge={onMergeDuplicate && existingItem 
          ? async (newQuantity: number) => {
              await onMergeDuplicate(existingItem._id, newQuantity);
              handleRemoveItem(index);
            } 
          : undefined
        }
      />
    );
  }, [watchedItems, selectedProducts, existingItems, register, watch, setValue, errors, categories, handleRemoveItem, fields.length, t, onMergeDuplicate]);

  return (
    <div className="h-full flex flex-col bg-background border-border">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-text-primary flex-shrink-0" />
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

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3">
        {fields.length === 0 ? renderEmptyState() : fields.map(renderItemForm)}
      </div>

      {/* Footer Actions */}
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
          <p className="text-xs text-warning-600 text-center mt-1">
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