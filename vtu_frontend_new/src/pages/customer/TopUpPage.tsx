import { useNavigate } from 'react-router-dom';
import { Phone, Wifi, Zap, Tv } from 'lucide-react';

const services = [
  { label: 'Airtime', icon: Phone, to: '/app/airtime', desc: 'Top up any phone' },
  { label: 'Data', icon: Wifi, to: '/app/data', desc: 'Buy data bundles' },
  { label: 'Electricity', icon: Zap, to: '/app/electricity', desc: 'Pay your bills' },
  { label: 'Cable TV', icon: Tv, to: '/app/cable', desc: 'DSTV, GOTV, Startimes' },
];

export function TopUpPage() {
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-8">
      <h1 className="text-xl font-semibold mb-4">Top Up</h1>
      <div className="space-y-3">
        {services.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => navigate(s.to)}
              className="card w-full flex items-center gap-4 text-left hover:shadow-card-hover transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Icon size={24} className="text-accent" />
              </div>
              <div>
                <p className="font-semibold">{s.label}</p>
                <p className="text-sm text-muted">{s.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
