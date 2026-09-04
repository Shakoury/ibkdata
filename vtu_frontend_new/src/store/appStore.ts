import { create } from 'zustand';

interface AppState {
  theme: 'light' | 'dark';
  notifications: boolean;
  globalLoading: boolean;
  toggleTheme: () => void;
  toggleNotifications: () => void;
  setGlobalLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  notifications: true,
  globalLoading: false,
  toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
  toggleNotifications: () => set((s) => ({ notifications: !s.notifications })),
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}));
