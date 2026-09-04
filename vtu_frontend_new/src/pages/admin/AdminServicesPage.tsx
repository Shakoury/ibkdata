import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { adminService } from '@/api/services/admin';
import { useToast } from '@/hooks/useToast';
import { extractError } from '@/api/client';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';

export function AdminServicesPage() {
  const toast = useToast();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['adminServices'],
    queryFn: adminService.listServices,
  });

  const toggle = async (id: string, active: boolean) => {
    try {
      await adminService.toggleService(id, !active);
      qc.invalidateQueries({ queryKey: ['adminServices'] });
      toast.success(`Service ${!active ? 'enabled' : 'disabled'}`);
    } catch (err) { toast.error(extractError(err)); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Services</h1>

      {isLoading ? (
        <Spinner size={32} />
      ) : isError ? (
        <ErrorState message="Failed to load services" onRetry={() => refetch()} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {data?.map((svc) => (
            <div key={svc.id} className="bg-admin-card rounded-card p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold capitalize">{svc.name}</p>
                <p className="text-sm text-admin-muted capitalize">{svc.type} • Fee: {svc.fee}%</p>
              </div>
              <button onClick={() => toggle(svc.id, svc.active)}>
                {svc.active
                  ? <ToggleRight size={36} className="text-success" />
                  : <ToggleLeft size={36} className="text-admin-muted" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
