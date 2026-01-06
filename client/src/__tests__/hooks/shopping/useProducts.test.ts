import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useSearchProducts,
  useProduct,
  useAllProducts,
  useInfiniteAllProducts,
  useProductsByCategory,
} from '../../../hooks/useProducts';
import { apiClient } from '../../../lib/api';
import { mockProducts } from '../../mocks/mockData';

vi.mock('../../../lib/api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('useProducts Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSearchProducts', () => {
    it('should search products successfully', async () => {
      vi.mocked(apiClient.searchProducts).mockResolvedValue({
        success: true,
        data: mockProducts,
        pagination: {
          page: 1,
          limit: 20,
          total: mockProducts.length,
          pages: 1,
        },
      });

      const { result } = renderHook(() => useSearchProducts('חלב', 1, 20), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.searchProducts).toHaveBeenCalledWith('חלב', 1, 20);
    });

    it('should not search when query is too short', () => {
      const { result } = renderHook(() => useSearchProducts('ח', 1, 20), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('useProduct', () => {
    it('should fetch single product', async () => {
      vi.mocked(apiClient.getProductById).mockResolvedValue({
        success: true,
        data: mockProducts[0],
      });

      const { result } = renderHook(() => useProduct('prod1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toEqual(mockProducts[0]);
      expect(apiClient.getProductById).toHaveBeenCalledWith('prod1');
    });
  });

  describe('useAllProducts', () => {
    it('should fetch all products', async () => {
      vi.mocked(apiClient.getAllProducts).mockResolvedValue({
        success: true,
        data: mockProducts,
        pagination: {
          page: 1,
          limit: 50,
          total: mockProducts.length,
          pages: 1,
        },
      });

      const { result } = renderHook(() => useAllProducts(1, 50), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.getAllProducts).toHaveBeenCalledWith(1, 50);
    });
  });

  describe('useInfiniteAllProducts', () => {
    it('should fetch products with infinite query', async () => {
      vi.mocked(apiClient.getAllProducts).mockResolvedValue({
        success: true,
        data: mockProducts,
        pagination: {
          page: 1,
          limit: 50,
          total: mockProducts.length,
          pages: 2,
        },
      });

      const { result } = renderHook(() => useInfiniteAllProducts(50), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.pages).toBeDefined();
    });
  });

  describe('useProductsByCategory', () => {
    it('should fetch products by category', async () => {
      vi.mocked(apiClient.getProductsByCategory).mockResolvedValue({
        success: true,
        data: mockProducts,
        pagination: {
          page: 1,
          limit: 20,
          total: mockProducts.length,
          pages: 1,
        },
      });

      const { result } = renderHook(() => useProductsByCategory('cat1', 1, 20), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiClient.getProductsByCategory).toHaveBeenCalledWith('cat1', 1, 20);
    });
  });
});

