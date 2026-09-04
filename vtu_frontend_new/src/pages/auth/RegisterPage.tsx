import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { extractError } from '@/api/client';
import { Button } from '@/components/ui/Spinner';

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useRegister();
  const toast = useToast();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.first_name.trim()) e.first_name = 'Required';
    if (!form.last_name.trim()) e.last_name = 'Required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Valid email required';
    if (!/^0\d{10}$/.test(form.phone)) e.phone = 'Valid phone required';
    if (form.password.length < 8) e.password = 'Min 8 characters';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register.mutateAsync(form);
      toast.success('Account created. Check your email for verification.');
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const field = (name: keyof typeof form, label: string, type = 'text') => (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <input
        type={type}
        className="input-field"
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      />
      {errors[name] && <p className="text-error text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center px-6 py-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-1">Create account</h1>
      <p className="text-muted mb-6">Join IBKDATA to start topping up</p>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {field('first_name', 'First Name')}
          {field('last_name', 'Last Name')}
        </div>
        {field('email', 'Email', 'email')}
        {field('phone', 'Phone Number')}
        {field('password', 'Password', 'password')}
        {field('confirm_password', 'Confirm Password', 'password')}
        <Button type="submit" loading={register.isPending} className="w-full">Create Account</Button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-accent font-medium">Sign in</Link>
      </p>
    </div>
  );
}
