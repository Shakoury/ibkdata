import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '@/api/services/auth';
import { useToast } from '@/hooks/useToast';
import { useCooldown } from '@/hooks/useCooldown';
import { extractError } from '@/api/client';
import { Button } from '@/components/ui/Spinner';

const COOLDOWN_SECONDS = 60;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const cooldown = useCooldown(COOLDOWN_SECONDS);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown.isCoolingDown) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      toast.success('Reset code sent to your email.');
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      toast.error(extractError(err));
      cooldown.start();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center px-6 py-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-1">Forgot password</h1>
      <p className="text-muted mb-6">Enter your email to receive a reset code</p>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="email"
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
        <Button type="submit" loading={loading} disabled={cooldown.isCoolingDown} className="w-full">
          {cooldown.isCoolingDown ? `Try again in ${cooldown.remaining}s` : 'Send Reset Code'}
        </Button>
      </form>
    </div>
  );
}

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const email = (location.state as { email?: string })?.email || '';
  const [form, setForm] = useState({ code: '', new_password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.code.length !== 6) {
      toast.error('Enter the 6-digit reset code');
      return;
    }
    if (form.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword({ email, code: form.code, new_password: form.new_password });
      toast.success('Password reset. Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
      setForm({ code: '', new_password: '' });
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center px-6 py-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-1">Reset password</h1>
      <p className="text-muted mb-6">Enter the code and your new password</p>
      <form onSubmit={submit} className="space-y-4">
        <input
          className="input-field text-center tracking-widest"
          maxLength={6}
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '') })}
          placeholder="Reset code"
          inputMode="numeric"
          required
        />
        <input
          type="password"
          className="input-field"
          value={form.new_password}
          onChange={(e) => setForm({ ...form, new_password: e.target.value })}
          placeholder="New password (min 8 characters)"
          minLength={8}
          required
          autoComplete="new-password"
        />
        <Button type="submit" loading={loading} className="w-full">Reset Password</Button>
      </form>
    </div>
  );
}
