import { create } from 'zustand';
import { tokenStorage } from '../api/client';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  balance: string;
  is_verified: boolean;
  is_staff: boolean;
  has_pin: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setAuthenticated: (val: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  setAuthenticated: (val) => set({ isAuthenticated: val }),
  logout: async () => {
    await tokenStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
}));
