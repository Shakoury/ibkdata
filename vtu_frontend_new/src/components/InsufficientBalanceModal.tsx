import { AlertTriangle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Spinner';
import { formatNaira } from '@/utils/format';

interface Props {
  open: boolean;
  onClose: () => void;
  balance: number;
  amountNeeded: number;
  onFund: () => void;
}

export function InsufficientBalanceModal({ open, onClose, balance, amountNeeded, onFund }: Props) {
  const shortfall = Math.max(0, amountNeeded - balance);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
          <AlertTriangle size={32} className="text-accent" />
        </div>
        <h3 className="text-xl font-semibold mb-1">Insufficient Balance</h3>
        <p className="text-muted text-sm mb-5">
          Would you like to fund your wallet to complete this transaction?
        </p>

        <div className="w-full space-y-2 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Current balance</span>
            <span className="font-medium">{formatNaira(balance)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Amount needed</span>
            <span className="font-medium">{formatNaira(amountNeeded)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-border pt-2">
            <span className="text-muted">Shortfall</span>
            <span className="font-semibold text-accent">{formatNaira(shortfall)}</span>
          </div>
        </div>

        <div className="w-full flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={onFund}>
            Fund Wallet {formatNaira(shortfall)}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
