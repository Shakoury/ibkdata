import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useBuyAirtime } from '@/hooks/useTransactions';
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
const presets = [100, 200, 500, 1000, 2000, 5000];

export function BuyAirtimePage() {
  const navigate = useNavigate();
  const buy = useBuyAirtime();
  const balance = useBalance();
  const setDraft = useTransactionStore((s) => s.setDraft);
  const toast = useToast();

  const [phone, setPhone] = useState('');
  const [network, setNetwork] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [pinOpen, setPinOpen] = useState(false);
  const [insufficient, setInsufficient] = useState(false);
  const [success, setSuccess] = useState(false);

  const currentBalance = balance.data ?? 0;
  const numAmount = typeof amount === 'number' ? amount : 0;
  const canProceed = phone && network && numAmount > 0;

  const proceed = () => {
    if (phone.length < 11) {
      toast.error('Enter a valid 11-digit phone number');
      return;
    }
    if (numAmount < 50) {
      toast.error('Minimum amount is ₦50');
      return;
    }
    if (numAmount > 100000) {
      toast.error('Maximum airtime amount is ₦100,000');
      return;
    }
    if (numAmount > currentBalance) {
      setDraft({ type: 'airtime', phone, network, amount: numAmount });
      setInsufficient(true);
      return;
    }
    setPinOpen(true);
  };

  const confirm = async (pin: string) => {
    try {
      await buy.mutateAsync({ phone, network, amount: numAmount, pin });
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
      <h1 className="text-xl font-semibold mb-4">Buy Airtime</h1>

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
                  network === n ? 'bg-accent text-white border-accent' : 'bg-white border-border text-ink'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">Amount</label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {presets.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={`py-2 rounded-btn text-sm font-medium border transition-colors ${
                  amount === a ? 'bg-accent text-white border-accent' : 'bg-white border-border'
                }`}
              >
                {formatNaira(a)}
              </button>
            ))}
          </div>
          <input
            type="number"
            className="input-field"
            value={amount}
            onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
            placeholder="Custom amount"
          />
        </div>

        <Button className="w-full" disabled={!canProceed} onClick={proceed}>
          Proceed
        </Button>
      </div>

      <PinPad open={pinOpen} onClose={() => setPinOpen(false)} onConfirm={confirm} loading={buy.isPending} />

      <InsufficientBalanceModal
        open={insufficient}
        onClose={() => setInsufficient(false)}
        balance={currentBalance}
        amountNeeded={numAmount}
        onFund={() => {
          setInsufficient(false);
          navigate('/app/fund');
        }}
      />

      <Modal open={success} onClose={() => navigate('/app')}>
        <div className="flex flex-col items-center text-center py-4">
          <CheckCircle size={56} className="text-success mb-4" />
          <h3 className="text-xl font-semibold mb-1">Airtime Purchase Successful</h3>
          <p className="text-muted mb-1">{formatNaira(numAmount)} to {phone}</p>
          <p className="text-sm text-muted">{network}</p>
          <Button className="w-full mt-6" onClick={() => navigate('/app')}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
