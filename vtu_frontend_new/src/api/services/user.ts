import { api } from '../client';
import type { User, Wallet, UserStats } from '@/types';

export const userService = {
  getProfile: async (): Promise<User> => {
    const { data } = await api.get('/users/me/');
    return data;
  },

  updateProfile: async (payload: Partial<Pick<User, 'first_name' | 'last_name' | 'phone'>>): Promise<User> => {
    const { data } = await api.patch('/users/me/', payload);
    return data;
  },

  getWallet: async (): Promise<Wallet> => {
    const { data } = await api.get('/wallet/me/');
    return data;
  },

  setTransactionPin: async (payload: { pin: string }): Promise<{ message: string }> => {
    const { data } = await api.post('/users/pin/set/', payload);
    return data;
  },

  changeTransactionPin: async (payload: { old_pin: string; new_pin: string }): Promise<{ message: string }> => {
    const { data } = await api.post('/users/pin/change/', payload);
    return data;
  },

  getStats: async (): Promise<UserStats> => {
    const { data } = await api.get('/v1/stats/');
    return data;
  },
};
