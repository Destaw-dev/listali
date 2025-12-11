import React, { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Image as ImageIcon, Check, Package } from 'lucide-react';
import { Button, LoadingSpinner } from '../common';

interface Props {
  products: any[];
  onSelect: (p: any) => void;
  isLoading: boolean;
  hasNext: boolean;
  isFetchingNext: boolean;
  t: (key: string) => string;
  debouncedSearchQuery: string;
  listContainerRef: RefObject<HTMLDivElement | null>;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  onAddManual?: () => void;
  showAddManualButton?: boolean;
  selectedProductIds?: string[];
  multiSelect?: boolean;
  selectedCategoryId?: string | null;
}

export function AddItemProductList({ products, onSelect, isLoading, hasNext, isFetchingNext, t: tProp, debouncedSearchQuery, listContainerRef, loadMoreRef, onAddManual, showAddManualButton, selectedProductIds = [], multiSelect = false, selectedCategoryId = null }: Props) {
  const t = useTranslations('AddItemProductList');
  // Simple list virtualization (fixed item height estimate)
  const ITEM_HEIGHT = 88; // px, approximate card height
  const BUFFER = 6; // items buffer above/below
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const el = listContainerRef.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    const resize = () => setViewportHeight(el.clientHeight);
    el.addEventListener('scroll', onScroll, { passive: true });
    resize();
    window.addEventListener('resize', resize);
    return () => {
      el.removeEventListener('scroll', onScroll as any);
      window.removeEventListener('resize', resize);
    };
  }, [listContainerRef]);

  const { startIndex, endIndex, topSpacer, bottomSpacer, useVirtualization } = useMemo(() => {
    const total = products.length;
    const vph = viewportHeight || 0;
    
    // If viewport height is not calculated yet, show all items (disable virtualization)
    if (vph === 0 || total === 0) {
      return { 
        startIndex: 0, 
        endIndex: total - 1, 
        topSpacer: 0, 
        bottomSpacer: 0,
        useVirtualization: false
      };
    }
    
    // Virtualization only when we have viewport height
    const first = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
    const visibleCount = Math.ceil(vph / ITEM_HEIGHT) + BUFFER * 2;
    const last = Math.min(total - 1, first + visibleCount);
    const top = first * ITEM_HEIGHT;
    const bottom = Math.max(0, (total - last - 1) * ITEM_HEIGHT);
    
    return { 
      startIndex: first, 
      endIndex: last, 
      topSpacer: top, 
      bottomSpacer: bottom,
      useVirtualization: true
    };
  }, [scrollTop, viewportHeight, products.length]);

  const visibleItems = useMemo(() => {
    if (!useVirtualization) {
      return products;
    }
    return products.slice(startIndex, endIndex + 1);
  }, [products, startIndex, endIndex, useVirtualization]);

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="card-glass rounded-lg shadow-sm p-8 text-center">
          <LoadingSpinner />
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <>
          <div className="text-sm text-text-secondary mb-2 sm:mb-4">
            {debouncedSearchQuery.length >= 2 
              ? t('foundResults', { count: products.length })
              : t('showingProducts', { count: products.length })}
          </div>

          <div ref={listContainerRef} className="grid gap-2 sm:gap-3 max-h-[63vh] sm:max-h-[55vh] overflow-y-auto overflow-x-hidden">
            {useVirtualization && <div style={{ height: topSpacer }} />}
            {visibleItems.map((product: any) => {
              const isSelected = multiSelect && selectedProductIds.includes(product._id);
              return (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => onSelect(product)}
                  className={`w-full p-4 sm:p-3 border rounded-lg cursor-pointer transition-colors text-right ${
                    isSelected 
                      ? 'border-primary bg-primary/10 hover:bg-primary/15' 
                      : 'hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="flex-shrink-0">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className="w-16 h-16 object-cover rounded-lg border border-border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      {!product.image && (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg border border-border flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-right">
                      <h3 className="text-base sm:text-base font-medium text-primary whitespace-normal break-words">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {product.brand && <p className="text-sm text-secondary whitespace-normal break-words">{product.brand}</p>}
                        {(product.defaultUnit || (product.units && product.units.length > 0)) && (
                          <span className="text-xs text-secondary bg-gray-100 px-2 py-1 rounded">{product.defaultUnit || product.units?.[0]}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary' : 'border-primary'
                      }`}>
                        <Check className={`w-4 h-4 text-white ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {useVirtualization && <div style={{ height: bottomSpacer }} />}

            {hasNext && (
              <div ref={loadMoreRef} className="py-3 text-center text-secondary">
                {isFetchingNext ? t('loadingMore') : ''}
              </div>
            )}
          </div>

          {showAddManualButton && debouncedSearchQuery.length < 2 && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <Button variant="outline" size='md' fullWidth onClick={onAddManual} aria-label={t('addManualItem')}>{t('addManualItem')}</Button>
            </div>
          )}
        </>
      )}

      {!isLoading && products.length === 0 && debouncedSearchQuery.length >= 2 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-1">{t('noResults')}</p>
          <p className="text-gray-500 text-sm mb-6">{t('noResultsDescription')}</p>
          {showAddManualButton && (

            <Button variant="primary" size="lg" onClick={onAddManual} aria-label={t('addManualItem')}>{t('addManualItem')}</Button>
          )}
        </div>
      )}

      {!isLoading && products.length === 0 && selectedCategoryId && debouncedSearchQuery.length < 2 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-1">{t('noProductsInCategory')}</p>
          <p className="text-gray-500 text-sm mb-6">{t('noProductsInCategoryDescription')}</p>
          {showAddManualButton && (
            <Button variant="primary" size="lg" onClick={onAddManual} aria-label={t('addManualItem')}>
              {t('addManualItem')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

