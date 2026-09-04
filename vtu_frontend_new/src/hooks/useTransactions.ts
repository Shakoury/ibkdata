import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/api/services/transactions';
import { walletService } from '@/api/services/wallet';
import { queryKeys } from '@/api/queryClient';
import { useBalanceStore } from '@/store/balanceStore';
import type { TransactionFilters } from '@/types';

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: () => transactionService.list(filters),
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.transaction(id!),
    queryFn: () => transactionService.detail(id!),
    enabled: !!id,
  });
}

export function useBuyAirtime() {
  const qc = useQueryClient();
  const deduct = useBalanceStore((s) => s.deductBalance);

  return useMutation({
    mutationFn: transactionService.buyAirtime,
    onSuccess: (tx) => {
      deduct(tx.amount);
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}

export function useBuyData() {
  const qc = useQueryClient();
  const deduct = useBalanceStore((s) => s.deductBalance);

  return useMutation({
    mutationFn: transactionService.buyData,
    onSuccess: (tx) => {
      deduct(tx.amount);
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}

export function usePayElectricity() {
  const qc = useQueryClient();
  const deduct = useBalanceStore((s) => s.deductBalance);

  return useMutation({
    mutationFn: transactionService.payElectricity,
    onSuccess: (tx) => {
      deduct(tx.amount);
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}

export function usePayCable() {
  const qc = useQueryClient();
  const deduct = useBalanceStore((s) => s.deductBalance);

  return useMutation({
    mutationFn: transactionService.payCable,
    onSuccess: (tx) => {
      deduct(tx.amount);
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}
