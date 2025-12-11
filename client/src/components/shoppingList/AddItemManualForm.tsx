import React from 'react';
import { useTranslations } from 'next-intl';
import { UseFormRegister, FieldErrors, SubmitHandler } from 'react-hook-form';
import { X, Package, FileText, Building2, Tag } from 'lucide-react';

type Priority = 'low' | 'medium' | 'high';

export type AddItemFormData = {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  priority: Priority;
  notes?: string;
  product?: string;
  brand?: string;
  description?: string;
};

interface Props {
  t: (key: string) => string;
  register: UseFormRegister<AddItemFormData>;
  errors: FieldErrors<AddItemFormData>;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: SubmitHandler<AddItemFormData>;
  selectedProduct?: any | null;
  handleSubmit: any;
  categories?: any[];
}

export function AddItemManualForm({ t, register, errors, isSubmitting, onCancel, onSubmit, selectedProduct, handleSubmit, categories }: Props) {
  const tForm = useTranslations('AddItemsModalItemForm');
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {selectedProduct && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3">
            {selectedProduct.image ? (
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-16 h-16 object-cover rounded border border-primary/20"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded border border-primary/20 flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-lg font-medium text-primary">{selectedProduct.name}</p>
              <div className="flex items-center gap-2 mt-1">
                {selectedProduct.brand && (
                  <p className="text-sm text-secondary">{selectedProduct.brand}</p>
                )}
                {(selectedProduct.price || selectedProduct.averagePrice) && (
                  <span className="text-sm text-secondary">• ₪{selectedProduct.price || selectedProduct.averagePrice}</span>
                )}
              </div>
            </div>
            <button type="button" onClick={onCancel} className="text-text-muted hover:text-text-primary">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary mb-2">{t('quantity')} *</label>
          <input
            {...register('quantity', { valueAsNumber: true })}
            type="number"
            step="0.1"
            min="0.1"
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="1"
          />
          {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message as string}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-primary mb-2">{t('unit')}</label>
          <select {...register('unit')} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="piece">{t('unitPiece')}</option>
            <option value="kg">{t('unitKg')}</option>
            <option value="g">{t('unitG')}</option>
            <option value="l">{t('unitL')}</option>
            <option value="ml">{t('unitMl')}</option>
            <option value="package">{t('unitPackage')}</option>
            <option value="box">{t('unitBox')}</option>
            <option value="bag">{t('unitBag')}</option>
            <option value="bottle">{t('unitBottle')}</option>
            <option value="can">{t('unitCan')}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-2">{t('category')}</label>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
          <select
            {...register('category')}
            className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">{t('selectCategory')}</option>
            {categories?.map((category: any) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message as string}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary mb-2">{tForm('brand')}</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
            <input
              {...register('brand')}
              type="text"
              className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={tForm('brandPlaceholder')}
            />
          </div>
          {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand.message as string}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-2">{t('description')}</label>
        <textarea
          {...register('description')}
          rows={2}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder={t('descriptionPlaceholder')}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message as string}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-2">{t('priority')}</label>
        <select {...register('priority')} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="low">{t('priorityLow')}</option>
          <option value="medium">{t('priorityMedium')}</option>
          <option value="high">{t('priorityHigh')}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-primary mb-2">{t('notes')}</label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder={t('notesPlaceholder')}
          />
        </div>
        {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes.message as string}</p>}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-white/50 border border-border/30 disabled:opacity-50"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('adding') : t('addItem')}
        </button>
      </div>
    </form>
  );
}


