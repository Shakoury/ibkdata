import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://api.ibkdata.com/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export const tokenStorage = {
  getAccess: () => SecureStore.getItemAsync('ibkdata_access'),
  getRefresh: () => SecureStore.getItemAsync('ibkdata_refresh'),
  set: async (access: string, refresh: string) => {
    await SecureStore.setItemAsync('ibkdata_access', access);
    await SecureStore.setItemAsync('ibkdata_refresh', refresh);
  },
  clear: async () => {
    await SecureStore.deleteItemAsync('ibkdata_access');
    await SecureStore.deleteItemAsync('ibkdata_refresh');
  },
};

// Request interceptor - add token
api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await tokenStorage.clear();
    }
    return Promise.reject(error);
  }
);

export const extractError = (err: any): string => {
  const data = err?.response?.data;
  if (!data) return 'Network error. Check your connection.';
  if (data.detail) return data.detail;
  if (data.message) return data.message;
  if (typeof data === 'string') return data;
  const first = Object.values(data)[0];
  if (Array.isArray(first)) return first[0] as string;
  return 'Something went wrong.';
};
