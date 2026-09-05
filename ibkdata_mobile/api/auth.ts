import { api, tokenStorage } from './client';

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/users/auth/login/', { email, password });
    await tokenStorage.set(data.access, data.refresh);
    const { data: user } = await api.get('/users/me/');
    return user;
  },
  register: async (payload: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    const { data } = await api.post('/users/register/', payload);
    return data;
  },
  verifyEmail: async (email: string, code: string) => {
    const { data } = await api.post('/users/verify-email/', { email, code });
    return data;
  },
  resendVerification: async (email: string) => {
    const { data } = await api.post('/users/register/resend-verification/', { email });
    return data;
  },
  setPin: async (pin: string) => {
    const { data } = await api.post('/users/pin/set/', { pin });
    return data;
  },
  resetPassword: async (payload: { email: string; code: string; new_password: string }) => {
    const { data } = await api.post('/users/auth/password/reset-with-code/', payload);
    return data;
  },
  forgotPassword: async (email: string) => {
    const { data } = await api.post('/users/auth/password-reset/', { email });
    return data;
  },
  getProfile: async () => {
    const { data } = await api.get('/users/me/');
    return data;
  },
};
