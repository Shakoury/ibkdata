import { useState } from 'react';
import { adminService } from '@/api/services/admin';
import { useToast } from '@/hooks/useToast';
import { extractError } from '@/api/client';
import { Button } from '@/components/ui/Spinner';

export function AdminWalletPage() {
  const toast = useToast();
  const [form, setForm] = useState({
    user_id: '',
    amount: '',
    action: 'credit' as 'credit' | 'debit',
    note: '',
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminService.adjustWallet({
        user_id: form.user_id.trim(),
        amount: Number(form.amount),
        action: form.action,
        note: form.note || undefined,
      });
      toast.success('Wallet adjusted');
      setForm({ user_id: '', amount: '', action: 'credit', note: '' });
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Wallet Management</h1>
      <p className="text-sm text-admin-muted mb-6">
        Wallet funding is automatic. Use this only to correct a balance, for example when a transfer was not
        credited. Check the user's wallet history first.
      </p>

      <form onSubmit={submit} className="bg-admin-card rounded-card p-5 space-y-3">
        <h3 className="font-semibold">Adjust Wallet</h3>
        <input
          className="input-field bg-admin-bg text-white border-white/10"
          placeholder="User ID"
          value={form.user_id}
          onChange={(e) => setForm({ ...form, user_id: e.target.value })}
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          className="input-field bg-admin-bg text-white border-white/10"
          placeholder="Amount (NGN)"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
        <select
          className="input-field bg-admin-bg text-white border-white/10"
          value={form.action}
          onChange={(e) => setForm({ ...form, action: e.target.value as 'credit' | 'debit' })}
        >
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
        <input
          className="input-field bg-admin-bg text-white border-white/10"
          placeholder="Note (reason)"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
        <Button type="submit" loading={loading} className="w-full">
          Apply Adjustment
        </Button>
      </form>
    </div>
  );
}
