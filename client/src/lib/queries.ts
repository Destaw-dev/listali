import { AxiosError } from "axios"

export const queryClientConfig = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always' as const,
      retry: (failureCount: number, error: AxiosError) => {
        if (error.response?.status === 401) return false
        return failureCount < 3
      },
      staleTime: 1 * 60 * 1000,
    },
    mutations: {
      retry: false,
    },
  },
}