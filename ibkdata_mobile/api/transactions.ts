import { api } from './client';

export const transactionService = {
  getAll: async (params?: { type?: string; page?: number }) => {
    const { data } = await api.get('/transactions/', { params });
    return data;
  },
  buyAirtime: async (payload: { phone: string; network: string; amount: number; pin: string }) => {
    const { data } = await api.post('/transactions/airtime/', payload);
    return data;
  },
  buyData: async (payload: { phone: string; network: string; plan_id: string; pin: string }) => {
    const { data } = await api.post('/transactions/data/', payload);
    return data;
  },
  payElectricity: async (payload: any) => {
    const { data } = await api.post('/transactions/electricity/', payload);
    return data;
  },
  payCable: async (payload: any) => {
    const { data } = await api.post('/transactions/cable-tv/', payload);
    return data;
  },
  getDataPlans: async (network?: string) => {
    const { data } = await api.get('/catalog/data-plans/', { params: { network } });
    return data;
  },
  getElectricityProviders: async () => {
    const { data } = await api.get('/catalog/electricity/');
    return data;
  },
  getCableTVProviders: async () => {
    const { data } = await api.get('/catalog/cable-tv/');
    return data;
  },
};
