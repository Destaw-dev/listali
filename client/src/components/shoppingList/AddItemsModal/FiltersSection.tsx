import React, { memo, useMemo, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X, Filter } from 'lucide-react';
import { Button, Input, Dropdown, DropdownOption, Badge } from '../../common';
import { ICategory, ISubCategory } from '../../../types';

interface ActiveFilter {
  type: string;
  label: string;
  value: string | number | boolean | null;
}

interface FiltersSectionProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  categoriesOpen: boolean;
  onToggleCategories: () => void;
  
  categories: ICategory[];
  selectedCategoryId: string | null;
  onCategoryFilter: (categoryId: string | null) => void;
  showAllCategories: boolean;
  onToggleShowAll: () => void;
  
  activeFilters: ActiveFilter[];
  onRemoveFilter: (type: string) => void;
  onClearAllFilters: () => void;
  
  sortOption: 'name-asc' | 'name-desc';
  onSortChange: (option: 'name-asc' | 'name-desc') => void;
  
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  selectedCategoryIdForSub: string | null;
  selectedSubCategoryId: string | null;
  subCategories: ISubCategory[];
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
  categories,
  selectedCategoryId,
  onCategoryFilter,
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

      categories.forEach((category: ICategory) => {
        options.push({
          value: category._id,
          label: category.name,
          icon: category.icon,
        });
      });
    }

    return options;
  }, [categories, t]);

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

  const [tempFilterKosher, setTempFilterKosher] = useState<boolean>(filterKosher);
  const [tempFilterOrganic, setTempFilterOrganic] = useState<boolean>(filterOrganic);
  const [tempFilterGlutenFree, setTempFilterGlutenFree] = useState<boolean>(filterGlutenFree);
  const [tempSelectedSubCategoryId, setTempSelectedSubCategoryId] = useState<string | null>(selectedSubCategoryId);

  useEffect(() => {
    if (advancedOpen) {
      setTempFilterKosher(filterKosher);
      setTempFilterOrganic(filterOrganic);
      setTempFilterGlutenFree(filterGlutenFree);
      setTempSelectedSubCategoryId(selectedSubCategoryId);
    }
  }, [advancedOpen, filterKosher, filterOrganic, filterGlutenFree, selectedSubCategoryId]);

  const advancedFilterOptions: DropdownOption[] = useMemo(() => {
    const options: DropdownOption[] = [];

    if (selectedCategoryIdForSub && subCategories.length > 0) {
      options.push(
        { label: t('subCategory'), value: '_header-subCategory', disabled: true },
        { label: t('all'), value: 'subCategory-all' }
      );
      subCategories.forEach((subCategory: ISubCategory) => {
        options.push({
          label: subCategory.name,
          value: `subCategory-${subCategory._id}`,
        });
      });
      options.push({ divider: true, label: '', value: '_divider-subCategory' });
    }

    options.push(
      { label: t('kosher'), value: '_header-kosher', disabled: true },
      { label: t('off'), value: 'kosher-off' },
      { label: t('on'), value: 'kosher-on' },
      { divider: true, label: '', value: '_divider-kosher' }
    );

    options.push(
      { label: t('organic'), value: '_header-organic', disabled: true },
      { label: t('off'), value: 'organic-off' },
      { label: t('on'), value: 'organic-on' },
      { divider: true, label: '', value: '_divider-organic' }
    );

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


  return (
  <>
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

        <Dropdown
          options={sortOptions}
          value={sortOption}
          onSelect={handleSortSelect}
          placeholder={t('sort')}
          size="md"
          variant='ghost'
          triggerClassName='border-none shadow-sm hover:shadow-md focus:ring-0'
        />

        <Dropdown
          options={optionsWithSelection}
          value={t('advancedFilters')}
          placeholder={t('advancedFilters')}
          onSelect={handleAdvancedFilterSelect}
          closeOnSelect={false}
          isOpen={advancedOpen}
          onOpenChange={onToggleAdvanced}
          fullWidth
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
        />
      </div>
    </div>

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

  </>
  );
});

FiltersSection.displayName = 'FiltersSection';

