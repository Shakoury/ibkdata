import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useSetPin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { extractError } from '@/api/client';
import { Button } from '@/components/ui/Spinner';

export function SetupPinPage() {
  const navigate = useNavigate();
  const setPinMutation = useSetPin();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirm) {
      toast.error('PINs do not match');
      return;
    }
    try {
      await setPinMutation.mutateAsync({ pin });
      if (user) setUser({ ...user, has_pin: true });
      toast.success('Transaction PIN set successfully');
      navigate('/app', { replace: true });
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center px-6 py-10 max-w-md mx-auto">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-card bg-accent flex items-center justify-center mx-auto mb-4">
          <Shield className="text-white" size={32} />
        </div>
        <h1 className="text-2xl font-bold">Set Transaction PIN</h1>
        <p className="text-muted mt-2 text-sm">
          Create a 4-digit PIN to authorize all transactions on your account.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1.5">Enter PIN</label>
          <input
            className="input-field text-center text-2xl tracking-widest"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            inputMode="numeric"
            type="password"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Confirm PIN</label>
          <input
            className="input-field text-center text-2xl tracking-widest"
            maxLength={4}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            inputMode="numeric"
            type="password"
            required
          />
        </div>
        <Button type="submit" loading={setPin.isPending} className="w-full">
          Set PIN & Continue
        </Button>
      </form>

      <p className="text-xs text-muted text-center mt-6 px-4">
        Your PIN is required for every transaction. Keep it safe and do not share it.
      </p>
    </div>
  );
}
