import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const ACCESS_KEY = 'ibkdata_access';
const REFRESH_KEY = 'ibkdata_refresh';
const REMEMBER_KEY = 'ibkdata_remember';

type Storage = Storage | null;

function getStorage(): Storage {
  return localStorage.getItem(REMEMBER_KEY) === 'true' ? localStorage : sessionStorage;
}

export const tokenStorage = {
  getAccess: () => {
    return localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY);
  },
  getRefresh: () => {
    return localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);
  },
  set: (access: string, refresh: string, remember = false) => {
    const s = remember ? localStorage : sessionStorage;
    s.setItem(ACCESS_KEY, access);
    s.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false');
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};

// Request interceptor — attach JWT
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

// Response interceptor — auto refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (original.headers) {
                original.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(original));
            },
            reject,
          });
        });
      }

      // Don't try to refresh on auth endpoints
      if (original.url?.includes('/auth/login') || original.url?.includes('/register')) {
        return Promise.reject(error);
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refresh = tokenStorage.getRefresh();
        if (!refresh) throw new Error('No refresh token');

        const { data } = await axios.post(`${baseURL}/users/auth/token/refresh/`, {
          refresh,
        });
        const newRefresh = data.refresh || refresh;
        const remember = localStorage.getItem(REMEMBER_KEY) === 'true';
        tokenStorage.set(data.access, newRefresh, remember);
        processQueue(null, data.access);
        if (original.headers) {
          original.headers.Authorization = `Bearer ${data.access}`;
        }
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStorage.clear();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function extractError(err: unknown): string {
  const axiosErr = err as AxiosError<ApiError>;
  if (axiosErr.response?.data) {
    const data = axiosErr.response.data;
    if (data.detail) return data.detail;
    if (data.message) return data.message;
    const first = Object.values(data)[0];
    if (typeof first === 'string') return first;
  }
  if (axiosErr.request) return 'Network error. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}
