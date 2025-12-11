"use client";

import { useTranslations } from 'next-intl';
import { X, Plus, Package } from 'lucide-react';

interface DuplicateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: () => void;
  onCreateNew: () => void;
  existingItem: {
    name: string;
    quantity: number;
    unit: string;
    brand?: string;
  };
  newQuantity: number;
}

export default function DuplicateItemModal({
  isOpen,
  onClose,
  onUpdateQuantity,
  onCreateNew,
  existingItem,
  newQuantity,
}: DuplicateItemModalProps) {
  const t = useTranslations('DuplicateItemModal');

  if (!isOpen) return null;

  const totalQuantity = existingItem.quantity + newQuantity;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('title')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <Package className="w-8 h-8 text-gray-400" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{existingItem.name}</p>
              {existingItem.brand && (
                <p className="text-sm text-gray-500">{existingItem.brand}</p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                {t('existingQuantity')}: {existingItem.quantity} {existingItem.unit}
              </p>
              <p className="text-sm text-gray-600">
                {t('newQuantity')}: {newQuantity} {existingItem.unit}
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{t('totalQuantity')}:</strong> {totalQuantity} {existingItem.unit}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCreateNew}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('createNew')}
          </button>
          <button
            type="button"
            onClick={onUpdateQuantity}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('updateQuantity')}
          </button>
        </div>
      </div>
    </div>
  );
}

