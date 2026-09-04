import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
import { useLogin } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useCooldown } from '@/hooks/useCooldown';
import { extractError, tokenStorage } from '@/api/client';
import { Button } from '@/components/ui/Spinner';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const toast = useToast();
  const [form, setForm] = useState({ identifier: '', password: '', remember: true });
  const [attempts, setAttempts] = useState(0);
  const cooldown = useCooldown(LOCKOUT_SECONDS);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown.isCoolingDown) return;
    if (form.identifier.trim().length < 3) {
      toast.error('Enter a valid email or phone number');
      return;
    }
    if (form.password.length < 1) {
      toast.error('Password is required');
      return;
    }
    try {
      const result = await login.mutateAsync(form);
      toast.success('Welcome back!');
      if (!result.user.has_pin) {
        window.location.href = '/setup-pin';
      } else {
        window.location.href = result.user.is_staff ? '/admin' : '/app';
      }
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.not_verified) {
        const email = data.email || form.identifier;
        tokenStorage.clear();
        window.location.href = '/verify-email?email=' + encodeURIComponent(email);
      } else {
        toast.error(extractError(err));
      }
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        cooldown.start();
        setAttempts(0);
      }
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center px-6 py-10 max-w-md mx-auto">
      <div className="mb-8">
        <div className="w-12 h-12 rounded-card bg-accent flex items-center justify-center mb-4">
          <Smartphone className="text-white" size={24} />
        </div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted mt-1">Sign in to your IBKDATA account</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1.5">Email or Phone</label>
          <input
            className="input-field"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            placeholder="you@example.com"
            required
            minLength={3}
            autoComplete="username"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Password</label>
          <input
            type="password"
            className="input-field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(e) => setForm({ ...form, remember: e.target.checked })}
              className="accent-accent"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-accent font-medium">Forgot password?</Link>
        </div>
        <Button
          type="submit"
          loading={login.isPending}
          disabled={cooldown.isCoolingDown}
          className="w-full"
        >
          {cooldown.isCoolingDown ? `Try again in ${cooldown.remaining}s` : 'Sign In'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-accent font-medium">Sign up</Link>
      </p>
    </div>
  );
}
