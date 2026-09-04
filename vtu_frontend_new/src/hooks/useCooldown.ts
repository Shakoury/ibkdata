import { useState, useRef, useCallback } from 'react';

interface CooldownState {
  remaining: number;
  isCoolingDown: boolean;
}

export function useCooldown(seconds: number) {
  const [state, setState] = useState<CooldownState>({ remaining: 0, isCoolingDown: false });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setState({ remaining: seconds, isCoolingDown: true });
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.remaining <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return { remaining: 0, isCoolingDown: false };
        }
        return { remaining: prev.remaining - 1, isCoolingDown: true };
      });
    }, 1000);
  }, [seconds]);

  return { ...state, start };
}
