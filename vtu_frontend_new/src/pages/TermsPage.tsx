import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function TermsPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-cream px-6 py-8 max-w-md mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted mb-6 hover:text-ink transition-colors">
        <ArrowLeft size={20} /> Back
      </button>
      <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>
      <div className="space-y-5 text-sm text-muted leading-relaxed">
        <p><span className="font-semibold text-ink">Last updated:</span> September 2026</p>
        <div className="card">
          <h2 className="font-semibold text-ink mb-2">Account Responsibility</h2>
          <p>You are responsible for maintaining the security of your account and PIN. Report any unauthorized access immediately.</p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-ink mb-2">Transactions</h2>
          <p>All transactions are final once processed. Refunds are handled on a case-by-case basis for failed transactions.</p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-ink mb-2">Wallet Funding</h2>
          <p>Funds transferred to your virtual account will be credited within 5 minutes. Contact support for delays.</p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-ink mb-2">Prohibited Use</h2>
          <p>You may not use IBKDATA for fraudulent transactions, money laundering, or any illegal activity.</p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-ink mb-2">Contact</h2>
          <p>For support, contact us at <span className="text-accent">support@ibkdata.com</span></p>
        </div>
      </div>
    </div>
  );
}
