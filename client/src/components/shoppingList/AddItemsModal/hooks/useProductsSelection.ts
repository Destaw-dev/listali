import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAvailableCategories, useSubCategoriesByCategory } from '../../../../hooks/useItems';
import {
  useInfiniteAllProducts,
  useInfiniteSearchProducts,
  useInfiniteProductsByCategory,
} from '../../../../hooks/useProducts';
import { useDebounce } from '../../../../hooks/useDebounce';
import { IProduct, ICategory, ISubCategory } from '../../../../types';

let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 300;

export interface ActiveFilter {
  type: string;
  label: string;
  value: string | number | boolean | null;
}

export function useProductsSelection() {
  const t = useTranslations('AddItemsModalFilters');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const { data: categories = [] } = useAvailableCategories();

  const [sortOption, setSortOption] = useState<'name-asc' | 'name-desc'>("name-asc");
  const [filterKosher, setFilterKosher] = useState(false);
  const [filterOrganic, setFilterOrganic] = useState(false);
  const [filterGlutenFree, setFilterGlutenFree] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const isSearching = debouncedSearchQuery.length >= 2;
  const isFilteringByCategory = !!selectedCategoryId;

  const { data: subCategories = [] } = useSubCategoriesByCategory(selectedCategoryId, advancedOpen);

  const {
    data: allInfinite,
    fetchNextPage: fetchNextAll,
    hasNextPage: hasNextAll,
    isFetchingNextPage: isFetchingNextAll,
    isLoading: isLoadingAll,
  } = useInfiniteAllProducts(50);

  const {
    data: searchInfinite,
    fetchNextPage: fetchNextSearch,
    hasNextPage: hasNextSearch,
    isFetchingNextPage: isFetchingNextSearch,
    isLoading: isLoadingSearch,
  } = useInfiniteSearchProducts(debouncedSearchQuery, 20);

  const {
    data: categoryInfinite,
    fetchNextPage: fetchNextCategory,
    hasNextPage: hasNextCategory,
    isFetchingNextPage: isFetchingNextCategory,
    isLoading: isLoadingCategory,
  } = useInfiniteProductsByCategory(selectedCategoryId || '', 50);

  const productsToShow = useMemo(() => {
    let base: IProduct[] = [];
    if (isSearching) {
      base = searchInfinite?.pages?.flatMap((p: { data?: IProduct[] }) => p?.data ?? []) ?? [];
    } else if (isFilteringByCategory) {
      base = categoryInfinite?.pages?.flatMap((p: { data?: IProduct[] }) => p?.data ?? []) ?? [];
    } else {
      base = allInfinite?.pages?.flatMap((p: { data?: IProduct[] }) => p?.data ?? []) ?? [];
    }

    const filtered = base.filter((p: IProduct) => {
      if (selectedCategoryId) {
        const cid = typeof p.categoryId === 'string' 
          ? p.categoryId 
          : (typeof p.categoryId === 'object' && p.categoryId !== null && '_id' in p.categoryId 
            ? (p.categoryId as { _id: string })._id 
            : undefined);
        if (cid !== selectedCategoryId) return false;
      }
      if (selectedSubCategoryId) {
        const sid = typeof p.subCategoryId === 'string' 
          ? p.subCategoryId 
          : (typeof p.subCategoryId === 'object' && p.subCategoryId !== null && '_id' in p.subCategoryId 
            ? (p.subCategoryId as { _id: string })._id 
            : undefined);
        if (sid !== selectedSubCategoryId) return false;
      }
      if (filterKosher && !p.kosher) return false;
      if (filterOrganic && !p.organic) return false;
      if (filterGlutenFree && !p.glutenFree) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const an = (a.name || '').toString().localeCompare((b.name || '').toString(), 'he');
      return sortOption === 'name-asc' ? an : -an;
    });

    return sorted;
  }, [
    isSearching,
    isFilteringByCategory,
    searchInfinite?.pages,
    categoryInfinite?.pages,
    allInfinite?.pages,
    selectedCategoryId,
    selectedSubCategoryId,
    filterKosher,
    filterOrganic,
    filterGlutenFree,
    sortOption,
  ]);

  const isLoading = isLoadingAll || isLoadingSearch || isLoadingCategory;
  const hasNext = isSearching ? !!hasNextSearch : isFilteringByCategory ? !!hasNextCategory : !!hasNextAll;
  const isFetchingNext = isFetchingNextAll || isFetchingNextSearch || isFetchingNextCategory;

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    
    const timeoutId = setTimeout(() => {
      const sentinel = loadMoreRef.current;
      const rootEl = listContainerRef.current;
      if (!sentinel || !rootEl) return;

      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry?.isIntersecting && hasNext && !isFetchingNext) {
            const now = Date.now();
            if (now - lastFetchTime < MIN_FETCH_INTERVAL) return;
            lastFetchTime = now;

            if (isSearching) {
              fetchNextSearch();
            } else if (isFilteringByCategory) {
              fetchNextCategory();
            } else {
              fetchNextAll();
            }
          }
        },
        { root: rootEl, rootMargin: "100px", threshold: 0.1 }
      );

      observer.observe(sentinel);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [hasNext, isFetchingNext, isSearching, isFilteringByCategory, fetchNextAll, fetchNextSearch, fetchNextCategory, productsToShow.length]);

  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const filters: ActiveFilter[] = [];
    if (searchQuery.length >= 2) {
      filters.push({ type: 'search', label: t('searchLabel', { query: searchQuery }), value: searchQuery });
    }
    if (selectedCategoryId) {
      const category = categories.find((c: ICategory) => c._id === selectedCategoryId);
      if (category) {
        filters.push({ type: 'category', label: category.name, value: selectedCategoryId });
      }
    }
    if (selectedSubCategoryId) {
      const subCategory = subCategories.find((sc: ISubCategory) => sc._id === selectedSubCategoryId);
      if (subCategory) {
        filters.push({ type: 'subCategory', label: subCategory.name, value: selectedSubCategoryId });
      }
    }
    if (filterKosher) filters.push({ type: 'kosher', label: t('kosher'), value: true });
    if (filterOrganic) filters.push({ type: 'organic', label: t('organic'), value: true });
    if (filterGlutenFree) filters.push({ type: 'glutenFree', label: t('glutenFree'), value: true });
    return filters;
  }, [searchQuery, selectedCategoryId, selectedSubCategoryId, filterKosher, filterOrganic, filterGlutenFree, categories, subCategories, t]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleCategoryFilter = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubCategoryId(null);
  }, []);

  const handleRemoveFilter = useCallback((type: string) => {
    switch (type) {
      case 'search':
        setSearchQuery("");
        break;
      case 'category':
        setSelectedCategoryId(null);
        break;
      case 'subCategory':
        setSelectedSubCategoryId(null);
        break;
      case 'kosher':
        setFilterKosher(false);
        break;
      case 'organic':
        setFilterOrganic(false);
        break;
      case 'glutenFree':
        setFilterGlutenFree(false);
        break;
    }
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategoryId(null);
    setSelectedSubCategoryId(null);
    setFilterKosher(false);
    setFilterOrganic(false);
    setFilterGlutenFree(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('addItems_categoriesOpen');
      if (saved !== null) setCategoriesOpen(saved === 'true');
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('addItems_categoriesOpen', categoriesOpen ? 'true' : 'false');
    } catch {}
  }, [categoriesOpen]);

  return {
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
  };
}
