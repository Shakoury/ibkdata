import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/api/services/auth';
import { userService } from '@/api/services/user';
import { queryKeys } from '@/api/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useBalanceStore } from '@/store/balanceStore';
import type { LoginCredentials, RegisterData } from '@/types';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (creds: LoginCredentials) => authService.login(creds),
    onSuccess: (result, variables) => {
      setSession(result.user, result.tokens, variables.remember ?? false);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterData) => authService.register(payload),
  });
}

export function useProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  const setBalance = useBalanceStore((s) => s.setBalance);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.profile(),
    queryFn: async () => {
      const profile = await userService.getProfile();
      setUser(profile);
      setBalance(profile.balance);
      return profile;
    },
    enabled: isAuthenticated,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: (profile) => {
      setUser(profile);
      qc.invalidateQueries({ queryKey: queryKeys.profile() });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: authService.changePassword,
  });
}

export function useSetPin() {
  return useMutation({
    mutationFn: userService.setTransactionPin,
  });
}

export function useChangePin() {
  return useMutation({
    mutationFn: userService.changeTransactionPin,
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      logout();
      qc.clear();
    },
  });
}
