import React, { RefObject, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Image as ImageIcon, Check, Package, AlertCircle } from 'lucide-react';
import { Button, LoadingSpinner, Badge } from '../../common';
import { extractImageUrl, extractNameFromProduct, findExistingItemById } from '../../../lib/utils';
import { IProduct, IItem } from '../../../types';

interface Props {
  products: IProduct[];
  onSelect: (p: IProduct) => void;
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
  existingItems?: IItem[];
  canLoadImage?: () => boolean;
  onImageLoad?: () => void;
}


export function AddItemProductList({ products, onSelect, isLoading, hasNext, isFetchingNext, debouncedSearchQuery, listContainerRef, loadMoreRef, onAddManual, showAddManualButton, selectedProductIds = [], multiSelect = false, selectedCategoryId = null, existingItems = [], canLoadImage, onImageLoad }: Props) {
  const t = useTranslations('AddItemProductList');
  const ITEM_HEIGHT = 88;
  const BUFFER = 6;
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
      el.removeEventListener('scroll', onScroll as EventListener);
      window.removeEventListener('resize', resize);
    };
  }, [listContainerRef]);

  const { startIndex, endIndex, topSpacer, bottomSpacer, useVirtualization } = useMemo(() => {
    const total = products.length;
    const vph = viewportHeight || 0;
    
    if (vph === 0 || total === 0) {
      return { 
        startIndex: 0, 
        endIndex: total - 1, 
        topSpacer: 0, 
        bottomSpacer: 0,
        useVirtualization: false
      };
    }
    
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

          <div ref={listContainerRef} className="grid gap-2 sm:gap-3 max-h-[50vh] sm:max-h-[55vh] overflow-y-auto overflow-x-hidden">
            {useVirtualization && <div style={{ height: topSpacer }} />}
            {visibleItems.map((product) => {
              const isSelected = multiSelect && selectedProductIds.includes(product._id);
              const existingItem = existingItems.length > 0 ? findExistingItemById(existingItems, product._id) : null;
              
              
              return (
                <div key={product._id} className="relative bg-background shadow-sm rounded-lg">
                    <button
                      type="button"
                      onClick={() => onSelect(product)}
                      className={`w-full p-3 sm:p-3 border border-border hover:border-primary bg-card rounded-lg cursor-pointer transition-all duration-200 text-start relative shadow-sm text-text-primary ${
                        isSelected
                          ? 'border-2 border-primary bg-primary/10 shadow-md hover:shadow-lg'
                          : existingItem
                          ? 'border border-warning bg-warning/10 hover:bg-warning/20'
                          : 'hover:bg-surface-hover hover:shadow-md'
                      }`}
                    >
                    <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
                      <div className="flex-shrink-0 relative">
                        {product.image && canLoadImage  ? (
                          <img
                            src={extractImageUrl(product.image)}
                            alt={extractNameFromProduct(product)}
                            loading="lazy"
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border border-border"
                            onLoad={onImageLoad}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const placeholder = target.nextElementSibling as HTMLElement;
                              if (placeholder) placeholder.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <Package className='w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border border-border'/>
                        )}
                        {!product.image && (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-surface rounded-lg border border-border flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-text-muted" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-background rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-text-primary" />
                          </div>
                        )}
                        {existingItem && !isSelected && (
                          <div className="absolute -top-1 -inset-inline-end-1 w-4 h-4 sm:w-5 sm:h-5 bg-warning rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                            <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-text-on-primary" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 text-start min-w-0 gap-10">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-medium text-text-primary whitespace-normal break-words">{extractNameFromProduct(product)}</h3>
                          {existingItem && (
                            <Badge variant="warning" size="sm" className="text-xs flex-shrink-0">
                              {t('alreadyInList')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-3 mt-0.5 sm:mt-1 flex-wrap justify-start">
                          {product.brand && <p className="text-xs sm:text-sm text-secondary whitespace-normal break-words">{product.brand}</p>}
                          {(product.defaultUnit || (product.units && product.units.length > 0)) && (
                            <Badge variant="secondary" size="sm" className="text-xs">
                              {product.defaultUnit || product.units?.[0]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    </button>
                </div>
              );
            })}
            {useVirtualization && <div style={{ height: bottomSpacer }} />}

            {hasNext && (
              <div ref={loadMoreRef} className="py-3 text-center text-secondary">
                {isFetchingNext ? t('loadingMore') : ''}
              </div>
            )}
          </div>
        </>
      )}

      {!isLoading && products.length === 0 && debouncedSearchQuery.length >= 2 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-border mx-auto mb-4" />
          <p className="text-secondary font-medium mb-1">{t('noResults')}</p>
          <p className="text-text-muted text-sm mb-6">{t('noResultsDescription')}</p>
          {showAddManualButton && (

            <Button variant="primary" size="lg" onClick={onAddManual} aria-label={t('addManualItem')}>{t('addManualItem')}</Button>
          )}
        </div>
      )}

      {!isLoading && products.length === 0 && selectedCategoryId && debouncedSearchQuery.length < 2 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-border mx-auto mb-4" />
          <p className="text-secondary font-medium mb-1">{t('noProductsInCategory')}</p>
          <p className="text-text-muted text-sm mb-6">{t('noProductsInCategoryDescription')}</p>
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
