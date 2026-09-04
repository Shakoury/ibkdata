import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useWalletHistory } from '@/hooks/useWallet';
import { formatNaira, formatDateTime } from '@/utils/format';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { Spinner } from '@/components/ui/Spinner';

export function WalletHistoryPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch, isFetching } = useWalletHistory({ page });

  return (
    <div className="px-5 pt-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted mb-4">
        <ArrowLeft size={20} /> Back
      </button>
      <h1 className="text-xl font-semibold mb-4">Wallet History</h1>
      <p className="text-sm text-muted mb-4">All credits and debits on your wallet</p>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : isError ? (
        <ErrorState message="Failed to load wallet history" onRetry={() => refetch()} />
      ) : !data?.results.length ? (
        <EmptyState message="No wallet transactions yet" />
      ) : (
        <>
          {isFetching && <div className="flex justify-center mb-2"><Spinner size={18} /></div>}
          <div className="space-y-2">
            {data.results.map((tx) => (
              <div key={tx.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{tx.description}</p>
                  <p className="text-xs text-muted">{formatDateTime(tx.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${tx.transaction_type === "CREDIT" ? "text-success" : "text-error"}`}>
                    {tx.transaction_type === "CREDIT" ? "+" : "-"}{formatNaira(tx.amount)}
                  </p>
                  <p className="text-xs text-muted">Bal: {formatNaira(tx.balance_after)}</p>
                </div>
              </div>
            ))}
          </div>
          {data.next && (
            <button onClick={() => setPage(page + 1)} className="btn-secondary w-full mt-4">
              Load More
            </button>
          )}
        </>
      )}
    </div>
  );
}
