import { api, tokenStorage } from '../client';
import type { AuthTokens, LoginCredentials, RegisterData, User } from '@/types';

export const authService = {
  login: async (creds: LoginCredentials): Promise<{ tokens: AuthTokens; user: User }> => {
    const payload = { email: creds.identifier, password: creds.password };
    const { data } = await api.post('/users/auth/login/', payload);
    const tokens: AuthTokens = { access: data.access, refresh: data.refresh };
    tokenStorage.set(tokens.access, tokens.refresh, creds.remember ?? false);

    const { data: user } = await api.get('/users/me/');
    return { tokens, user };
  },

  register: async (payload: RegisterData): Promise<{ message: string }> => {
    const { data } = await api.post('/users/register/', payload);
    return data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post('/users/auth/password-reset/', { email });
    return data;
  },

  resetPassword: async (payload: {
    email: string;
    code: string;
    new_password: string;
  }): Promise<{ message: string }> => {
    const { data } = await api.post('/users/auth/password/reset-with-code/', payload);
    return data;
  },

  verifyEmail: async (email: string, code: string): Promise<{ message: string }> => {
    const { data } = await api.post('/users/verify-email/', { email, code });
    return data;
  },

  resendVerification: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post('/users/register/resend-verification/', { email });
    return data;
  },

  resetPasswordWithCode: async (payload: {
    email: string;
    code: string;
    new_password: string;
  }): Promise<{ message: string }> => {
    const { data } = await api.post('/users/auth/password/reset-with-code/', payload);
    return data;
  },

  logout: async (): Promise<void> => {
    tokenStorage.clear();
  },
};
