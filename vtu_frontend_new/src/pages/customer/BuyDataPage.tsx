import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useBuyData } from '@/hooks/useTransactions';
import { useBalance } from '@/hooks/useWallet';
import { useTransactionStore } from '@/store/transactionStore';
import { useToast } from '@/hooks/useToast';
import { extractError } from '@/api/client';
import { formatNaira } from '@/utils/format';
import { Button } from '@/components/ui/Spinner';
import { PinPad } from '@/components/PinPad';
import { InsufficientBalanceModal } from '@/components/InsufficientBalanceModal';
import { Modal } from '@/components/ui/Modal';

const networks = ['MTN', 'Airtel', 'Glo', '9mobile'];
const plans = [
  { id: '500mb', label: '500MB', amount: 200 },
  { id: '1gb', label: '1GB', amount: 350 },
  { id: '2gb', label: '2GB', amount: 650 },
  { id: '5gb', label: '5GB', amount: 1500 },
  { id: '10gb', label: '10GB', amount: 3000 },
];

export function BuyDataPage() {
  const navigate = useNavigate();
  const buy = useBuyData();
  const balance = useBalance();
  const setDraft = useTransactionStore((s) => s.setDraft);
  const toast = useToast();

  const [phone, setPhone] = useState('');
  const [network, setNetwork] = useState('');
  const [plan, setPlan] = useState<typeof plans[0] | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [insufficient, setInsufficient] = useState(false);
  const [success, setSuccess] = useState(false);

  const currentBalance = balance.data ?? 0;
  const canProceed = phone && network && plan;

  const proceed = () => {
    if (!plan) return;
    if (phone.length < 11) {
      toast.error('Enter a valid 11-digit phone number');
      return;
    }
    if (plan.amount > currentBalance) {
      setDraft({ type: 'data', phone, network, amount: plan.amount, plan_id: plan.id, plan_label: plan.label });
      setInsufficient(true);
      return;
    }
    setPinOpen(true);
  };

  const confirm = async (pin: string) => {
    if (!plan) return;
    try {
      await buy.mutateAsync({ phone, network, plan_id: plan.id, pin });
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
      <h1 className="text-xl font-semibold mb-4">Buy Data</h1>

      <div className="card mb-4">
        <p className="text-sm text-muted">Balance</p>
        <p className="text-2xl font-bold">{formatNaira(currentBalance)}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1.5">Phone Number</label>
          <input
            className="input-field"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="08012345678"
            maxLength={11}
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">Network</label>
          <div className="grid grid-cols-4 gap-2">
            {networks.map((n) => (
              <button
                key={n}
                onClick={() => setNetwork(n)}
                className={`py-2 rounded-btn text-sm font-medium border transition-colors ${
                  network === n ? 'bg-accent text-white border-accent' : 'bg-white border-border'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">Data Plan</label>
          <div className="space-y-2">
            {plans.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlan(p)}
                className={`card w-full flex items-center justify-between text-left transition-colors ${
                  plan?.id === p.id ? 'border-accent border-2' : ''
                }`}
              >
                <span className="font-medium">{p.label}</span>
                <span className="text-accent font-semibold">{formatNaira(p.amount)}</span>
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full" disabled={!canProceed} onClick={proceed}>Proceed</Button>
      </div>

      <PinPad open={pinOpen} onClose={() => setPinOpen(false)} onConfirm={confirm} loading={buy.isPending} />

      <InsufficientBalanceModal
        open={insufficient}
        onClose={() => setInsufficient(false)}
        balance={currentBalance}
        amountNeeded={plan?.amount ?? 0}
        onFund={() => { setInsufficient(false); navigate('/app/fund'); }}
      />

      <Modal open={success} onClose={() => navigate('/app')}>
        <div className="flex flex-col items-center text-center py-4">
          <CheckCircle size={56} className="text-success mb-4" />
          <h3 className="text-xl font-semibold mb-1">Data Purchase Successful</h3>
          <p className="text-muted">{plan?.label} to {phone}</p>
          <Button className="w-full mt-6" onClick={() => navigate('/app')}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
