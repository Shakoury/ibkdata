import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Receipt, Plus, History, User, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useBalance } from '@/hooks/useWallet';
import { formatNaira } from '@/utils/format';

const navItems = [
  { to: '/app', label: 'Home', icon: Home },
  { to: '/app/transactions', label: 'Transactions', icon: Receipt },
  { to: '/app/topup', label: 'Top-up', icon: Plus },
  { to: '/app/history', label: 'History', icon: History },
  { to: '/app/profile', label: 'Profile', icon: User },
];

export function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const balance = useBalance();

  return (
    <div className="min-h-screen bg-cream max-w-md mx-auto flex flex-col">
      {/* Top Header */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-b border-border z-40 px-5 h-14 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">Welcome back</p>
          <p className="font-semibold text-sm text-ink">{user?.first_name} {user?.last_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted">Balance</p>
            <p className="font-semibold text-sm text-accent">
              {balance.isLoading ? '...' : formatNaira(balance.data ?? 0)}
            </p>
          </div>
          <button
            onClick={() => navigate('/app/profile')}
            className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center"
          >
            <span className="text-accent font-bold text-sm">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </span>
          </button>
        </div>
      </header>

      <main className="flex-1 pb-20 pt-14">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-border z-40">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            const isCenter = item.to === '/app/topup';
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
              >
                {isCenter ? (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center -mt-6 ${active ? 'bg-accent' : 'bg-accent/90'}`}>
                    <Icon size={20} className="text-white" />
                  </div>
                ) : (
                  <Icon size={22} className={active ? 'text-accent' : 'text-muted'} />
                )}
                <span className={`text-[10px] ${active ? 'text-accent font-medium' : 'text-muted'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
