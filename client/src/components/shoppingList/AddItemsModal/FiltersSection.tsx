import React, { memo, useMemo, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X, Filter } from 'lucide-react';
import { Button, Input, Dropdown, DropdownOption, Badge } from '@/components/common';

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

  // Prepare category dropdown options
  const categoryOptions: DropdownOption[] = useMemo(() => {
    const options: DropdownOption[] = [
      {
        value: '',
        label: `${t('all')} (${t('categories')})`,
      },
    ];

    if (categories && categories.length > 0) {
      options.push({
        value: '__divider__',
        label: '',
        divider: true,
      } as DropdownOption);

      categories.forEach((category: any) => {
        options.push({
          value: category._id,
          label: category.name,
          icon: category.icon,
        });
      });
    }

    return options;
  }, [categories, t]);

  // Prepare sort dropdown options
  const sortOptions: DropdownOption[] = useMemo(() => [
    {
      value: 'name-asc',
      label: t('sortNameAsc'),
    },
    {
      value: 'name-desc',
      label: t('sortNameDesc'),
    },
  ], [t]);

  // Prepare subcategory dropdown options
  const subCategoryOptions: DropdownOption[] = useMemo(() => {
    const options: DropdownOption[] = [
      {
        value: '',
        label: t('all'),
      },
    ];

    if (subCategories && subCategories.length > 0) {
      options.push({
        value: '__divider__',
        label: '',
        divider: true,
      } as DropdownOption);

      subCategories.forEach((subCategory: any) => {
        options.push({
          value: subCategory._id,
          label: subCategory.name,
        });
      });
    }

    return options;
  }, [subCategories, t]);

  // Temporary filter states (before applying)
  const [tempFilterKosher, setTempFilterKosher] = useState<boolean>(filterKosher);
  const [tempFilterOrganic, setTempFilterOrganic] = useState<boolean>(filterOrganic);
  const [tempFilterGlutenFree, setTempFilterGlutenFree] = useState<boolean>(filterGlutenFree);
  const [tempSelectedSubCategoryId, setTempSelectedSubCategoryId] = useState<string | null>(selectedSubCategoryId);

  // Sync temporary state when dropdown opens
  useEffect(() => {
    if (advancedOpen) {
      setTempFilterKosher(filterKosher);
      setTempFilterOrganic(filterOrganic);
      setTempFilterGlutenFree(filterGlutenFree);
      setTempSelectedSubCategoryId(selectedSubCategoryId);
    }
  }, [advancedOpen, filterKosher, filterOrganic, filterGlutenFree, selectedSubCategoryId]);

  // Prepare advanced filters dropdown options (single dropdown with all options)
  const advancedFilterOptions: DropdownOption[] = useMemo(() => {
    const options: DropdownOption[] = [];

    // SubCategory Group (only if category is selected and subcategories exist)
    if (selectedCategoryIdForSub && subCategories.length > 0) {
      options.push(
        { label: t('subCategory'), value: '_header-subCategory', disabled: true },
        { label: t('all'), value: 'subCategory-all' }
      );
      subCategories.forEach((subCategory: any) => {
        options.push({
          label: subCategory.name,
          value: `subCategory-${subCategory._id}`,
        });
      });
      options.push({ divider: true, label: '', value: '_divider-subCategory' });
    }

    // Kosher Group
    options.push(
      { label: t('kosher'), value: '_header-kosher', disabled: true },
      { label: t('off'), value: 'kosher-off' },
      { label: t('on'), value: 'kosher-on' },
      { divider: true, label: '', value: '_divider-kosher' }
    );

    // Organic Group
    options.push(
      { label: t('organic'), value: '_header-organic', disabled: true },
      { label: t('off'), value: 'organic-off' },
      { label: t('on'), value: 'organic-on' },
      { divider: true, label: '', value: '_divider-organic' }
    );

    // Gluten Free Group
    options.push(
      { label: t('glutenFree'), value: '_header-glutenFree', disabled: true },
      { label: t('off'), value: 'glutenFree-off' },
      { label: t('on'), value: 'glutenFree-on' }
    );

    return options;
  }, [t, selectedCategoryIdForSub, subCategories]);

  const optionsWithSelection = advancedFilterOptions.map(option => {
    let isSelected = false;
    const optionValue = String(option.value);
    if (optionValue.startsWith('subCategory-')) {
      const subCategoryValue = optionValue.replace('subCategory-', '');
      if (subCategoryValue === 'all') {
        isSelected = !tempSelectedSubCategoryId;
      } else {
        isSelected = tempSelectedSubCategoryId === subCategoryValue;
      }
    } else if (optionValue.startsWith('kosher-')) {
      const kosherValue = optionValue.replace('kosher-', '');
      isSelected = (kosherValue === 'on' && tempFilterKosher) || (kosherValue === 'off' && !tempFilterKosher);
    } else if (optionValue.startsWith('organic-')) {
      const organicValue = optionValue.replace('organic-', '');
      isSelected = (organicValue === 'on' && tempFilterOrganic) || (organicValue === 'off' && !tempFilterOrganic);
    } else if (optionValue.startsWith('glutenFree-')) {
      const glutenFreeValue = optionValue.replace('glutenFree-', '');
      isSelected = (glutenFreeValue === 'on' && tempFilterGlutenFree) || (glutenFreeValue === 'off' && !tempFilterGlutenFree);
    }
    return { ...option, isSelected };
  });

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedSubCategoryId) count++;
    if (filterKosher) count++;
    if (filterOrganic) count++;
    if (filterGlutenFree) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const handleCategorySelect = (value: string | number) => {
    if (value === '__divider__') return;
    onCategoryFilter(value === '' ? null : String(value));
  };

  const handleSortSelect = (value: string | number) => {
    onSortChange(value as 'name-asc' | 'name-desc');
  };

  const handleSubCategorySelect = (value: string | number) => {
    if (value === '__divider__') return;
    onSubCategoryFilter(value === '' ? null : String(value));
  };

  const handleAdvancedFilterSelect = (value: string | number) => {
    const stringValue = String(value);
    if (stringValue.startsWith('subCategory-')) {
      const subCategoryValue = stringValue.replace('subCategory-', '');
      setTempSelectedSubCategoryId(subCategoryValue === 'all' ? null : subCategoryValue);
    } else if (stringValue.startsWith('kosher-')) {
      setTempFilterKosher(stringValue.replace('kosher-', '') === 'on');
    } else if (stringValue.startsWith('organic-')) {
      setTempFilterOrganic(stringValue.replace('organic-', '') === 'on');
    } else if (stringValue.startsWith('glutenFree-')) {
      setTempFilterGlutenFree(stringValue.replace('glutenFree-', '') === 'on');
    }
  };

  const handleApplyAdvancedFilters = () => {
    onSubCategoryFilter(tempSelectedSubCategoryId);
    onKosherChange(tempFilterKosher);
    onOrganicChange(tempFilterOrganic);
    onGlutenFreeChange(tempFilterGlutenFree);
    onToggleAdvanced();
  };

  const selectedCategory = categories.find((c: any) => c._id === selectedCategoryId);
  const selectedSortLabel = sortOptions.find(opt => opt.value === sortOption)?.label || t('sortNameAsc');
  const selectedSubCategory = subCategories.find((sc: any) => sc._id === selectedSubCategoryId);

  return (
  <>
    {/* Search Bar */}
    <div className="mb-3 sm:mb-4">
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
      <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-1">
        {/* Category Dropdown */}
        <Dropdown
          options={categoryOptions}
          value={selectedCategoryId || ''}
          onSelect={handleCategorySelect}
          placeholder={t('categories')}
          size="md"
          variant='ghost'
          triggerClassName='border-none shadow-sm hover:shadow-md focus:ring-0'
          fullWidth
        />

        {/* Sort Dropdown */}
        <Dropdown
          options={sortOptions}
          value={sortOption}
          onSelect={handleSortSelect}
          placeholder={t('sort')}
          size="md"
          variant='ghost'
          triggerClassName='border-none shadow-sm hover:shadow-md focus:ring-0'
        />

        {/* Advanced Filters Dropdown */}
        <Dropdown
          options={optionsWithSelection}
          value={t('advancedFilters')}
          placeholder={t('advancedFilters')}
          onSelect={handleAdvancedFilterSelect}
          closeOnSelect={false}
          isOpen={advancedOpen}
          onOpenChange={onToggleAdvanced}
          fullWidth
          // className="sm:flex-1"
          trigger={
            <Button
              variant={activeFiltersCount > 0 ? "primary" : "ghost"}
              size="md"
              icon={<Filter className="w-4 h-4" />}
              fullWidth
              className="relative"
            >
             {t('advancedFilters')}
              {activeFiltersCount > 0 && (
                <Badge
                  variant='warning'
                  size="sm"
                  className="absolute -top-1 -start-1 min-w-[20px] h-5 flex items-center justify-center px-1"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          }
          footer={
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={handleApplyAdvancedFilters}
            >
              {t('apply')}
            </Button>
          }
          // align='end'
        />
      </div>
    </div>

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

  </>
  );
});

FiltersSection.displayName = 'FiltersSection';

