import { create } from 'zustand';

interface BalanceState {
  balance: number;
  setBalance: (balance: number) => void;
  updateBalance: (delta: number) => void;
  deductBalance: (amount: number) => void;
}

export const useBalanceStore = create<BalanceState>((set) => ({
  balance: 0,
  setBalance: (balance) => set({ balance }),
  updateBalance: (delta) => set((s) => ({ balance: s.balance + delta })),
  deductBalance: (amount) => set((s) => ({ balance: Math.max(0, s.balance - amount) })),
}));
