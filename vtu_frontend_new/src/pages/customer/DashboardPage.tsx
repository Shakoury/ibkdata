import { useNavigate } from 'react-router-dom';
import { Phone, Wifi, Zap, Tv, Plus, ArrowUpRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useBalance } from '@/hooks/useWallet';
import { useTransactions } from '@/hooks/useTransactions';
import { formatNaira, formatDateTime } from '@/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/ui/States';
import type { TransactionType } from '@/types';

const quickLinks = [
  { type: 'airtime', label: 'Airtime', icon: Phone, to: '/app/airtime' },
  { type: 'data', label: 'Data', icon: Wifi, to: '/app/data' },
  { type: 'electricity', label: 'Electricity', icon: Zap, to: '/app/electricity' },
  { type: 'cable', label: 'Cable TV', icon: Tv, to: '/app/cable' },
];

const typeColors: Partial<Record<TransactionType, string>> = {
  AIRTIME: 'text-accent',
  DATA: 'text-accent',
  ELECTRICITY: 'text-accent',
  CABLE_TV: 'text-accent',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [showBalance, setShowBalance] = useState(true);
  const balance = useBalance();
  const transactions = useTransactions({ page_size: 5 });

  return (
    <div className="px-5 pt-8 pb-4">
      <h1 className="text-xl font-semibold">
        Welcome, {user?.first_name || 'there'}
      </h1>

      {/* Balance card */}
      <div className="card mt-4 bg-ink text-white">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/60">Wallet Balance</p>
          <button onClick={() => setShowBalance(!showBalance)} className="text-white/60 hover:text-white">
            {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {balance.isLoading ? (
          <Spinner size={20} className="text-white/60 mt-1" />
        ) : (
          <p className="text-3xl font-bold mt-1">
            {showBalance ? formatNaira(balance.data ?? 0) : '₦ ****'}
          </p>
        )}
        <button
          onClick={() => navigate('/app/fund')}
          className="mt-4 flex items-center gap-2 bg-accent text-white rounded-btn px-4 py-2 text-sm font-medium"
        >
          <Plus size={16} /> Fund Wallet
        </button>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-4 gap-3 mt-5">
        {quickLinks.map((q) => {
          const Icon = q.icon;
          return (
            <button
              key={q.type}
              onClick={() => navigate(q.to)}
              className="card flex flex-col items-center gap-2 py-4 hover:shadow-card-hover transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Icon size={20} className="text-accent" />
              </div>
              <span className="text-xs font-medium">{q.label}</span>
            </button>
          );
        })}
      </div>

      {/* Fund wallet card */}
      <button
        onClick={() => navigate('/app/fund')}
        className="card w-full mt-5 flex items-center justify-between text-left hover:shadow-card-hover transition-shadow"
      >
        <div>
          <p className="font-semibold">Fund Wallet</p>
          <p className="text-sm text-muted">Transfer to our bank account and submit for confirmation</p>
        </div>
        <ArrowUpRight size={20} className="text-accent" />
      </button>

      {/* Recent transactions */}
      <div className="flex items-center justify-between mt-6 mb-3">
        <h2 className="font-semibold">Recent Transactions</h2>
        <button onClick={() => navigate('/app/transactions')} className="text-sm text-accent font-medium">
          See all
        </button>
      </div>

      {transactions.isLoading ? (
        <div className="space-y-2"><div className="card h-16 animate-pulse" /><div className="card h-16 animate-pulse" /></div>
      ) : transactions.isError ? (
        <ErrorState message="Failed to load transactions" onRetry={() => transactions.refetch()} />
      ) : !transactions.data?.results.length ? (
        <EmptyState message="No transactions yet" />
      ) : (
        <div className="space-y-2">
          {transactions.data.results.map((tx) => (
            <button
              key={tx.id}
              onClick={() => navigate(`/app/transactions/${tx.id}`)}
              className="card w-full flex items-center justify-between text-left"
            >
              <div>
                <p className="font-medium capitalize">{tx.type.replace('_', ' ').toLowerCase()}</p>
                <p className="text-xs text-muted">{formatDateTime(tx.created_at)}</p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${tx.type === 'FUNDING' ? 'text-success' : 'text-accent'}`}>
                  {tx.type === 'FUNDING' ? '+' : '-'}{formatNaira(tx.amount)}
                </p>
                <p className={`text-xs ${
                  tx.status === 'SUCCESS' ? 'text-success' : tx.status === 'PENDING' ? 'text-muted' : 'text-error'
                }`}>{tx.status.toLowerCase()}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
