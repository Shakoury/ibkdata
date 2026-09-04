import { api } from '../client';
import type {
  CreateTransactionPayload,
  PaginatedResponse,
  Transaction,
  TransactionFilters,
} from '@/types';

export const transactionService = {
  list: async (filters: TransactionFilters = {}): Promise<PaginatedResponse<Transaction>> => {
    const { data } = await api.get('/transactions/', { params: filters });
    return data;
  },

  detail: async (id: string): Promise<Transaction> => {
    const { data } = await api.get(`/transactions/${id}/`);
    return data;
  },

  create: async (payload: CreateTransactionPayload): Promise<Transaction> => {
    const { data } = await api.post('/transactions/', payload);
    return data;
  },

  buyAirtime: async (params: {
    phone: string;
    network: string;
    amount: number;
  }): Promise<Transaction> => {
    return transactionService.create({
      type: 'AIRTIME',
      network: params.network as CreateTransactionPayload['network'],
      amount: params.amount,
      phone_number: params.phone,
    });
  },

  buyData: async (params: {
    phone: string;
    network: string;
    planCode: string;
    amount: number;
  }): Promise<Transaction> => {
    return transactionService.create({
      type: 'DATA',
      network: params.network as CreateTransactionPayload['network'],
      amount: params.amount,
      phone_number: params.phone,
      metadata: { plan_code: params.planCode },
    });
  },

  payElectricity: async (params: {
    disco: string;
    meter_number: string;
    meter_type: string;
    amount: number;
    phone: string;
  }): Promise<Transaction> => {
    return transactionService.create({
      type: 'ELECTRICITY',
      amount: params.amount,
      phone_number: params.phone,
      metadata: {
        disco: params.disco,
        meter_number: params.meter_number,
        meter_type: params.meter_type,
      },
    });
  },

  payCable: async (params: {
    provider_name: string;
    smartcard_number: string;
    package_code: string;
    amount: number;
    phone: string;
  }): Promise<Transaction> => {
    return transactionService.create({
      type: 'CABLE_TV',
      amount: params.amount,
      phone_number: params.phone,
      metadata: {
        provider_name: params.provider_name,
        smartcard_number: params.smartcard_number,
        package_code: params.package_code,
      },
    });
  },
};
