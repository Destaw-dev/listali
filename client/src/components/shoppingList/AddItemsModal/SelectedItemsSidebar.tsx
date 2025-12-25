import React, { memo, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Trash2, ShoppingCart, Plus, X } from 'lucide-react';
import { QuantityStepper } from './QuantityStepper';
import { UnitChips } from './UnitChips';
import { Button, Dropdown, DropdownOption } from '@/components/common';
import { getProductUnit } from '@/lib/utils';

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

interface SelectedItemsSidebarProps {
  selectedProducts: any[];
  onProductRemove: (productId: string) => void;
  onItemsChange: (items: SingleItemFormData[]) => void;
  onSubmit: (items: SingleItemFormData[]) => Promise<void>;
  onClose: () => void;
  onAddManual: () => void;
  onClearAllItems: () => void;
  categories: any[];
  isSubmitting: boolean;
  t: (key: string) => string;
}

interface ItemFormSingleProps {
  index: number;
  item: any & { units?: string[] };
  register: any;
  watch: any;
  setValue: any;
  errors: any;
  categories: any[];
  onRemove: () => void;
  canRemove: boolean;
  t: (key: string) => string;
}

const ItemFormSingle = memo(({
  index,
  item,
  register,
  watch,
  setValue,
  errors,
  categories,
  onRemove,
  canRemove,
  t,
}: ItemFormSingleProps) => {
  const tForm = useTranslations('AddItemsModalItemForm');
  const quantity = watch(`items.${index}.quantity`);
  const unit = watch(`items.${index}.unit`);
  const categoryValue = watch(`items.${index}.category`);
  const isManual = item?.isManual || item?.product?.isManual;

  // Prepare dropdown options for categories
  const categoryOptions: DropdownOption[] = useMemo(() => {
    const options: DropdownOption[] = [
      {
        value: '',
        label: tForm('selectCategory'),
      },
    ];

    if (categories && categories.length > 0) {
      options.push({
        value: '__divider__',
        label: '',
        divider: true,
      } as DropdownOption);

      categories.forEach((category: any) => {
        options.push({
          value: category._id,
          label: category.name,
        });
      });
    }

    return options;
  }, [categories, tForm]);

  const handleCategorySelect = (value: string | number) => {
    // Ignore divider selections
    if (value === '__divider__') return;
    setValue(`items.${index}.category`, value === '' ? '' : String(value));
  };

  return (
    <div className=" rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 bg-surface">
      <div className="flex items-center justify-between mb-2 sm:mb-3 pb-2 sm:pb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {item?.image && (
            <img
              src={item.image}
              alt={item.name}
              className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-lg flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm sm:text-base font-medium text-text-secondary truncate">
              {item?.name || tForm('itemNumber', { number: index + 1 })}
            </h4>
            {item?.brand && (
              <p className="text-xs text-text-muted truncate">{item.brand}</p>
            )}
          </div>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-error-500 hover:text-error-700 hover:bg-error-50 rounded transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Product Name - Only for manual items */}
      {isManual && (
        <div>
          <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1">
            {t('itemName')} *
          </label>
          <input
            {...register(`items.${index}.name`)}
            type="text"
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder={t('itemNamePlaceholder')}
          />
          {errors.items?.[index]?.name && (
            <p className="text-error-500 text-xs mt-1">
              {errors.items[index]?.name?.message}
            </p>
          )}
        </div>
      )}

      {/* Quantity with Stepper */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1.5 sm:mb-2">
          {t('quantity')} *
        </label>
        <QuantityStepper
          value={quantity || 1}
          onChange={(value) => setValue(`items.${index}.quantity`, value)}
        />
        {errors.items?.[index]?.quantity && (
          <p className="text-error-500 text-xs mt-1">
            {errors.items[index]?.quantity?.message}
          </p>
        )}
      </div>

      {/* Unit with Chips */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1.5 sm:mb-2">
          {t('unit')} *
        </label>
        <UnitChips
          value={unit || 'piece'}
          onChange={(value) => setValue(`items.${index}.unit`, value)}
          units={item?.units || item?.product?.units || []}
          t={t}
        />
        {errors.items?.[index]?.unit && (
          <p className="text-error-500 text-xs mt-1">
            {errors.items[index]?.unit?.message}
          </p>
        )}
      </div>

      {/* Priority */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1">
          {t('priority')}
        </label>
        <select
          {...register(`items.${index}.priority`)}
          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="low">{t("priorityLow")}</option>
          <option value="medium">{t("priorityMedium")}</option>
          <option value="high">{t("priorityHigh")}</option>
        </select>
      </div>

      {/* Category with Dropdown */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('category')}
        </label>
        <Dropdown
          options={categoryOptions}
          value={categoryValue || ''}
          onSelect={handleCategorySelect}
          placeholder={tForm('selectCategory')}
          fullWidth
          size="md"
          variant="outlined"
        />
        {errors.items?.[index]?.category && (
          <p className="text-error-500 text-xs mt-1">
            {errors.items[index]?.category?.message}
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('notes')}
        </label>
        <textarea
          {...register(`items.${index}.notes`)}
          rows={2}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          placeholder={tForm('notesPlaceholder')}
        />
      </div>
    </div>
  );
});

ItemFormSingle.displayName = 'ItemFormSingle';

export const SelectedItemsSidebar = memo(({
  selectedProducts,
  onProductRemove,
  onItemsChange,
  onSubmit,
  onClose,
  onAddManual,
  onClearAllItems,
  categories,
  isSubmitting,
  t,
}: SelectedItemsSidebarProps) => {
  const tForm = useTranslations('AddItemsModalItemForm');
  const tModal = useTranslations('AddItemModal');

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ItemsFormData>({
    resolver: zodResolver(itemsSchema),
    defaultValues: { items: [] },
  });

  const { fields, remove, append } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");

  // Initialize form when selectedProducts changes
  useEffect(() => {
    if (selectedProducts.length > 0) {
      const items = selectedProducts.map((product) => {
        const categoryId = product.categoryId
          ? typeof product.categoryId === "string"
            ? product.categoryId
            : product.categoryId._id || product.categoryId
          : "";

        // For manual items, use piece as default unit
        const defaultUnit = product.isManual 
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
          description: product.description || "",
          product: product._id,
          image: product.image || "",
          units: product.units || [],
        };
      });

      reset({ items });
    } else {
      reset({ items: [] });
    }
  }, [selectedProducts, reset]);

  // Notify parent of changes
  useEffect(() => {
    if (watchedItems && watchedItems.length > 0) {
      onItemsChange(watchedItems as SingleItemFormData[]);
    }
  }, [watchedItems, onItemsChange]);

  const handleFormSubmit = async (data: ItemsFormData) => {
    await onSubmit(data.items);
  };

  const handleRemoveItem = (index: number) => {
    const item = watchedItems?.[index];
    remove(index);
    if (item?.product) {
      onProductRemove(item.product);
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface border-border">
      {/* Header */}
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

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3">
        {fields.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('selectProductsFromCatalog')}</p>
          </div>
        ) : (
          fields.map((field, index) => {
            const item = watchedItems?.[index] || {};
            const product = selectedProducts.find(p => p._id === item?.product);
            const units = (product?.units || (item as any)?.units || []) as string[];

            return (
              <ItemFormSingle
                key={field.id}
                index={index}
                item={{ ...item, product, units }}
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
                categories={categories}
                onRemove={() => handleRemoveItem(index)}
                canRemove={fields.length > 1}
                t={t}
              />
            );
          })
        )}
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
            disabled={isSubmitting || fields.length === 0}
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
