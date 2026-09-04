import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Ban, CheckCircle, Eye } from 'lucide-react';
import { adminService } from '@/api/services/admin';
import { queryKeys } from '@/api/queryClient';
import { useToast } from '@/hooks/useToast';
import { extractError } from '@/api/client';
import { formatNaira, formatDate } from '@/utils/format';
import { downloadCsv } from '@/utils/csv';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { ErrorState, EmptyState } from '@/components/ui/States';
import type { AdminUser } from '@/types';

export function AdminUsersPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.adminUsers({ page, search }),
    queryFn: () => adminService.listUsers({ page, search }),
  });

  const toggleStatus = async (user: AdminUser) => {
    try {
      if (user.status === 'active') {
        await adminService.suspendUser(user.id);
        toast.success('User suspended');
      } else {
        await adminService.activateUser(user.id);
        toast.success('User activated');
      }
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
    } catch (err) { toast.error(extractError(err)); }
  };

  const exportCsv = () => {
    if (!data?.results.length) return;
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Balance', 'Status', 'Joined'];
    const rows = data.results.map((u) => [u.first_name, u.last_name, u.email, u.phone, u.balance, u.status, u.date_joined]);
    downloadCsv('users.csv', [headers, ...rows]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button onClick={exportCsv} className="bg-accent text-white rounded-btn px-4 py-2 text-sm font-medium">Export CSV</button>
      </div>

      <div className="flex items-center gap-2 mb-4 bg-admin-card rounded-card px-4 py-2">
        <Search size={18} className="text-admin-muted" />
        <input
          className="bg-transparent outline-none flex-1 text-white placeholder:text-admin-muted"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, phone"
        />
      </div>

      {isLoading ? (
        <Spinner size={32} />
      ) : isError ? (
        <ErrorState message="Failed to load users" onRetry={() => refetch()} />
      ) : !data?.results.length ? (
        <EmptyState message="No users found" />
      ) : (
        <div className="bg-admin-card rounded-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-admin-muted border-b border-white/10">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Phone</th>
                <th className="text-right p-3">Balance</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Joined</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((u) => (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="p-3">{u.first_name} {u.last_name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.phone}</td>
                  <td className="p-3 text-right">{formatNaira(u.balance)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.status === 'active' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 text-admin-muted">{formatDate(u.date_joined)}</td>
                  <td className="p-3 flex justify-end gap-2">
                    <button onClick={() => setSelected(u)} className="text-admin-muted hover:text-white"><Eye size={16} /></button>
                    <button onClick={() => toggleStatus(u)} className={u.status === 'active' ? 'text-error' : 'text-success'}>
                      {u.status === 'active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="User Details">
        {selected && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Name</span><span>{selected.first_name} {selected.last_name}</span></div>
            <div className="flex justify-between"><span className="text-muted">Email</span><span>{selected.email}</span></div>
            <div className="flex justify-between"><span className="text-muted">Phone</span><span>{selected.phone}</span></div>
            <div className="flex justify-between"><span className="text-muted">Balance</span><span className="font-semibold">{formatNaira(selected.balance)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Status</span><span className="capitalize">{selected.status}</span></div>
            <div className="flex justify-between"><span className="text-muted">Joined</span><span>{formatDate(selected.date_joined)}</span></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
