import { api } from '../client';
import type { WalletTransaction } from '@/types';

export interface VirtualAccount {
  bank_name: string;
  account_number: string;
  account_name: string;
  currency: string;
  message: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const walletService = {
  getBankDetails: async (): Promise<VirtualAccount> => {
    const { data } = await api.get('/paystack/virtual-account/');
    return data;
  },



  getHistory: async (params?: { page?: number }): Promise<PaginatedResponse<WalletTransaction>> => {
    const { data } = await api.get('/wallet-transactions/', { params });
    return data;
  },
};
