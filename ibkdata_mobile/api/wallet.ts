import { api } from './client';

export const walletService = {
  getVirtualAccount: async () => {
    const { data } = await api.get('/monnify/virtual-account/');
    return data;
  },
  submitFundRequest: async (payload: { amount: number; phone: string; reference?: string }) => {
    const { data } = await api.post('/fund-requests/submit/', payload);
    return data;
  },
  getFundRequests: async () => {
    const { data } = await api.get('/fund-requests/');
    return data;
  },
  getHistory: async () => {
    const { data } = await api.get('/wallet-transactions/');
    return data;
  },
};
