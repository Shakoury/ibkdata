import { api } from './client';

export const walletService = {
  getVirtualAccount: async () => {
    const { data } = await api.get('/paystack/virtual-account/');
    return data;
  },
  getHistory: async () => {
    const { data } = await api.get('/wallet-transactions/');
    return data;
  },
};
