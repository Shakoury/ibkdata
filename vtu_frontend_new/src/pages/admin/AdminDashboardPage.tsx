import { useQuery } from '@tanstack/react-query';
import { Users, ArrowLeftRight, DollarSign, Activity, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminService } from '@/api/services/admin';
import { queryKeys } from '@/api/queryClient';
import { formatNaira, formatDate } from '@/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';

export function AdminDashboardPage() {
  const stats = useQuery({ queryKey: queryKeys.adminStats(), queryFn: adminService.getStats });
  const volume = useQuery({ queryKey: queryKeys.dailyVolume(), queryFn: adminService.getDailyVolume });
  const transactions = useQuery({
    queryKey: queryKeys.adminTransactions({ page: 1 }),
    queryFn: () => adminService.listTransactions({ page: 1 }),
  });

  const statCards = [
    { label: 'Total Users', value: stats.data?.total_users, icon: Users },
    { label: 'Total Transactions', value: stats.data?.total_transactions, icon: ArrowLeftRight },
    { label: 'Total Revenue', value: stats.data?.total_revenue != null ? formatNaira(stats.data.total_revenue) : null, icon: DollarSign },
    { label: 'Active Users', value: stats.data?.active_users, icon: Activity },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {stats.data?.pending_fund_requests ? (
          <div className="flex items-center gap-2 bg-accent/10 text-accent px-3 py-1.5 rounded-btn text-sm">
            <Bell size={16} />
            {stats.data.pending_fund_requests} pending fund requests
          </div>
        ) : null}
      </div>

      {stats.isLoading ? (
        <Spinner size={32} />
      ) : stats.isError ? (
        <ErrorState message="Failed to load stats" onRetry={() => stats.refetch()} />
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-admin-card rounded-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-admin-muted text-sm">{card.label}</span>
                  <Icon size={18} className="text-accent" />
                </div>
                <p className="text-2xl font-bold">{card.value ?? '—'}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      <div className="bg-admin-card rounded-card p-5 mb-6">
        <h3 className="font-semibold mb-4">Daily Transaction Volume (7 days)</h3>
        {volume.isLoading ? (
          <Spinner size={24} />
        ) : volume.data ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={volume.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#8A8A8A" fontSize={12} />
              <YAxis stroke="#8A8A8A" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 8 }}
                formatter={(v: number) => formatNaira(v)}
              />
              <Bar dataKey="volume" fill="#D95A41" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      {/* Recent transactions */}
      <div className="bg-admin-card rounded-card p-5">
        <h3 className="font-semibold mb-4">Recent Transactions</h3>
        {transactions.isLoading ? (
          <Spinner size={24} />
        ) : transactions.data ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-admin-muted border-b border-white/10">
                  <th className="text-left py-2">Reference</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.data.results.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5">
                    <td className="py-2 font-mono text-xs">{tx.reference}</td>
                    <td className="py-2 capitalize">{tx.type}</td>
                    <td className="py-2 text-right">{formatNaira(tx.amount)}</td>
                    <td className="py-2 capitalize">{tx.status}</td>
                    <td className="py-2 text-admin-muted">{formatDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
