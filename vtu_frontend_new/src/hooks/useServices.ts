import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

export function useDataPlans(network?: string) {
  return useQuery({
    queryKey: ['data-plans', network],
    queryFn: async () => {
      const params = network ? { network } : {};
      const { data } = await api.get('/catalog/data-plans/', { params });
      return data;
    },
    enabled: true,
  });
}

export function useElectricityProviders() {
  return useQuery({
    queryKey: ['electricity-providers'],
    queryFn: async () => {
      const { data } = await api.get('/catalog/electricity/');
      return data;
    },
  });
}

export function useCableTVProviders() {
  return useQuery({
    queryKey: ['cable-tv-providers'],
    queryFn: async () => {
      const { data } = await api.get('/catalog/cable-tv/');
      return data;
    },
  });
}
