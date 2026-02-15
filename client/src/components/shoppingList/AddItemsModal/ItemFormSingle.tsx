import React, { memo, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2, AlertCircle, GitMerge } from 'lucide-react';
import { QuantityStepper } from './QuantityStepper';
import { UnitChips } from './UnitChips';
import { Button, Dropdown, DropdownOption, Input, TextArea, Badge } from '../../common';
import type { 
  UseFormRegister, 
  UseFormWatch, 
  UseFormSetValue, 
  FieldErrors,
} from 'react-hook-form';
import type { ICategory, IItem, ItemInput, IProduct, IManualProduct } from '../../../types';
import { extractImageUrl, getProductUnits, hasIsManualProduct } from '../../../lib/utils';

type ItemsFormData = {
  items: ItemInput[];
};

interface ItemFormSingleProps {
  index: number;
  item: ItemInput & { units?: string[]; isManual?: boolean; product?: IProduct | IManualProduct | string; image?: string };
  register: UseFormRegister<ItemsFormData>;
  watch: UseFormWatch<ItemsFormData>;
  setValue: UseFormSetValue<ItemsFormData>;
  errors: FieldErrors<ItemsFormData>;
  categories: ICategory[];
  onRemove: () => void;
  canRemove: boolean;
  t: (key: string) => string;
  existingItem?: IItem;
  onMerge?: (newQuantity: number) => Promise<void>;
}

export const ItemFormSingle = memo(({
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
  existingItem,
  onMerge,
}: ItemFormSingleProps) => {
  const tForm = useTranslations('AddItemsModalItemForm');
  const quantity = watch(`items.${index}.quantity`);
  const unit = watch(`items.${index}.unit`);
  const categoryValue = watch(`items.${index}.category`);
  const isManual =
  !!item?.isManual ||
  (hasIsManualProduct(item?.product));

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

      categories.forEach((category) => {
        options.push({
          value: category._id,
          label: category.name,
        });
      });
    }

    return options;
  }, [categories, tForm]);

  const handleCategorySelect = (value: string | number) => {
    if (value === '__divider__') return;
    setValue(`items.${index}.category`, value === '' ? '' : String(value));
  };

  const [isMerging, setIsMerging] = useState(false);
  const newQuantity = watch(`items.${index}.quantity`) || 1;
  const existingQuantity = existingItem?.quantity || 0;
  const mergedQuantity = existingQuantity + newQuantity;

  const handleMerge = async () => {
    if (!onMerge || !existingItem) return;
    setIsMerging(true);
    try {
      await onMerge(mergedQuantity);
    } finally {
      setIsMerging(false);
    }
  };

  const isDuplicate = !!existingItem;

  return (
    <div className={`rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 shadow-sm ${
      isDuplicate
        ? 'bg-[var(--color-status-warning-soft)] border border-warning/20'
        : 'bg-card'
    }`}>
      {isDuplicate && (
        <div className="mb-2 p-2 bg-[var(--color-status-warning-soft)] rounded-lg border border-warning/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-warning" />
            <Badge variant="warning" size="sm" className="text-xs">
              {tForm('alreadyInList')}
            </Badge>
          </div>
          <div className="text-xs text-warning space-y-1">
            <p>
              {tForm('existingQuantity', { quantity: existingQuantity, unit: item?.unit || 'piece' })}
            </p>
            <p>
              {tForm('newQuantity', { quantity: newQuantity, unit: item?.unit || 'piece' })}
            </p>
            <p className="font-medium">
              {tForm('mergedQuantity', { quantity: mergedQuantity, unit: item?.unit || 'piece' })}
            </p>
          </div>
          <div className="flex gap-2 mt-3">
            {onMerge && (
              <Button
                variant="primary"
                size="xs"
                onClick={handleMerge}
                disabled={isMerging}
                icon={<GitMerge className="w-3 h-3" />}
                className="flex-1"
              >
                {tForm('merge')}
              </Button>
            )}
            {canRemove && (
              <Button
                variant="outlineError"
                size="xs"
                onClick={onRemove}
                icon={<Trash2 className="w-3 h-3 text-error-500" />}
              >
                {tForm('remove')}
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-2 sm:mb-3 pb-2 sm:pb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {item?.image && (
            <img
              src={extractImageUrl(item.image)}
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
        {!isDuplicate && canRemove && (
          <Button
            variant="outlineError"
            size="xs"
            onClick={onRemove}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isManual && (
          <Input
            {...register(`items.${index}.name`)}
            type="text"
            placeholder={t('itemNamePlaceholder')}
            error={errors.items?.[index]?.name?.message}
            label={t('itemName') + ' *'}
          />
      )}

        <QuantityStepper
          label={t('quantity') + ' *'}
          value={quantity || 1}
          onChange={(value) => setValue(`items.${index}.quantity`, value)}
        />
        {errors.items?.[index]?.quantity && (
          <p className="text-error-500 text-xs mt-1">
            {errors.items[index]?.quantity?.message}
          </p>
        )}

      <div>
        <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1.5 sm:mb-2">
          {t('unit')} *
        </label>
        <UnitChips
          value={unit || 'piece'}
          onChange={(value) => setValue(`items.${index}.unit`, value)}
          units={item?.units || getProductUnits(item?.product) || []}
          t={t}
          disabled={!isManual}
        />
        {errors.items?.[index]?.unit && (
          <p className="text-error-500 text-xs mt-1">
            {errors.items[index]?.unit?.message}
          </p>
        )}
      </div>

        <Dropdown
          label={t('priority')}
          {...register(`items.${index}.priority`)}
          options={[
            { value: 'low', label: t("priorityLow") },
            { value: 'medium', label: t("priorityMedium") },
            { value: 'high', label: t("priorityHigh") },
          ]}
          value={watch(`items.${index}.priority`) || ''}
          onSelect={(value) => setValue(`items.${index}.priority`, value as 'low' | 'medium' | 'high')}
          placeholder={t('priority')}
          fullWidth
          size="md"
          variant='default'
        />

        <Dropdown
        label={t('category')}
          options={categoryOptions}
          value={categoryValue || ''}
          onSelect={handleCategorySelect}
          placeholder={tForm('selectCategory')}
          fullWidth
          size="md"
          variant="default"
          disabled={!isManual}
          error={errors.items?.[index]?.category?.message}
        />

      <TextArea
        {...register(`items.${index}.notes`)}
        rows={2}
        placeholder={tForm('notesPlaceholder')}
        label={t('notes')}
      />
    </div>
  );
});

ItemFormSingle.displayName = 'ItemFormSingle';
