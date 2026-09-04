import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { usePayCable } from '@/hooks/useTransactions';
import { useBalance } from '@/hooks/useWallet';
import { useTransactionStore } from '@/store/transactionStore';
import { useToast } from '@/hooks/useToast';
import { extractError } from '@/api/client';
import { formatNaira } from '@/utils/format';
import { Button } from '@/components/ui/Spinner';
import { PinPad } from '@/components/PinPad';
import { InsufficientBalanceModal } from '@/components/InsufficientBalanceModal';
import { Modal } from '@/components/ui/Modal';

const providers = ['DSTV', 'GOTV', 'Startimes'];

const packages: Record<string, { id: string; label: string; amount: number }[]> = {
  DSTV: [
    { id: 'padi', label: 'Padi', amount: 4400 },
    { id: 'yanga', label: 'Yanga', amount: 6000 },
    { id: 'confam', label: 'Confam', amount: 11000 },
    { id: 'compact', label: 'Compact', amount: 19000 },
    { id: 'premium', label: 'Premium', amount: 44500 },
  ],
  GOTV: [
    { id: 'jolli', label: 'Jolli', amount: 3900 },
    { id: 'max', label: 'Max', amount: 5700 },
    { id: 'supa', label: 'Supa', amount: 6400 },
  ],
  Startimes: [
    { id: 'basic', label: 'Basic', amount: 1850 },
    { id: 'classic', label: 'Classic', amount: 3900 },
    { id: 'super', label: 'Super', amount: 6250 },
  ],
};

export function PayCablePage() {
  const navigate = useNavigate();
  const pay = usePayCable();
  const balance = useBalance();
  const setDraft = useTransactionStore((s) => s.setDraft);
  const toast = useToast();

  const [provider, setProvider] = useState('');
  const [smartCard, setSmartCard] = useState('');
  const [pkg, setPkg] = useState<{ id: string; label: string; amount: number } | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [insufficient, setInsufficient] = useState(false);
  const [success, setSuccess] = useState(false);

  const currentBalance = balance.data ?? 0;
  const canProceed = provider && smartCard && pkg;

  const proceed = () => {
    if (!pkg) return;
    if (smartCard.length < 6) {
      toast.error('Enter a valid smart card number');
      return;
    }
    if (pkg.amount > currentBalance) {
      setDraft({ type: 'cable', provider, smart_card: smartCard, package_id: pkg.id, package_label: pkg.label, amount: pkg.amount });
      setInsufficient(true);
      return;
    }
    setPinOpen(true);
  };

  const confirm = async (pin: string) => {
    if (!pkg) return;
    try {
      await pay.mutateAsync({ provider, smart_card: smartCard, package_id: pkg.id, pin });
      setPinOpen(false);
      setSuccess(true);
    } catch (err) {
      toast.error(extractError(err));
      setPinOpen(false);
    }
  };

  return (
    <div className="px-5 pt-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted mb-4">
        <ArrowLeft size={20} /> Back
      </button>
      <h1 className="text-xl font-semibold mb-4">Cable TV</h1>

      <div className="card mb-4">
        <p className="text-sm text-muted">Balance</p>
        <p className="text-2xl font-bold">{formatNaira(currentBalance)}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1.5">Provider</label>
          <div className="grid grid-cols-3 gap-2">
            {providers.map((p) => (
              <button
                key={p}
                onClick={() => { setProvider(p); setPkg(null); }}
                className={`py-2 rounded-btn text-sm font-medium border transition-colors ${
                  provider === p ? 'bg-accent text-white border-accent' : 'bg-white border-border'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">Smart Card Number</label>
          <input
            className="input-field"
            value={smartCard}
            onChange={(e) => setSmartCard(e.target.value)}
            placeholder="Smart card number"
          />
        </div>

        {provider && (
          <div>
            <label className="text-sm font-medium block mb-1.5">Package</label>
            <div className="space-y-2">
              {packages[provider].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPkg(p)}
                  className={`card w-full flex items-center justify-between text-left transition-colors ${
                    pkg?.id === p.id ? 'border-accent border-2' : ''
                  }`}
                >
                  <span className="font-medium">{p.label}</span>
                  <span className="text-accent font-semibold">{formatNaira(p.amount)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Button className="w-full" disabled={!canProceed} onClick={proceed}>Proceed</Button>
      </div>

      <PinPad open={pinOpen} onClose={() => setPinOpen(false)} onConfirm={confirm} loading={pay.isPending} />

      <InsufficientBalanceModal
        open={insufficient}
        onClose={() => setInsufficient(false)}
        balance={currentBalance}
        amountNeeded={pkg?.amount ?? 0}
        onFund={() => { setInsufficient(false); navigate('/app/fund'); }}
      />

      <Modal open={success} onClose={() => navigate('/app')}>
        <div className="flex flex-col items-center text-center py-4">
          <CheckCircle size={56} className="text-success mb-4" />
          <h3 className="text-xl font-semibold mb-1">Cable Payment Successful</h3>
          <p className="text-muted">{pkg?.label} • {provider}</p>
          <Button className="w-full mt-6" onClick={() => navigate('/app')}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
