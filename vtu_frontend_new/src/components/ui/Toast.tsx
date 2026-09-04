import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const config = {
  success: { icon: CheckCircle, color: 'text-success', border: 'border-success' },
  error: { icon: XCircle, color: 'text-error', border: 'border-error' },
  warning: { icon: AlertCircle, color: 'text-accent', border: 'border-accent' },
  info: { icon: Info, color: 'text-blue-500', border: 'border-blue-500' },
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (!toasts.length) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const c = config[t.type];
        const Icon = c.icon;
        return (
          <div
            key={t.id}
            className={`bg-white border ${c.border} rounded-card shadow-card-hover p-4 flex items-start gap-3 animate-in`}
            onClick={() => onDismiss(t.id)}
          >
            <Icon size={20} className={c.color} />
            <p className="text-sm text-ink flex-1">{t.message}</p>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
