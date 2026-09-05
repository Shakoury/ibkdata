import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { usePayElectricity } from '@/hooks/useTransactions';
import { useBalance } from '@/hooks/useWallet';
import { useTransactionStore } from '@/store/transactionStore';
import { useToast } from '@/hooks/useToast';
import { extractError } from '@/api/client';
import { formatNaira } from '@/utils/format';
import { Button } from '@/components/ui/Spinner';
import { PinPad } from '@/components/PinPad';
import { useElectricityProviders } from '@/hooks/useServices';
import { InsufficientBalanceModal } from '@/components/InsufficientBalanceModal';
import { Modal } from '@/components/ui/Modal';

const meterTypes = ['prepaid', 'postpaid'] as const;

export function PayElectricityPage() {
  const navigate = useNavigate();
  const pay = usePayElectricity();
  const balance = useBalance();
  const setDraft = useTransactionStore((s) => s.setDraft);
  const toast = useToast();

  const [provider, setProvider] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [amount, setAmount] = useState<number | ''>('');
  const [pinOpen, setPinOpen] = useState(false);
  const [insufficient, setInsufficient] = useState(false);
  const [success, setSuccess] = useState(false);
  const { data: providersData } = useElectricityProviders();
  const providersList = providersData ?? [];

  const currentBalance = balance.data ?? 0;
  const numAmount = typeof amount === 'number' ? amount : 0;
  const canProceed = provider && meterNumber && numAmount > 0;

  const proceed = () => {
    if (meterNumber.length < 6) {
      toast.error('Enter a valid meter number');
      return;
    }
    if (numAmount < 500) {
      toast.error('Minimum electricity payment is ₦500');
      return;
    }
    if (numAmount > 500000) {
      toast.error('Maximum electricity payment is ₦500,000');
      return;
    }
    if (numAmount > currentBalance) {
      setDraft({ type: 'electricity', provider, meter_number: meterNumber, meter_type: meterType, amount: numAmount });
      setInsufficient(true);
      return;
    }
    setPinOpen(true);
  };

  const confirm = async (pin: string) => {
    try {
      await pay.mutateAsync({ provider, meter_number: meterNumber, meter_type: meterType, amount: numAmount, pin });
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
      <h1 className="text-xl font-semibold mb-4">Pay Electricity</h1>

      <div className="card mb-4">
        <p className="text-sm text-muted">Balance</p>
        <p className="text-2xl font-bold">{formatNaira(currentBalance)}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1.5">Provider</label>
          <select className="input-field" value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="">Select provider</option>
            {providersList.map((p: any) => <option key={p.id} value={p.code}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">Meter Number</label>
          <input
            className="input-field"
            value={meterNumber}
            onChange={(e) => setMeterNumber(e.target.value)}
            placeholder="Meter number"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">Meter Type</label>
          <div className="grid grid-cols-2 gap-2">
            {meterTypes.map((m) => (
              <button
                key={m}
                onClick={() => setMeterType(m)}
                className={`py-2 rounded-btn text-sm font-medium border capitalize transition-colors ${
                  meterType === m ? 'bg-accent text-white border-accent' : 'bg-white border-border'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">Amount</label>
          <input
            type="number"
            className="input-field"
            value={amount}
            onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
            placeholder="Amount"
          />
        </div>

        <Button className="w-full" disabled={!canProceed} onClick={proceed}>Proceed</Button>
      </div>

      <PinPad open={pinOpen} onClose={() => setPinOpen(false)} onConfirm={confirm} loading={pay.isPending} />

      <InsufficientBalanceModal
        open={insufficient}
        onClose={() => setInsufficient(false)}
        balance={currentBalance}
        amountNeeded={numAmount}
        onFund={() => { setInsufficient(false); navigate('/app/fund'); }}
      />

      <Modal open={success} onClose={() => navigate('/app')}>
        <div className="flex flex-col items-center text-center py-4">
          <CheckCircle size={56} className="text-success mb-4" />
          <h3 className="text-xl font-semibold mb-1">Electricity Payment Successful</h3>
          <p className="text-muted">{formatNaira(numAmount)} • {provider}</p>
          <p className="text-sm text-muted">{meterNumber}</p>
          <Button className="w-full mt-6" onClick={() => navigate('/app')}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
