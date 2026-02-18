import React, { memo, useCallback, useState } from 'react';
import { AddItemProductList } from './AddItemProductList';
import { FiltersSection } from './FiltersSection';
import { useProductsSelection } from './hooks/useProductsSelection';
import { IProduct, IItem } from '../../../types';
import { BarcodeScannerModal } from '../../barcode/BarcodeScannerModal';
import { Button } from '../../common/Button';
import { apiClient } from '../../../lib/api';
import { useNotification } from '../../../contexts/NotificationContext';
import { BarcodeFormat } from '@zxing/library';

interface ProductsSelectionViewProps {
  onProductSelect: (product: IProduct) => void;
  onAddManual: () => void;
  selectedProductIds: string[];
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
    
    canLoadImage,
    onImageLoad,
  } = useProductsSelection();
  const  {showInfo} = useNotification();


  const [openScanModal, setOpenScanModal] = useState(false);
  const handleCloseScanModal = useCallback(() => {

    setOpenScanModal(false);
  }, []);
  const handleOnDetected = useCallback(async (barcode: string) => {
    if (barcode.length === 0) return;
    const productFiltered = productsToShow.find((product) => product.barcode === barcode);
    if (productFiltered) {
      onProductSelect(productFiltered);
    } else {
      try {
        const response = await apiClient.getProductByBarcode(barcode);
        const product = response.data;
        if (product) {
          onProductSelect(product);
        } else {
          showInfo('AddItemModal.productNotFound');
        }
      } catch (error) {
        console.error('Error fetching product by barcode:', error);
        showInfo('AddItemModal.productNotFound');
      }
    }
    setOpenScanModal(false);
  }, [productsToShow, onProductSelect, showInfo]);
  const handleOpenScanModal = useCallback(() => {
    setOpenScanModal(true);
  }, []);

  return (
  <>
      <div className="mb-4 space-y-2">
        <Button
          onClick={handleOpenScanModal}
          variant="primary"
          size="md"
          rounded={true}
          shadow={true}
          glow={true}
          fullWidth={true}
        >
          {t('scanBarcode')}
        </Button>
        <BarcodeScannerModal
          open={openScanModal}
          onClose={handleCloseScanModal}
          onDetected={handleOnDetected}
          title={t('scanBarcode')}
          formats={[BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.EAN_8, BarcodeFormat.EAN_13, BarcodeFormat.CODE_39, BarcodeFormat.CODE_128, BarcodeFormat.ITF, BarcodeFormat.CODABAR, BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX]}
        />
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
      canLoadImage={canLoadImage}
      onImageLoad={onImageLoad}
      multiSelect={true}
      selectedCategoryId={selectedCategoryId}
      existingItems={existingItems}
    />

    </>
  );
});

ProductsSelectionView.displayName = 'ProductsSelectionView';
