import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Spinner';

interface StateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <AlertCircle size={40} className="text-error mb-3" />
      <p className="text-muted mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="flex items-center gap-2">
          <RefreshCw size={16} /> Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'Nothing here yet' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <p className="text-muted">{message}</p>
    </div>
  );
}

export function SkeletonCard() {
  return <div className="card animate-pulse h-20" />;
}
