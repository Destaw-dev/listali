"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useTranslations } from "next-intl";
import { Package, X } from "lucide-react";
import { useAvailableCategories } from "../../hooks/useItems";
import { useModalScrollLock } from "../../hooks/useModalScrollLock";
import { ProductsSelectionView } from "./AddItemsModal/ProductsSelectionView";
import { SelectedItemsSidebar } from "./AddItemsModal/SelectedItemsSidebar";
import { Button } from "../common";
import { IProduct, IItem, IManualProduct } from "../../types";

type SingleItemFormData = {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  priority: "low" | "medium" | "high";
  notes?: string;
  brand?: string;
  description?: string;
  product?: string;
  image?: string;
};
 


interface AddItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (items: SingleItemFormData[]) => Promise<boolean | void>;
  listId: string;
  existingItems?: IItem[];
  onMergeDuplicate?: (existingItemId: string, newQuantity: number) => Promise<void>;
}


export default function AddItemsModal({
  isOpen,
  onClose,
  onSubmit,
  existingItems = [],
  onMergeDuplicate,
}: AddItemsModalProps) {
  const t = useTranslations("AddItemModal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<(IProduct | IManualProduct)[]>([]);
  const [mobileView, setMobileView] = useState<'products' | 'items'>('products');
  const { data: categories = [] } = useAvailableCategories();

  const handleProductSelect = useCallback((product: IProduct) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.some((p) => p._id === product._id);
      if (isSelected) {
        return prev.filter((p) => p._id !== product._id);
      }
      return [...prev, product];
    });
  }, []);

  const handleProductRemove = useCallback((productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p._id !== productId));
  }, []);

  const handleClearAllProducts = useCallback(() => {
    setSelectedProducts([]);
  }, []);

  const addManualItem = useCallback(() => {
    const manualProduct: IManualProduct = {
      _id: `manual-${Date.now()}`,
      name: "",
      defaultUnit: "piece",
      units: ["piece", "kg", "g", "l", "ml", "package", "box", "bag", "bottle", "can"],
      priority: "medium",
      notes: "",
      brand: "",
      description: "",
      image: { providers: {}, primary: "" },
      isManual: true,
    };
    setSelectedProducts((prev) => [...prev, manualProduct]);
  }, []);

  const selectedProductIds = useMemo(
    () => selectedProducts.map((p) => p._id),
    [selectedProducts]
  );

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setSelectedProducts([]);
      onClose();
    }
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(
    async (items: SingleItemFormData[]) => {
      setIsSubmitting(true);
      try {
        const result = await onSubmit(items);
        if (result !== false) {
          handleClose();
        }
      } catch {
        console.error(t('errorAddingItems'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, handleClose, t]
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedProducts([]);
    }
  }, [isOpen]);

  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-background shadow-xl rounded-none sm:rounded-2xl w-full sm:max-w-7xl h-full sm:max-h-[100vh] flex flex-col">
        <div className="border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-surface-hover rounded-lg">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-text-primary" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-text-secondary">{t("addNewItem")}</h2>
              </div>
            </div>
            <Button variant="ghost" size="md" icon={<X className="w-5 h-5" />} onClick={handleClose} disabled={isSubmitting} rounded={true}/>
          </div>
        </div>

        <div className="sm:hidden border-b border-border flex-shrink-0">
          <div className="flex">
            <button
              onClick={() => setMobileView('products')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                mobileView === 'products'
                  ? 'border-b-2 border-primary text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {t('products')}
              {selectedProducts.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-background/10 text-text-primary rounded-full text-xs">
                  {selectedProducts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileView('items')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                mobileView === 'items'
                  ? 'border-b-2 border-primary text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {t('selectedItems')}
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          <div className={`${mobileView === 'products' ? 'flex' : 'hidden'} sm:flex flex-1 sm:flex-[0.6] flex-col overflow-hidden `}>
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">

              <ProductsSelectionView
                onProductSelect={handleProductSelect}
                onAddManual={addManualItem}
                selectedProductIds={selectedProductIds}
                selectedProductsCount={selectedProducts.length}
                onContinue={() => {}}
                isSubmitting={isSubmitting}
                t={t}
                onClearAllProducts={handleClearAllProducts}
                existingItems={existingItems}
              />
            </div>
          </div>

          <div className={`${mobileView === 'items' ? 'flex' : 'hidden'} sm:flex flex-1 sm:flex-[0.4] flex-col overflow-hidden`}>
            <SelectedItemsSidebar
              selectedProducts={selectedProducts}
              onProductRemove={handleProductRemove}
              onSubmit={handleSubmit}
              onClose={handleClose}
              onAddManual={addManualItem}
              categories={categories}
              isSubmitting={isSubmitting}
              onClearAllItems={handleClearAllProducts}
              t={t}
              existingItems={existingItems}
              onMergeDuplicate={onMergeDuplicate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
