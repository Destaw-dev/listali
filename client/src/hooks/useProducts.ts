import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { IProduct } from '../types';

interface PaginatedResponse<T> {
  data?: T[];
  pagination?: {
    page: number;
    pages: number;
    total?: number;
  };
}

export const productKeys = {
  all: ['products'] as const,
  list: (page: number, limit: number) => [...productKeys.all, 'list', page, limit] as const,
  search: (query: string, page: number, limit: number) => [...productKeys.all, 'search', query, page, limit] as const,
  detail: (productId: string) => [...productKeys.all, 'detail', productId] as const,
  category: (categoryId: string, page: number, limit: number) => [...productKeys.all, 'category', categoryId, page, limit] as const,
};

export const useSearchProducts = (query: string, page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: productKeys.search(query, page, limit),
    queryFn: () => apiClient.searchProducts(query, page, limit),
    enabled: !!query && query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => apiClient.getProductById(productId),
    enabled: !!productId,
  });
};

export const useAllProducts = (page: number = 1, limit: number = 50) => {
  return useQuery({
    queryKey: productKeys.list(page, limit),
    queryFn: () => apiClient.getAllProducts(page, limit),
    staleTime: 5 * 60 * 1000,
  });
};

export const useInfiniteAllProducts = (limit: number = 50) => {
  return useInfiniteQuery({
    queryKey: [...productKeys.all, 'list', 'infinite', limit],
    queryFn: ({ pageParam = 1 }) => apiClient.getAllProducts(pageParam as number, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<IProduct>) => {
      const page = lastPage?.pagination?.page ?? 1;
      const pages = lastPage?.pagination?.pages ?? 1;
      return page < pages ? page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useProductsByCategory = (categoryId: string, page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: productKeys.category(categoryId, page, limit),
    queryFn: () => apiClient.getProductsByCategory(categoryId, page, limit),
    enabled: !!categoryId,
  });
}; 

export const useInfiniteProductsByCategory = (categoryId: string, limit: number = 20) => {
  return useInfiniteQuery({
    queryKey: [...productKeys.all, 'category', 'infinite', categoryId, limit],
    queryFn: ({ pageParam = 1 }) => apiClient.getProductsByCategory(categoryId, pageParam as number, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<IProduct>) => {
      const page = lastPage?.pagination?.page ?? 1;
      const pages = lastPage?.pagination?.pages ?? 1;
      return page < pages ? page + 1 : undefined; 
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useInfiniteSearchProducts = (query: string, limit: number = 20) => {
  return useInfiniteQuery({
    queryKey: [...productKeys.all, 'search', 'infinite', query, limit],
    queryFn: ({ pageParam = 1 }) => apiClient.searchProducts(query, pageParam as number, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<IProduct>) => {
      const page = lastPage?.pagination?.page ?? 1;
      const pages = lastPage?.pagination?.pages ?? 1;
      return page < pages ? page + 1 : undefined;
    },
    enabled: !!query && query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProductByBarcode = (barcode: string) => {
  return useQuery({
    queryKey: [...productKeys.all, 'barcode', barcode],
    queryFn: () => apiClient.getProductByBarcode(barcode),
    enabled: !!barcode,
  });
};