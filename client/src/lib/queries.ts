
// Query client configuration
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always' as const,
      retry: (failureCount: number, error: any) => {
        // Don't retry on 401 errors
        if (error.response?.status === 401) return false
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      staleTime: 1 * 60 * 1000, // 1 minute default
    },
    mutations: {
      retry: false,
    },
  },
}