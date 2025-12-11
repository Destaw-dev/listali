import React, { memo } from 'react';
import { Package, FileText } from 'lucide-react';
import { AddItemProductList } from '../AddItemProductList';
import { FiltersSection } from './FiltersSection';
import { useProductsSelection } from './hooks/useProductsSelection';
import { Button } from '@/components/common';

interface ProductsSelectionViewProps {
  // Only external props needed
  onProductSelect: (product: any) => void;
  onAddManual: () => void;
  selectedProductIds: string[];
  selectedProductsCount: number;
  onContinue: () => void;
  isSubmitting: boolean;
  t: (key: string) => string;
}

export const ProductsSelectionView = memo(({
  onProductSelect,
  onAddManual,
  selectedProductIds,
  selectedProductsCount,
  onContinue,
  isSubmitting,
  t,
}: ProductsSelectionViewProps) => {
  const {
    // State
    searchQuery,
    selectedCategoryId,
    selectedSubCategoryId,
    categoriesOpen,
    showAllCategories,
    sortOption,
    filterKosher,
    filterOrganic,
    filterGlutenFree,
    advancedOpen,
    categories,
    subCategories,
    activeFilters,
    
    // Computed
    productsToShow,
    isLoading,
    hasNext,
    isFetchingNext,
    debouncedSearchQuery,
    
    // Refs
    listContainerRef,
    loadMoreRef,
    
    // Handlers
    handleSearchChange,
    handleCategoryFilter,
    setSelectedSubCategoryId,
    setFilterKosher,
    setFilterOrganic,
    setFilterGlutenFree,
    setSortOption,
    handleRemoveFilter,
    handleClearAllFilters,
    setCategoriesOpen,
    setShowAllCategories,
    setAdvancedOpen,
  } = useProductsSelection();

  return (
  <>
      <FiltersSection
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        categoriesOpen={categoriesOpen}
        onToggleCategories={() => setCategoriesOpen((v) => !v)}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategoryFilter={handleCategoryFilter}
        showAllCategories={showAllCategories}
        onToggleShowAll={() => setShowAllCategories((v) => !v)}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
        sortOption={sortOption}
        onSortChange={setSortOption}
        advancedOpen={advancedOpen}
        onToggleAdvanced={() => setAdvancedOpen((v) => !v)}
        selectedCategoryIdForSub={selectedCategoryId}
        selectedSubCategoryId={selectedSubCategoryId}
        subCategories={subCategories}
        onSubCategoryFilter={setSelectedSubCategoryId}
        filterKosher={filterKosher}
        filterOrganic={filterOrganic}
        filterGlutenFree={filterGlutenFree}
        onKosherChange={setFilterKosher}
        onOrganicChange={setFilterOrganic}
        onGlutenFreeChange={setFilterGlutenFree}
      />

    {selectedProductsCount === 0 && !searchQuery && (
      <div className="mb-4 p-4 bg-surface-hover border border-border rounded-lg">
        <div className="flex items-start gap-3">
          <div className="p-1 bg-surface-hover rounded">
            <Package className="w-4 h-4 text-text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-text-secondary font-medium mb-1">{t('howItWorks')}</p>
            <ul className="text-xs text-text-muted space-y-1 mr-4">
              <li>• {t('howItWorksStep1')}</li>
              <li>• {t('howItWorksStep2')}</li>
              <li>• {t('howItWorksStep3')}</li>
            </ul>
          </div>
        </div>
      </div>
    )}

    <AddItemProductList
      products={productsToShow}
      onSelect={onProductSelect}
      isLoading={isLoading}
      hasNext={hasNext}
      isFetchingNext={isFetchingNext}
      t={t}
      debouncedSearchQuery={debouncedSearchQuery}
      listContainerRef={listContainerRef}
      loadMoreRef={loadMoreRef}
      onAddManual={onAddManual}
      showAddManualButton={true}
      selectedProductIds={selectedProductIds}
      multiSelect={true}
      selectedCategoryId={selectedCategoryId}
    />

    {selectedProductsCount > 0 && (
      <div className="mt-4 pt-4 border-t border-border">
        <Button variant="primary" fullWidth size="lg" onClick={onContinue} disabled={isSubmitting} aria-label={t('continueToFillDetails')} icon={<FileText className="w-4 h-4" />}>{t('continueToFillDetails')}</Button>
      </div>
      )}
    </>
  );
});

ProductsSelectionView.displayName = 'ProductsSelectionView';

