import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle } from 'lucide-react';
import { useBankDetails } from '@/hooks/useWallet';
import { useTransactionStore } from '@/store/transactionStore';
import { formatNaira } from '@/utils/format';
import { Button } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';

export function FundWalletPage() {
  const navigate = useNavigate();
  const bank = useBankDetails();
  const draft = useTransactionStore((s) => s.draft);

  const [copied, setCopied] = useState('');

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const account = bank.data;
  // While Paystack is still assigning the account, the API returns a message
  // instead of account details, so check for the account number itself.
  const ready = !!account?.account_number;

  const rows = ready
    ? [
        { label: 'Bank Name', value: account?.bank_name ?? '' },
        { label: 'Account Number', value: account?.account_number ?? '' },
        { label: 'Account Name', value: account?.account_name ?? '' },
      ]
    : [];

  return (
    <div className="px-5 pt-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted mb-4">
        <ArrowLeft size={20} /> Back
      </button>
      <h1 className="text-xl font-semibold mb-4">Fund Wallet</h1>

      {draft?.shortfall && (
        <div className="card bg-accent/10 border-accent mb-4">
          <p className="text-sm text-accent">
            Shortfall from previous transaction: <strong>{formatNaira(draft.shortfall)}</strong>
          </p>
        </div>
      )}

      {bank.isLoading ? (
        <div className="card animate-pulse h-32 mb-4" />
      ) : bank.isError ? (
        <ErrorState message="Failed to load account details" onRetry={() => bank.refetch()} />
      ) : ready ? (
        <div className="card bg-ink text-white mb-4">
          <p className="text-sm text-white/60 mb-3">Transfer to this account</p>
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
            >
              <div>
                <p className="text-xs text-white/50">{row.label}</p>
                <p className="font-medium">{row.value}</p>
              </div>
              <button onClick={() => copy(row.value, row.label)} className="text-white/60 hover:text-white">
                {copied === row.label ? <CheckCircle size={18} className="text-success" /> : <Copy size={18} />}
              </button>
            </div>
          ))}
          <p className="text-xs text-white/50 mt-3">
            Transfer any amount to this account. Your wallet is credited automatically, usually within a few minutes.
          </p>
        </div>
      ) : (
        <div className="card mb-4 text-center py-6">
          <p className="font-medium mb-1">Your account is being set up</p>
          <p className="text-sm text-muted mb-4">This can take a minute. Check again shortly.</p>
          <Button onClick={() => bank.refetch()} loading={bank.isFetching} className="w-full">
            Check again
          </Button>
        </div>
      )}
    </div>
  );
}
