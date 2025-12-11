'use client';

import React, { useState, useEffect } from 'react';
import { Search, Package, X, Check, Image as ImageIcon } from 'lucide-react';
import { useSearchProducts } from '@/hooks/useProducts';
import { useTranslations } from 'next-intl';

interface Product {
  _id: string;
  name: string;
  nameEn?: string;
  brand?: string;
  categoryId?: string;
  subCategoryId?: string;
  image?: string;
}

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export default function ProductSearchModal({
  isOpen,
  onClose,
  onSelectProduct
}: ProductSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const t = useTranslations('ProductSearchModal');

  const { data: searchResults, isLoading, error } = useSearchProducts(searchQuery, 1, 20);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled automatically by the hook
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleConfirmSelection = () => {
    if (selectedProduct) {
      onSelectProduct(selectedProduct);
      onClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedProduct(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 shadow-2xl rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">
                {t('searchProducts')}
              </h2>
              <p className="text-text-muted text-sm">{t('searchExistingProducts')}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-white/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchProductsPlaceholder')}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </form>

        {/* Search Results */}
        <div className="space-y-4">
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-secondary mt-2">{t('searchingProducts')}</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500">{t('searchError')}</p>
            </div>
          )}

          {!isLoading && !error && searchResults?.data && (
            <>
              <div className="text-sm text-secondary mb-4">
                {t('foundProducts', { count: searchResults.data.length })}
              </div>
              
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {searchResults.data.map((product: Product) => (
                  <div
                    key={product._id}
                    onClick={() => handleSelectProduct(product)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedProduct?._id === product._id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg border border-border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        {!product.image && (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg border border-border flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-primary truncate">
                          {product.name}
                        </h3>
                        {product.brand && (
                          <p className="text-xs text-secondary truncate">
                            {product.brand}
                          </p>
                        )}
                      </div>

                      {/* Selection Indicator */}
                      {selectedProduct?._id === product._id && (
                        <div className="flex-shrink-0">
                          <Check className="w-5 h-5 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!isLoading && !error && searchResults?.data?.length === 0 && searchQuery && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-secondary">{t('noProductsFound')}</p>
            </div>
          )}
        </div>

        {/* Confirm Button */}
        {selectedProduct && (
          <div className="mt-6 pt-4 border-t border-border/30">
            <button
              onClick={handleConfirmSelection}
              className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors shadow-sm"
            >
              {t('selectProduct')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 