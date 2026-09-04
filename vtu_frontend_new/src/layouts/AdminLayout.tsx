import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowLeftRight, Settings, Wallet, LogOut } from 'lucide-react';
import { useLogout } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/admin/services', label: 'Services', icon: Settings },
  { to: '/admin/wallet', label: 'Wallet', icon: Wallet },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-admin-bg text-white flex">
      <aside className="w-60 bg-admin-card border-r border-white/10 flex flex-col fixed h-full">
        <div className="p-5 border-b border-white/10">
          <h1 className="text-lg font-bold text-accent">IBKDATA Admin</h1>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  active ? 'bg-accent/10 text-accent border-l-2 border-accent' : 'text-admin-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <button
          onClick={() => logout.mutateAsync().finally(() => navigate('/login'))}
          className="flex items-center gap-3 px-5 py-3 text-sm text-admin-muted hover:text-error border-t border-white/10"
        >
          {logout.isPending ? <Spinner size={16} /> : <LogOut size={18} />}
          Logout
        </button>
      </aside>

      <main className="flex-1 ml-60 p-6">
        <Outlet />
      </main>
    </div>
  );
}
