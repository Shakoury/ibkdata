import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTransaction } from '@/hooks/useTransactions';
import { formatNaira, formatDateTime } from '@/utils/format';
import { ErrorState } from '@/components/ui/States';
import { Spinner } from '@/components/ui/Spinner';

export function TransactionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useTransaction(id);

  return (
    <div className="px-5 pt-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted mb-4">
        <ArrowLeft size={20} /> Back
      </button>
      <h1 className="text-xl font-semibold mb-4">Transaction Details</h1>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : isError ? (
        <ErrorState message="Failed to load transaction" onRetry={() => refetch()} />
      ) : data ? (
        <div className="card space-y-3">
          <div className="text-center pb-4 border-b border-border">
            <p className={`text-3xl font-bold ${data.type === 'funding' ? 'text-success' : 'text-ink'}`}>
              {data.type === 'funding' ? '+' : '-'}{formatNaira(data.amount)}
            </p>
            <p className={`text-sm capitalize mt-1 ${
              data.status === 'success' ? 'text-success' : data.status === 'pending' ? 'text-muted' : 'text-error'
            }`}>{data.status}</p>
          </div>

          {[
            { label: 'Transaction ID', value: data.reference },
            { label: 'Type', value: data.type, capitalize: true },
            { label: 'Date & Time', value: formatDateTime(data.created_at) },
            data.mobile_number && { label: 'Mobile Number', value: data.mobile_number },
            data.provider && { label: 'Provider', value: data.provider },
            data.plan && { label: 'Plan', value: data.plan },
            data.meter_number && { label: 'Meter Number', value: data.meter_number },
            data.smart_card && { label: 'Smart Card', value: data.smart_card },
            data.bonus != null && { label: 'Bonus Earned', value: formatNaira(data.bonus) },
          ].filter(Boolean).map((row) => (
            <div key={row!.label} className="flex justify-between text-sm">
              <span className="text-muted">{row!.label}</span>
              <span className={`font-medium ${row!.capitalize ? 'capitalize' : ''}`}>{row!.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
