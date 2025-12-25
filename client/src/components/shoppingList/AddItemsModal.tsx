"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useTranslations } from "next-intl";
import { Package, X } from "lucide-react";
import { useAvailableCategories } from "@/hooks/useItems";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";
import { ProductsSelectionView } from "./AddItemsModal/ProductsSelectionView";
import { SelectedItemsSidebar } from "./AddItemsModal/SelectedItemsSidebar";
import { Button } from "../common";

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
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [currentItems, setCurrentItems] = useState<SingleItemFormData[]>([]);
  const [mobileView, setMobileView] = useState<'products' | 'items'>('products');
  const { data: categories = [] } = useAvailableCategories();

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

  const handleProductRemove = useCallback((productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p._id !== productId));
  }, []);

  const handleClearAllProducts = useCallback(() => {
    setSelectedProducts([]);
    setCurrentItems([]);
  }, []);

  const addManualItem = useCallback(() => {
    // Add a manual item (empty product) to the selected products
    const manualProduct = {
      _id: `manual-${Date.now()}`,
      name: "",
      defaultUnit: "piece",
      units: ["piece", "kg", "g", "l", "ml", "package", "box", "bag", "bottle", "can"],
      priority: "medium" as const,
      notes: "",
      brand: "",
      description: "",
      image: "",
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
      setCurrentItems([]);
      onClose();
    }
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(
    async (items: SingleItemFormData[]) => {
      setIsSubmitting(true);
      try {
        await onSubmit(items);
        handleClose();
      } catch (error) {
        // Error handled by parent
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, handleClose]
  );

  const handleItemsChange = useCallback((items: SingleItemFormData[]) => {
    setCurrentItems(items);
  }, []);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedProducts([]);
      setCurrentItems([]);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-surface shadow-xl rounded-none sm:rounded-2xl w-full sm:max-w-7xl h-full sm:max-h-[100vh] flex flex-col">
        {/* Modal Header */}
        <div className="border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-surface-hover rounded-lg">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-text-secondary">{t("addNewItem")}</h2>
              </div>
            </div>
            <Button variant="ghost" size="md" icon={<X className="w-5 h-5" />} onClick={handleClose} disabled={isSubmitting} rounded={true}/>
          </div>
        </div>

        {/* Mobile Tabs Navigation */}
        <div className="sm:hidden border-b border-border flex-shrink-0">
          <div className="flex">
            <button
              onClick={() => setMobileView('products')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                mobileView === 'products'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {t('products')}
              {selectedProducts.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                  {selectedProducts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileView('items')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                mobileView === 'items'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {t('selectedItems')}
            </button>
          </div>
        </div>

        {/* Layout: Tabs on mobile, side-by-side on desktop */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Left Side - Products Catalog */}
          <div className={`${mobileView === 'products' ? 'flex' : 'hidden'} sm:flex flex-1 sm:flex-[0.6] flex-col overflow-hidden `}>
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <ProductsSelectionView
                onProductSelect={handleProductSelect}
                onAddManual={addManualItem}
                selectedProductIds={selectedProductIds}
                selectedProductsCount={selectedProducts.length}
                onContinue={() => {}} // Not needed in side-by-side layout
                isSubmitting={isSubmitting}
                t={t}
                onClearAllProducts={handleClearAllProducts}
              />
            </div>
          </div>

          {/* Right Side - Selected Items Sidebar */}
          <div className={`${mobileView === 'items' ? 'flex' : 'hidden'} sm:flex flex-1 sm:flex-[0.4] flex-col overflow-hidden`}>
            <SelectedItemsSidebar
              selectedProducts={selectedProducts}
              onProductRemove={handleProductRemove}
              onItemsChange={handleItemsChange}
              onSubmit={handleSubmit}
              onClose={handleClose}
              onAddManual={addManualItem}
              categories={categories}
              isSubmitting={isSubmitting}
              onClearAllItems={handleClearAllProducts}
              t={t}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
