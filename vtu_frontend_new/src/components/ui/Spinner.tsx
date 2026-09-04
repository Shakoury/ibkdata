import { Loader2 } from 'lucide-react';

export function Spinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin text-accent ${className}`} />;
}

export function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <Spinner size={40} />
    </div>
  );
}

export function Button({
  children,
  loading,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  return (
    <button className={`${base} flex items-center justify-center gap-2 ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner size={18} className="text-white" />}
      {children}
    </button>
  );
}
