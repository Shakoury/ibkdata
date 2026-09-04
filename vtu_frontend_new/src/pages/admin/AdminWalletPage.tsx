import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { adminService } from '@/api/services/admin';
import { queryKeys } from '@/api/queryClient';
import { useToast } from '@/hooks/useToast';
import { extractError } from '@/api/client';
import { formatNaira, formatDateTime } from '@/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { ErrorState, EmptyState } from '@/components/ui/States';

export function AdminWalletPage() {
  const toast = useToast();
  const qc = useQueryClient();

  const fundRequests = useQuery({
    queryKey: queryKeys.adminFundRequests({ page: 1 }),
    queryFn: () => adminService.listPendingFundRequests({ page: 1 }),
  });

  const bank = useQuery({ queryKey: ['adminBankDetails'], queryFn: adminService.listServices });
  const [bankForm, setBankForm] = useState({ bank_name: '', account_number: '', account_name: '', card_funding_enabled: false });
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const approve = async (id: string) => {
    try {
      await adminService.approveFundRequest(id);
      toast.success('Fund request approved');
      qc.invalidateQueries({ queryKey: ['adminFundRequests'] });
    } catch (err) { toast.error(extractError(err)); }
  };

  const reject = async () => {
    if (!rejecting || !rejectReason) return;
    try {
      await adminService.rejectFundRequest(rejecting, rejectReason);
      toast.success('Fund request rejected');
      setRejecting(null);
      setRejectReason('');
      qc.invalidateQueries({ queryKey: ['adminFundRequests'] });
    } catch (err) { toast.error(extractError(err)); }
  };

  const saveBank = async () => {
    try {
      await adminService.updateBankDetails(bankForm);
      toast.success('Bank details updated');
    } catch (err) { toast.error(extractError(err)); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Wallet Management</h1>

      {/* Pending fund requests */}
      <div className="bg-admin-card rounded-card p-5 mb-6">
        <h3 className="font-semibold mb-4">Pending Fund Requests</h3>
        {fundRequests.isLoading ? (
          <Spinner size={24} />
        ) : fundRequests.isError ? (
          <ErrorState message="Failed to load fund requests" onRetry={() => fundRequests.refetch()} />
        ) : !fundRequests.data?.results.length ? (
          <EmptyState message="No pending fund requests" />
        ) : (
          <div className="space-y-2">
            {fundRequests.data.results.map((req) => (
              <div key={req.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0">
                <div>
                  <p className="font-semibold">{formatNaira(req.amount)}</p>
                  <p className="text-xs text-admin-muted">{req.phone} • {formatDateTime(req.created_at)}</p>
                  {req.reference && <p className="text-xs text-admin-muted">Ref: {req.reference}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approve(req.id)} className="w-9 h-9 rounded-btn bg-success/20 text-success flex items-center justify-center">
                    <Check size={18} />
                  </button>
                  <button onClick={() => setRejecting(req.id)} className="w-9 h-9 rounded-btn bg-error/20 text-error flex items-center justify-center">
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bank account settings */}
      <div className="bg-admin-card rounded-card p-5">
        <h3 className="font-semibold mb-4">Bank Account Settings</h3>
        <div className="space-y-3">
          <input className="input-field bg-admin-bg text-white border-white/10" placeholder="Bank Name" value={bankForm.bank_name} onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })} />
          <input className="input-field bg-admin-bg text-white border-white/10" placeholder="Account Number" value={bankForm.account_number} onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })} />
          <input className="input-field bg-admin-bg text-white border-white/10" placeholder="Account Name" value={bankForm.account_name} onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={bankForm.card_funding_enabled} onChange={(e) => setBankForm({ ...bankForm, card_funding_enabled: e.target.checked })} className="accent-accent" />
            Enable Card Funding
          </label>
          <Button onClick={saveBank}>Save Bank Details</Button>
        </div>
      </div>

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title="Reject Fund Request">
        <div className="space-y-3">
          <textarea className="input-field" placeholder="Reason for rejection" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
          <Button className="w-full" onClick={reject} disabled={!rejectReason}>Confirm Rejection</Button>
        </div>
      </Modal>
    </div>
  );
}
