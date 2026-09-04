import { api } from '../client';
import type { WalletTransaction } from '@/types';

export interface VirtualAccount {
  bank_name: string;
  account_number: string;
  account_name: string;
  currency: string;
  message: string;
}

export interface FundRequest {
  id: number;
  amount: number;
  reference: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const walletService = {
  getBankDetails: async (): Promise<VirtualAccount> => {
    const { data } = await api.get('/monnify/virtual-account/');
    return data;
  },

  submitFundRequest: async (payload: {
    amount: number;
    phone: string;
    reference?: string;
  }): Promise<{ message: string }> => {
    const { data } = await api.post('/fund-requests/submit/', payload);
    return data;
  },

  listFundRequests: async (params?: { page?: number }): Promise<PaginatedResponse<FundRequest>> => {
    const { data } = await api.get('/fund-requests/', { params });
    return data;
  },

  getHistory: async (params?: { page?: number }): Promise<PaginatedResponse<WalletTransaction>> => {
    const { data } = await api.get('/wallet-transactions/', { params });
    return data;
  },
};
