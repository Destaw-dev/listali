import React, { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Plus, Trash2 } from 'lucide-react';

interface ItemFormSingleProps {
  index: number;
  field: { id: string };
  register: any;
  errors: any;
  categories: any[];
  item: any;
  onRemove: () => void;
  canRemove: boolean;
  t: (key: string) => string;
}

const ItemFormSingle = memo(({
  index,
  field,
  register,
  errors,
  categories,
  item,
  onRemove,
  canRemove,
  t,
}: ItemFormSingleProps) => {
  const tForm = useTranslations('AddItemsModalItemForm');
  return (
  <div className="card-glass border border-border rounded-lg p-4 space-y-4">
    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
          {index + 1}
        </span>
        <h4 className="font-medium text-primary">
          {item?.name || tForm('itemNumber', { number: index + 1 })}
        </h4>
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-error-500 hover:text-error-700 hover:bg-error-50 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>

    {item?.image && (
      <div className="flex items-center gap-2 p-2 bg-surface-hover rounded">
        <img
          src={item.image}
          alt={item.name}
          className="w-10 h-10 object-cover rounded"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-secondary truncate">
            {item.name}
          </p>
          {item.brand && (
            <p className="text-xs text-text-muted truncate">{item.brand}</p>
          )}
        </div>
      </div>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('itemName')} *
        </label>
        <input
          {...register(`items.${index}.name`)}
          type="text"
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder={t('itemNamePlaceholder')}
        />
        {errors.items?.[index]?.name && (
          <p className="text-error-500 text-xs mt-1">
            {errors.items[index]?.name?.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('quantity')} *
          </label>
          <input
            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
            type="number"
            step="0.1"
            min="0.1"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {errors.items?.[index]?.quantity && (
            <p className="text-error-500 text-xs mt-1">
              {errors.items[index]?.quantity?.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('unit')} *
          </label>
          <select
            {...register(`items.${index}.unit`)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="piece">{t("unitPiece")}</option>
            <option value="kg">{t("unitKg")}</option>
            <option value="g">{t("unitG")}</option>
            <option value="l">{t("unitL")}</option>
            <option value="ml">{t("unitMl")}</option>
            <option value="package">{t("unitPackage")}</option>
            <option value="box">{t("unitBox")}</option>
            <option value="bag">{t("unitBag")}</option>
            <option value="bottle">{t("unitBottle")}</option>
            <option value="can">{t("unitCan")}</option>
          </select>
          {errors.items?.[index]?.unit && (
            <p className="text-error-500 text-xs mt-1">
              {errors.items[index]?.unit?.message as any}
            </p>
          )}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('category')}
        </label>
        <select
          {...register(`items.${index}.category`)}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">{tForm('selectCategory')}</option>
          {categories?.map((category: any) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {t('priority')}
        </label>
        <select
          {...register(`items.${index}.priority`)}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="low">{t("priorityLow")}</option>
          <option value="medium">{t("priorityMedium")}</option>
          <option value="high">{t("priorityHigh")}</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {tForm('brand')}
        </label>
        <input
          {...register(`items.${index}.brand`)}
          type="text"
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder={tForm('brandPlaceholder')}
        />
      </div>
    </div>

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

interface ItemFormProps {
  fields: Array<{ id: string }>;
  register: any;
  errors: any;
  categories: any[];
  watchedItems: any[];
  remove: (index: number) => void;
  onBack: () => void;
  onAddManual: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
  t: (key: string) => string;
}

export const ItemForm = memo(({
  fields,
  register,
  errors,
  categories,
  watchedItems,
  remove,
  onBack,
  onAddManual,
  onSubmit,
  onClose,
  isSubmitting,
  t,
}: ItemFormProps) => {
  const tForm = useTranslations('AddItemsModalItemForm');
  return (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="space-y-4">
      {fields.map((field, index) => {
        const item = watchedItems?.[index] || {};

        const handleRemoveItem = () => {
          remove(index);
        };

        return (
          <ItemFormSingle
            key={field.id}
            index={index}
            field={field}
            register={register}
            errors={errors}
            categories={categories}
            item={item}
            onRemove={handleRemoveItem}
            canRemove={fields.length > 1}
            t={t}
          />
        );
      })}
    </div>

    <div className="flex gap-2">
      <button
        type="button"
        onClick={onBack}
        className="items-center gap-2 px-4 py-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-surface-hover border border-border/30"
      >
        <Search className="w-4 h-4 inline" />
        <span>{tForm('backToProductSearch')}</span>
      </button>
      <button
        type="button"
        onClick={onAddManual}
        className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-text-secondary font-medium"
      >
        <Plus className="w-4 h-4" />
        {tForm('addAnotherItem')}
      </button>
    </div>

    <div className="flex gap-3 pt-4 border-t border-border">
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="flex-1 px-4 py-2.5 border border-border rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50 font-medium"
      >
        {tForm('cancel')}
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex-1 px-4 py-2.5 bg-primary text-text-on-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
      >
        {isSubmitting
          ? tForm('adding')
          : fields.length === 1
          ? tForm('addItems', { count: fields.length })
          : tForm('addItemsPlural', { count: fields.length })}
      </button>
    </div>
  </form>
  );
});

ItemForm.displayName = 'ItemForm';
