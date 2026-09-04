import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletService } from '@/api/services/wallet';
import { userService } from '@/api/services/user';
import { queryKeys } from '@/api/queryClient';
import { useBalanceStore } from '@/store/balanceStore';

export function useBankDetails() {
  return useQuery({
    queryKey: queryKeys.bankDetails(),
    queryFn: walletService.getBankDetails,
  });
}

export function useFundRequests(params?: { page?: number }) {
  return useQuery({
    queryKey: queryKeys.fundRequests(params),
    queryFn: () => walletService.listFundRequests(params),
  });
}

export function useSubmitFundRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: walletService.submitFundRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fundRequests'] });
    },
  });
}

export function useWalletHistory(params?: { page?: number }) {
  return useQuery({
    queryKey: queryKeys.walletHistory(params),
    queryFn: () => walletService.getHistory(params),
  });
}

export function useBalance() {
  const setBalance = useBalanceStore((s) => s.setBalance);

  return useQuery({
    queryKey: queryKeys.balance(),
    queryFn: async () => {
      const { balance } = await userService.getBalance();
      setBalance(balance);
      return balance;
    },
  });
}
