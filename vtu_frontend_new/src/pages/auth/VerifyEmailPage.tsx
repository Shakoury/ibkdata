import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '@/api/services/auth';
import { useToast } from '@/hooks/useToast';
import { useCooldown } from '@/hooks/useCooldown';
import { extractError } from '@/api/client';
import { Button } from '@/components/ui/Spinner';

const RESEND_COOLDOWN = 60;

export function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const email = (location.state as { email?: string })?.email || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const cooldown = useCooldown(RESEND_COOLDOWN);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      await authService.verifyEmail(email, code);
      toast.success('Email verified. You can now sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (cooldown.isCoolingDown) return;
    try {
      await authService.resendVerification(email);
      toast.success('Verification code resent.');
      cooldown.start();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center px-6 py-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-1">Verify your email</h1>
      <p className="text-muted mb-6">
        Enter the 6-digit code sent to <span className="font-medium text-ink">{email}</span>
      </p>

      <form onSubmit={verify} className="space-y-4">
        <input
          className="input-field text-center text-2xl tracking-widest"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          inputMode="numeric"
          required
        />
        <Button type="submit" loading={loading} className="w-full">Verify Email</Button>
      </form>

      <button
        onClick={resend}
        disabled={cooldown.isCoolingDown}
        className="text-sm text-accent font-medium mt-4 mx-auto block disabled:text-muted"
      >
        {cooldown.isCoolingDown ? `Resend in ${cooldown.remaining}s` : 'Resend code'}
      </button>
    </div>
  );
}
