import { useState, useEffect } from 'react';
import { Delete } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Spinner';

interface PinPadProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  loading?: boolean;
  title?: string;
}

const MAX_ATTEMPTS = 5;

export function PinPad({ open, onClose, onConfirm, loading, title = 'Enter Transaction PIN' }: PinPadProps) {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  // Zero PIN and reset state whenever modal opens/closes
  useEffect(() => {
    if (open) {
      setPin('');
      setAttempts(0);
      setLocked(false);
    } else {
      setPin('');
    }
  }, [open]);

  const press = (n: string) => {
    if (locked) return;
    if (pin.length < 4) setPin(pin + n);
  };
  const back = () => setPin(pin.slice(0, -1));

  const handleConfirm = () => {
    if (pin.length !== 4 || locked) return;
    const pinCopy = pin;
    setPin(''); // zero immediately after use
    onConfirm(pinCopy);
  };

  const isLockedOut = attempts >= MAX_ATTEMPTS;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col items-center">
        <div className="flex gap-3 mb-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 border-accent ${pin.length > i ? 'bg-accent' : ''}`}
            />
          ))}
        </div>

        {isLockedOut ? (
          <p className="text-error text-sm mb-4 text-center">
            Too many attempts. Please try again later.
          </p>
        ) : (
          attempts > 0 && (
            <p className="text-error text-xs mb-4">
              Incorrect PIN. {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining.
            </p>
          )
        )}

        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
            <button
              key={n}
              onClick={() => press(n)}
              disabled={isLockedOut}
              className="h-14 rounded-card bg-cream text-xl font-medium hover:bg-border transition-colors disabled:opacity-40"
            >
              {n}
            </button>
          ))}
          <div />
          <button onClick={() => press('0')} disabled={isLockedOut} className="h-14 rounded-card bg-cream text-xl font-medium hover:bg-border disabled:opacity-40">0</button>
          <button onClick={back} disabled={isLockedOut} className="h-14 flex items-center justify-center rounded-card bg-cream hover:bg-border disabled:opacity-40">
            <Delete size={20} />
          </button>
        </div>

        <Button
          className="w-full mt-6"
          loading={loading}
          disabled={pin.length !== 4 || isLockedOut}
          onClick={handleConfirm}
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
}
