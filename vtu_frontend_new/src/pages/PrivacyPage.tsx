import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-cream px-6 py-8 max-w-md mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted mb-6 hover:text-ink transition-colors">
        <ArrowLeft size={20} /> Back
      </button>
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <div className="space-y-5 text-sm text-muted leading-relaxed">
        <p><span className="font-semibold text-ink">Last updated:</span> September 2026</p>
        <div className="card">
          <h2 className="font-semibold text-ink mb-2">Information We Collect</h2>
          <p>We collect your name, email, phone number, and transaction data to provide our services securely.</p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-ink mb-2">How We Use Your Data</h2>
          <p>Your data is used to process transactions, send notifications, and improve our platform. We never sell your data to third parties.</p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-ink mb-2">Security</h2>
          <p>All transactions are secured with bank-grade encryption via Monnify. Your wallet PIN is hashed and never stored in plain text.</p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-ink mb-2">Contact</h2>
          <p>For privacy concerns, contact us at <span className="text-accent">support@ibkdata.com</span></p>
        </div>
      </div>
    </div>
  );
}
