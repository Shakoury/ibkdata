import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { formatNaira, formatDateTime } from '@/utils/format';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { Spinner } from '@/components/ui/Spinner';
import type { TransactionType } from '@/types';

const filters: { label: string; value?: TransactionType }[] = [
  { label: 'All' },
  { label: 'Airtime', value: 'AIRTIME' },
  { label: 'Data', value: 'DATA' },
  { label: 'Electricity', value: 'ELECTRICITY' },
  { label: 'Cable TV', value: 'CABLE_TV' },
];

export function TransactionHistoryPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<TransactionType | undefined>();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch, isFetching } = useTransactions({ type: filter, page, page_size: 20 });

  return (
    <div className="px-5 pt-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted mb-4">
        <ArrowLeft size={20} /> Back
      </button>
      <h1 className="text-xl font-semibold mb-4">Transactions</h1>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-5 px-5">
        {filters.map((f) => (
          <button
            key={f.label}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${
              filter === f.value ? "bg-accent text-white border-accent" : "bg-white border-border text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : isError ? (
        <ErrorState message="Failed to load transactions" onRetry={() => refetch()} />
      ) : !data?.results.length ? (
        <EmptyState message="No transactions found" />
      ) : (
        <>
          {isFetching && <div className="flex justify-center mb-2"><Spinner size={18} /></div>}
          <div className="space-y-2">
            {data.results.map((tx) => (
              <button
                key={tx.id}
                onClick={() => navigate(`/app/transactions/${tx.id}`)}
                className="card w-full flex items-center justify-between text-left"
              >
                <div>
                  <p className="font-medium capitalize">{tx.type.replace("_", " ").toLowerCase()}</p>
                  <p className="text-xs text-muted">{formatDateTime(tx.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${tx.type === "FUNDING" ? "text-success" : "text-ink"}`}>
                    {tx.type === "FUNDING" ? "+" : "-"}{formatNaira(tx.amount)}
                  </p>
                  <p className={`text-xs capitalize ${
                    tx.status === "SUCCESS" ? "text-success" : tx.status === "PENDING" ? "text-muted" : "text-error"
                  }`}>{tx.status.toLowerCase()}</p>
                </div>
              </button>
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
