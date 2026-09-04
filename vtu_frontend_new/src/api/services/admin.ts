import { api } from '../client';
import type {
  AdminStats,
  AdminUser,
  DailyVolume,
  PaginatedResponse,
  Transaction,
  User,
  WalletFunding,
} from '@/types';

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const { data } = await api.get('/admin/stats/');
    return data;
  },

  getDailyVolume: async (): Promise<DailyVolume[]> => {
    const { data } = await api.get('/admin/daily-volume/');
    return data;
  },

  listUsers: async (params?: {
    page?: number;
    search?: string;
  }): Promise<PaginatedResponse<AdminUser>> => {
    const { data } = await api.get('/users/', { params });
    return data;
  },

  getUser: async (id: string): Promise<User> => {
    const { data } = await api.get(`/users/${id}/`);
    return data;
  },

  updateUser: async (id: string, payload: Partial<AdminUser>): Promise<User> => {
    const { data } = await api.patch(`/users/${id}/`, payload);
    return data;
  },

  suspendUser: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.patch(`/users/${id}/`, { is_active: false });
    return data;
  },

  activateUser: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.patch(`/users/${id}/`, { is_active: true });
    return data;
  },

  listTransactions: async (params?: {
    page?: number;
    type?: string;
    status?: string;
  }): Promise<PaginatedResponse<Transaction>> => {
    const { data } = await api.get('/transactions/', { params });
    return data;
  },

  adjustWallet: async (payload: {
    user_id: string;
    amount: number;
    action: 'credit' | 'debit';
    note?: string;
  }): Promise<{ message: string }> => {
    const { data } = await api.post('/admin/wallet/adjust/', payload);
    return data;
  },

  listPendingFundRequests: async (params?: { page?: number }): Promise<PaginatedResponse<WalletFunding>> => {
    const { data } = await api.get('/admin/fund-requests/', { params });
    return data;
  },

  approveFundRequest: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.post(`/admin/fund-requests/${id}/approve/`);
    return data;
  },

  rejectFundRequest: async (id: string, reason: string): Promise<{ message: string }> => {
    const { data } = await api.post(`/admin/fund-requests/${id}/reject/`, { reason });
    return data;
  },

  listServices: async (): Promise<unknown[]> => {
    const { data } = await api.get('/admin/services/');
    return data;
  },

  toggleService: async (id: string, active: boolean): Promise<unknown> => {
    const { data } = await api.patch(`/admin/services/${id}/`, { active });
    return data;
  },

  updateService: async (id: string, payload: Record<string, unknown>): Promise<unknown> => {
    const { data } = await api.patch(`/admin/services/${id}/`, payload);
    return data;
  },
};
