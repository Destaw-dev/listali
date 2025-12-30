import { vi } from 'vitest';
import { apiClient } from '@/lib/api';
import { mockApiResponse, mockApiError } from './mockData';
import { AxiosRequestConfig } from 'axios';

// Mock API client methods
export const createApiMocks = () => {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const mockPut = vi.fn();
  const mockDelete = vi.fn();
  const mockPatch = vi.fn();

  // Mock apiClient methods
  vi.spyOn(apiClient, 'get').mockImplementation(mockGet);
  vi.spyOn(apiClient, 'post').mockImplementation(mockPost);
  vi.spyOn(apiClient, 'put').mockImplementation(mockPut);
  vi.spyOn(apiClient, 'delete').mockImplementation(mockDelete);
  vi.spyOn(apiClient, 'patch').mockImplementation(mockPatch);

  return {
    mockGet,
    mockPost,
    mockPut,
    mockDelete,
    mockPatch,
    reset: () => {
      mockGet.mockReset();
      mockPost.mockReset();
      mockPut.mockReset();
      mockDelete.mockReset();
      mockPatch.mockReset();
    },
  };
};

// Helper to mock successful API responses
export const mockSuccessResponse = <T>(data: T) => ({
  data: mockApiResponse(data),
  status: 200,
  statusText: 'OK',
  headers: {} as Record<string, string>,
  config: {} as AxiosRequestConfig,
});

// Helper to mock error API responses
export const mockErrorResponse = (message: string, statusCode = 400) => ({
  response: {
    data: mockApiError(message, statusCode),
    status: statusCode,
    statusText: 'Error',
    headers: {},
  },
  isAxiosError: true,
  message,
});

