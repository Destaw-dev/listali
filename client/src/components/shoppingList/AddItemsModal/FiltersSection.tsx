import React, { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { Button, Input } from '@/components/common';

interface ActiveFilter {
  type: string;
  label: string;
  value: any;
}

interface FiltersSectionProps {
  // Search
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  categoriesOpen: boolean;
  onToggleCategories: () => void;
  
  // Categories
  categories: any[];
  selectedCategoryId: string | null;
  onCategoryFilter: (categoryId: string | null) => void;
  showAllCategories: boolean;
  onToggleShowAll: () => void;
  
  // Active Filters
  activeFilters: ActiveFilter[];
  onRemoveFilter: (type: string) => void;
  onClearAllFilters: () => void;
  
  // Sorting
  sortOption: 'name-asc' | 'name-desc';
  onSortChange: (option: 'name-asc' | 'name-desc') => void;
  
  // Advanced Filters
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  selectedCategoryIdForSub: string | null;
  selectedSubCategoryId: string | null;
  subCategories: any[];
  onSubCategoryFilter: (subCategoryId: string | null) => void;
  filterKosher: boolean;
  filterOrganic: boolean;
  filterGlutenFree: boolean;
  onKosherChange: (checked: boolean) => void;
  onOrganicChange: (checked: boolean) => void;
  onGlutenFreeChange: (checked: boolean) => void;
}

export const FiltersSection = memo(({
  searchQuery,
  onSearchChange,
  categoriesOpen,
  onToggleCategories,
  categories,
  selectedCategoryId,
  onCategoryFilter,
  showAllCategories,
  onToggleShowAll,
  activeFilters,
  onRemoveFilter,
  onClearAllFilters,
  sortOption,
  onSortChange,
  advancedOpen,
  onToggleAdvanced,
  selectedCategoryIdForSub,
  selectedSubCategoryId,
  subCategories,
  onSubCategoryFilter,
  filterKosher,
  filterOrganic,
  filterGlutenFree,
  onKosherChange,
  onOrganicChange,
  onGlutenFreeChange,
}: FiltersSectionProps) => {
  const t = useTranslations('AddItemsModalFilters');
  return (
  <>
    {/* Search Bar */}
    <div className="mb-4">
      <Input
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={t('searchPlaceholder')}
        icon={<Search className="text-gray-400 w-5 h-5" />}
        variant="default"
        size="md"
        fullWidth
        containerClassName="w-full"
      />
      <div className="mt-2 flex items-center gap-3 ">
        <Button variant="ghost" size="md" onClick={onToggleCategories} aria-label={t('categories')}>{categoriesOpen ? t('hideCategories') : t('categories')}</Button>
            {/* Sorting Bar */}
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-600">{t('sort')}</label>
        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value as 'name-asc' | 'name-desc')}
          className="px-2 py-1 border border-gray-300 rounded-md text-sm"
        >
          <option value="name-asc">{t('sortNameAsc')}</option>
          <option value="name-desc">{t('sortNameDesc')}</option>
        </select>
      </div>
      <button
        type="button"
        onClick={onToggleAdvanced}
        className="text-sm text-primary hover:underline"
      >
        {advancedOpen ? t('hideAdvanced') : t('advancedFilters')}
      </button>
    </div>
      </div>
    </div>

    {/* Category Filters */}
    {categoriesOpen && !searchQuery && categories.length > 0 && (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">{t('filterByCategory')}</span>
          {selectedCategoryId && (
            <button
              type="button"
              onClick={() => onCategoryFilter(null)}
              className="text-xs text-primary hover:underline"
            >
              {t('clearFilter')}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCategoryFilter(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              !selectedCategoryId
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('all')}
          </button>
          {(showAllCategories ? categories : categories.slice(0, 6)).map((category: any) => (
            <button
              key={category._id}
              type="button"
              onClick={() => onCategoryFilter(category._id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                selectedCategoryId === category._id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.icon && <span>{category.icon}</span>}
              <span>{category.name}</span>
            </button>
          ))}
          {categories.length > 6 && (
            <button
              type="button"
              onClick={onToggleShowAll}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
            >
              {showAllCategories ? t('showLess') : t('showAll')}
            </button>
          )}
        </div>
      </div>
    )}

    {/* Active Filters Bar */}
    {activeFilters.length > 0 && (
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-600">{t('activeFilters')}</span>
        {activeFilters.map((filter) => (
          <span
            key={`${filter.type}-${filter.value}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
          >
            {filter.label}
            <Button variant="ghost" size="xs" onClick={() => onRemoveFilter(filter.type)} aria-label={t('removeFilter', { label: filter.label })}><X className="w-3 h-3" /></Button>
          </span>
        ))}
        <Button variant="ghost" size="xs" onClick={onClearAllFilters} aria-label={t('clearAll')}>{t('clearAll')}</Button>
      </div>
    )}

    {/* Sorting Bar */}
    {/* <div className="mb-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-600">{t('sort')}</label>
        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value as 'name-asc' | 'name-desc')}
          className="px-2 py-1 border border-gray-300 rounded-md text-sm"
        >
          <option value="name-asc">{t('sortNameAsc')}</option>
          <option value="name-desc">{t('sortNameDesc')}</option>
        </select>
      </div>
      <button
        type="button"
        onClick={onToggleAdvanced}
        className="text-sm text-primary hover:underline"
      >
        {advancedOpen ? t('hideAdvanced') : t('advancedFilters')}
      </button>
    </div> */}

    {/* Advanced Filters */}
    {advancedOpen && (
      <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
        {/* SubCategory Filters */}
        {selectedCategoryIdForSub && subCategories.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">{t('subCategory')}</span>

            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant={!selectedSubCategoryId ? 'secondary' : 'ghost'} size="xs" rounded onClick={() => onSubCategoryFilter(null)} aria-label={t('all')}>{t('all')}
              </Button>
              {subCategories.map((sc: any) => (
                <Button key={sc._id} variant={selectedSubCategoryId === sc._id ? 'secondary' : 'ghost'} size="xs" rounded onClick={() => onSubCategoryFilter(sc._id)} aria-label={sc.name}>{sc.name}
                </Button>
              ))}
                            {selectedSubCategoryId && (
                              <div className="flex items-center gap-2">
                              
                              <Button variant="ghost" size="xs" onClick={() => onSubCategoryFilter(null)} aria-label={t('clearSubCategory')} icon={<X className="w-3 h-3" />}>{t('clearSubCategory')}
                </Button>
                              </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={filterKosher} onChange={(e) => onKosherChange(e.target.checked)} />
            {t('kosher')}
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={filterOrganic} onChange={(e) => onOrganicChange(e.target.checked)} />
            {t('organic')}
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={filterGlutenFree} onChange={(e) => onGlutenFreeChange(e.target.checked)} />
            {t('glutenFree')}
          </label>
        </div>
      </div>
    )}
  </>
  );
});

FiltersSection.displayName = 'FiltersSection';

