import React, { memo } from 'react';
import { Package } from 'lucide-react';
import { AddItemProductList } from './AddItemProductList';
import { FiltersSection } from './FiltersSection';
import { useProductsSelection } from './hooks/useProductsSelection';
import { IProduct, IItem } from '../../../types';

interface ProductsSelectionViewProps {
  onProductSelect: (product: IProduct) => void;
  onAddManual: () => void;
  selectedProductIds: string[];
  selectedProductsCount: number;
  onContinue: () => void;
  isSubmitting: boolean;
  t: (key: string) => string;
  onClearAllProducts?: () => void;
  existingItems?: IItem[];
}

export const ProductsSelectionView = memo(({
  onProductSelect,
  onAddManual,
  selectedProductIds,
  selectedProductsCount,
  t,
  existingItems = [],
}: ProductsSelectionViewProps) => {
  const {
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
    
    productsToShow,
    isLoading,
    hasNext,
    isFetchingNext,
    debouncedSearchQuery,
    
    listContainerRef,
    loadMoreRef,
    
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
      <div className="mb-4">
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
      </div>

    {selectedProductsCount === 0 && !searchQuery && (
      <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-background-hover border border-border rounded-lg">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="p-1 bg-background-hover rounded flex-shrink-0">
            <Package className="w-4 h-4 text-text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-text-secondary font-medium mb-1">{t('howItWorks')}</p>
            <ul className="text-xs text-text-muted space-y-1 mr-2 sm:mr-4">
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
      existingItems={existingItems}
    />

    </>
  );
});

ProductsSelectionView.displayName = 'ProductsSelectionView';

