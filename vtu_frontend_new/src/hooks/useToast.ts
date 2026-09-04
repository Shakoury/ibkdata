import { useToastStore } from '@/store/toastStore';

export function useToast() {
  const { toasts, add, dismiss } = useToastStore();
  return {
    toasts,
    dismiss,
    success: (m: string) => add('success', m),
    error: (m: string) => add('error', m),
    warning: (m: string) => add('warning', m),
    info: (m: string) => add('info', m),
  };
}
