import { create } from 'zustand';
import type { User, AuthTokens } from '@/types';
import { tokenStorage } from '@/api/client';
import { useBalanceStore } from './balanceStore';
import { useTransactionStore } from './transactionStore';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  remember: boolean;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  setSession: (user: User, tokens: AuthTokens, remember?: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: !!tokenStorage.getAccess(),
  remember: false,

  setUser: (user) => set({ user }),

  setTokens: (tokens) => set({ tokens, isAuthenticated: true }),

  setSession: (user, tokens, remember = false) => {
    tokenStorage.set(tokens.access, tokens.refresh, remember);
    set({ user, tokens, isAuthenticated: true, remember });
  },

  logout: () => {
    tokenStorage.clear();
    useBalanceStore.getState().setBalance(0);
    useTransactionStore.getState().clearDraft();
    set({ user: null, tokens: null, isAuthenticated: false, remember: false });
  },
}));
