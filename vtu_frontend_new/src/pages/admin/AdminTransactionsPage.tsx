import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/api/services/admin';
import { queryKeys } from '@/api/queryClient';
import { formatNaira, formatDate } from '@/utils/format';
import { downloadCsv } from '@/utils/csv';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/ui/States';

export function AdminTransactionsPage() {
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.adminTransactions({ page, type, status }),
    queryFn: () => adminService.listTransactions({ page, type, status }),
  });

  const exportCsv = () => {
    if (!data?.results.length) return;
    const headers = ['Reference', 'Type', 'Amount', 'Status', 'Date'];
    const rows = data.results.map((t) => [t.reference, t.type, t.amount, t.status, t.created_at]);
    downloadCsv('transactions.csv', [headers, ...rows]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <button onClick={exportCsv} className="bg-accent text-white rounded-btn px-4 py-2 text-sm font-medium">Export CSV</button>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="bg-admin-card rounded-btn px-3 py-2 text-sm text-white border border-white/10">
          <option value="">All Types</option>
          <option value="airtime">Airtime</option>
          <option value="data">Data</option>
          <option value="electricity">Electricity</option>
          <option value="cable">Cable</option>
          <option value="funding">Funding</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="bg-admin-card rounded-btn px-3 py-2 text-sm text-white border border-white/10">
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {isLoading ? (
        <Spinner size={32} />
      ) : isError ? (
        <ErrorState message="Failed to load transactions" onRetry={() => refetch()} />
      ) : !data?.results.length ? (
        <EmptyState message="No transactions found" />
      ) : (
        <div className="bg-admin-card rounded-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-admin-muted border-b border-white/10">
                <th className="text-left p-3">Reference</th>
                <th className="text-left p-3">Type</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5">
                  <td className="p-3 font-mono text-xs">{tx.reference}</td>
                  <td className="p-3 capitalize">{tx.type}</td>
                  <td className="p-3 text-right">{formatNaira(tx.amount)}</td>
                  <td className="p-3 capitalize">{tx.status}</td>
                  <td className="p-3 text-admin-muted">{formatDate(tx.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
