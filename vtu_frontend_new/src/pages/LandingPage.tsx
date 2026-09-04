import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Phone, Wifi, Zap, Tv, Shield, Clock, Star, Smartphone } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { tokenStorage } from '@/api/client';

export function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated) || !!tokenStorage.getAccess();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-card bg-accent flex items-center justify-center">
            <Smartphone className="text-white" size={16} />
          </div>
          <span className="font-bold text-lg text-ink">IBKDATA</span>
        </div>
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            {user && <span className="text-sm font-medium text-ink">{user.first_name} {user.last_name}</span>}
            <button
              onClick={() => navigate('/app')}
              className="w-9 h-9 rounded-full bg-accent flex items-center justify-center"
            >
              <span className="text-white font-bold text-sm">
                {user ? `${user.first_name?.[0]}${user.last_name?.[0]}` : '👤'}
              </span>
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-ink transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary px-4 py-2 text-sm"
            >
              Get Started
            </button>
          </div>
        )}
      </div>

      {/* Hero */}
      <div className="px-6 pt-10 pb-10 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-card bg-accent flex items-center justify-center mx-auto mb-6">
          <Smartphone className="text-white" size={32} />
        </div>
        <h1 className="text-3xl font-bold mb-3 leading-tight">
          Buy Airtime, Data & Pay Bills <span className="text-accent">Instantly</span>
        </h1>
        <p className="text-muted mb-8 text-sm leading-relaxed">
          Nigeria fastest VTU platform. Fund your wallet and pay for any service in seconds, 24/7.
        </p>
        {isAuthenticated ? (
          <button
            onClick={() => navigate('/app')}
            className="btn-primary w-full text-base py-3"
          >
            Go to Dashboard
          </button>
        ) : (
          <>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary w-full text-base py-3"
            >
              Create Free Account
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary w-full text-base py-3 mt-3"
            >
              Sign In
            </button>
          </>
        )}
      </div>

      {/* Services */}
      <div className="px-6 py-8 max-w-md mx-auto">
        <h2 className="font-semibold text-base mb-4">Our Services</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Phone, label: "Airtime", desc: "MTN, Glo, Airtel, 9mobile" },
            { icon: Wifi, label: "Data Bundles", desc: "All networks" },
            { icon: Zap, label: "Electricity", desc: "All DISCOs" },
            { icon: Tv, label: "Cable TV", desc: "DSTV, GOTV, Startimes" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-accent" />
              </div>
              <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-6 max-w-md mx-auto">
        <h2 className="font-semibold text-base mb-4">Why IBKDATA?</h2>
        <div className="space-y-3">
          {[
            { icon: Clock, title: "Instant Delivery", desc: "Transactions processed in seconds, 24/7." },
            { icon: Shield, title: "Secure & Reliable", desc: "Bank-grade security with Monnify integration." },
            { icon: Star, title: "Best Rates", desc: "Competitive prices on all VTU services." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-accent" />
              </div>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-8 max-w-md mx-auto border-t border-border mt-4 text-center">
        <p className="text-xs text-muted">© 2026 IBKDATA. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-3">
          <button onClick={() => navigate('/privacy')} className="text-xs text-accent font-medium">Privacy Policy</button>
          <button onClick={() => navigate('/terms')} className="text-xs text-accent font-medium">Terms of Service</button>
        </div>
      </div>
    </div>
  );
}
