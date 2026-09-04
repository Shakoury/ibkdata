import { create } from 'zustand';
import type { TransactionType } from '@/types';

interface TransactionDraft {
  type: TransactionType;
  phone?: string;
  network?: string;
  amount?: number;
  plan_id?: string;
  plan_label?: string;
  provider?: string;
  meter_number?: string;
  meter_type?: 'prepaid' | 'postpaid';
  smart_card?: string;
  package_id?: string;
  package_label?: string;
  shortfall?: number;
}

interface TransactionState {
  draft: TransactionDraft | null;
  setDraft: (draft: TransactionDraft) => void;
  clearDraft: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}));
