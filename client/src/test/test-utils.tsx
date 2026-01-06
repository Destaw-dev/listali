import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { 
  QueryClient, 
  QueryClientProvider, 
  UseQueryResult, 
  UseMutationResult 
} from '@tanstack/react-query';
import { vi } from 'vitest';


const NotificationProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>{children}</NotificationProvider>
      </QueryClientProvider>
    );
  }
  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient };
}


export function createMockQueryResult<TData, TError = Error>(
  overrides?: Partial<UseQueryResult<TData, TError>>
): UseQueryResult<TData, TError> {
  const isPending = overrides?.isPending ?? overrides?.isLoading ?? false;
  const isError = overrides?.isError ?? !!overrides?.error;
  
  const base = {
    data: undefined,
    error: null,
    status: isError ? 'error' : isPending ? 'pending' : 'success',
    fetchStatus: isPending ? 'fetching' : 'idle',
    isLoading: isPending,
    isPending,
    isSuccess: !isPending && !isError,
    isError,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isInitialLoading: false,
    isPaused: false,
    isPlaceholderData: false,
    isRefetching: false,
    isStale: false,
    refetch: vi.fn(),
    isLoadingError: false,
    isRefetchError: false,
    errorUpdateCount: 0,
    isEnabled: true,
    promise: new Promise(() => {}), 
  };

  return Object.assign(base, overrides) as UseQueryResult<TData, TError>;
}


export function createMockMutationResult<TData, TError = Error, TVariables = unknown, TContext = unknown>(
  overrides?: Partial<UseMutationResult<TData, TError, TVariables, TContext>>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const isError = overrides?.isError ?? !!overrides?.error;
  const isSuccess = overrides?.isSuccess ?? !!overrides?.data;

  const base = {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockImplementation(() => 
      isError ? Promise.reject(overrides?.error) : Promise.resolve(overrides?.data as TData)
    ),
    data: undefined,
    error: null,
    isPending: false,
    isSuccess,
    isError,
    isIdle: !isSuccess && !isError && !overrides?.isPending,
    status: isError ? 'error' : isSuccess ? 'success' : 'idle',
    variables: undefined,
    context: undefined,
    failureCount: 0,
    failureReason: null,
    errorUpdatedAt: 0,
    isPaused: false,
    reset: vi.fn(),
    submittedAt: 0,
  };

  return Object.assign(base, overrides) as UseMutationResult<TData, TError, TVariables, TContext>;
}

export * from '@testing-library/react';