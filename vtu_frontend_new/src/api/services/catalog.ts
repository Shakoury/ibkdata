import { api } from '../client';
import type {
  CableTVProvider,
  DataPlan,
  ElectricityProvider,
  NetworkType,
  ProviderStatus,
} from '@/types';

export const catalogService = {
  getElectricityProviders: async (): Promise<ElectricityProvider[]> => {
    const { data } = await api.get('/catalog/electricity/');
    return data;
  },

  getCableTVProviders: async (): Promise<CableTVProvider[]> => {
    const { data } = await api.get('/catalog/cable-tv/');
    return data;
  },

  getDataPlans: async (network?: NetworkType): Promise<DataPlan[]> => {
    const { data } = await api.get('/catalog/data-plans/', {
      params: network ? { network } : undefined,
    });
    return data;
  },

  validateCustomerAccount: async (params: {
    type: 'CABLE_TV' | 'ELECTRICITY';
    code: string;
    number: string;
  }): Promise<{ status: string; customer_name?: string; message?: string }> => {
    const { data } = await api.get('/catalog/validate/', { params });
    return data;
  },

  getProviderStatus: async (): Promise<ProviderStatus[]> => {
    const { data } = await api.get('/v1/providers/status/');
    return data;
  },
};
