import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  transactions: (filters?: Record<string, unknown>) => ['transactions', filters] as const,
  transaction: (id: string) => ['transaction', id] as const,
  profile: () => ['profile'] as const,
  balance: () => ['balance'] as const,
  providers: (type?: string) => ['providers', type] as const,
  dataPlans: (provider?: string) => ['dataPlans', provider] as const,
  cablePackages: (provider?: string) => ['cablePackages', provider] as const,
  fundRequests: (filters?: Record<string, unknown>) => ['fundRequests', filters] as const,
  bankDetails: () => ['bankDetails'] as const,
  walletHistory: (filters?: Record<string, unknown>) => ['walletHistory', filters] as const,
  adminStats: () => ['adminStats'] as const,
  adminUsers: (filters?: Record<string, unknown>) => ['adminUsers', filters] as const,
  adminTransactions: (filters?: Record<string, unknown>) => ['adminTransactions', filters] as const,
  adminFundRequests: (filters?: Record<string, unknown>) => ['adminFundRequests', filters] as const,
  dailyVolume: () => ['dailyVolume'] as const,
};
