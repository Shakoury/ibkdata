import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useBankDetails, useFundRequests, useSubmitFundRequest } from '@/hooks/useWallet';
import { useTransactionStore } from '@/store/transactionStore';
import { useToast } from '@/hooks/useToast';
import { extractError } from '@/api/client';
import { formatNaira, formatDateTime } from '@/utils/format';
import { Button } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/ui/States';

export function FundWalletPage() {
  const navigate = useNavigate();
  const bank = useBankDetails();
  const fundRequests = useFundRequests();
  const submit = useSubmitFundRequest();
  const draft = useTransactionStore((s) => s.draft);
  const clearDraft = useTransactionStore((s) => s.clearDraft);
  const toast = useToast();

  const [form, setForm] = useState({ amount: '', phone: '', reference: '' });
  const [copied, setCopied] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (draft?.shortfall) {
      setForm((f) => ({ ...f, amount: String(draft.shortfall) }));
    }
  }, [draft]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const submitFund = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submit.mutateAsync({
        amount: Number(form.amount),
        phone: form.phone,
        reference: form.reference || undefined,
      });
      setSubmitted(true);
      clearDraft();
      fundRequests.refetch();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  if (submitted) {
    return (
      <div className="px-5 pt-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted mb-4">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="card flex flex-col items-center text-center py-8">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-success" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Request Submitted</h3>
          <p className="text-muted text-sm mb-6 px-4">
            Your request has been submitted. Funds will reflect within 30 minutes after confirmation.
          </p>
          <Button onClick={() => setSubmitted(false)} className="w-full">View History</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted mb-4">
        <ArrowLeft size={20} /> Back
      </button>
      <h1 className="text-xl font-semibold mb-4">Fund Wallet</h1>

      {draft?.shortfall && (
        <div className="card bg-accent/10 border-accent mb-4">
          <p className="text-sm text-accent">Shortfall from previous transaction: <strong>{formatNaira(draft.shortfall)}</strong></p>
        </div>
      )}

      {/* Bank details */}
      {bank.isLoading ? (
        <div className="card animate-pulse h-32 mb-4" />
      ) : bank.isError ? (
        <ErrorState message="Failed to load bank details" onRetry={() => bank.refetch()} />
      ) : bank.data ? (
        <div className="card bg-ink text-white mb-4">
          <p className="text-sm text-white/60 mb-3">Transfer to this account</p>
          {[
            { label: 'Bank Name', value: bank.data.bank_name },
            { label: 'Account Number', value: bank.data.account_number },
            { label: 'Account Name', value: bank.data.account_name },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
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
            Transfer the amount to this account and submit below
          </p>
        </div>
      ) : null}

      {/* Submit form */}
      <form onSubmit={submitFund} className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium block mb-1.5">Amount Transferred</label>
          <input
            type="number"
            className="input-field"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="Amount"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Sender Phone Number</label>
          <input
            className="input-field"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
            placeholder="Phone for identification"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Transaction Reference (optional)</label>
          <input
            className="input-field"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
            placeholder="Reference"
          />
        </div>
        <Button type="submit" loading={submit.isPending} className="w-full">Submit Fund Request</Button>
      </form>

      {/* History */}
      <h2 className="font-semibold mb-3">Fund Request History</h2>
      {fundRequests.isLoading ? (
        <div className="card animate-pulse h-16" />
      ) : fundRequests.isError ? (
        <ErrorState message="Failed to load history" onRetry={() => fundRequests.refetch()} />
      ) : !fundRequests.data?.results.length ? (
        <EmptyState message="No fund requests yet" />
      ) : (
        <div className="space-y-2">
          {fundRequests.data.results.map((req) => (
            <div key={req.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold">{formatNaira(req.amount)}</p>
                <p className="text-xs text-muted">{formatDateTime(req.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                {req.status === 'pending' && <Clock size={16} className="text-muted" />}
                {req.status === 'approved' && <CheckCircle size={16} className="text-success" />}
                {req.status === 'rejected' && <XCircle size={16} className="text-error" />}
                <span className={`text-sm capitalize ${
                  req.status === 'approved' ? 'text-success' : req.status === 'rejected' ? 'text-error' : 'text-muted'
                }`}>{req.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
