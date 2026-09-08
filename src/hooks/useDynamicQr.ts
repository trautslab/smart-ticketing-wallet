import { useState, useEffect, useCallback, useRef } from 'react';
import { computeClientTotp, ClientTotpResult } from '../utils/crypto';

interface UseDynamicQrProps {
  ticketId: string;
  seedHex: string;
  stepSeconds?: number;
}

export interface UseDynamicQrReturn {
  totp: ClientTotpResult | null;
  remainingSeconds: number;
  progressPercent: number; // 0% to 100%
  refresh: () => Promise<void>;
  isLoading: boolean;
}

export function useDynamicQr({
  ticketId,
  seedHex,
  stepSeconds = 15
}: UseDynamicQrProps): UseDynamicQrReturn {
  const [totp, setTotp] = useState<ClientTotpResult | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(stepSeconds);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const lastCounterRef = useRef<number>(-1);

  const calculateTotp = useCallback(async () => {
    try {
      const now = Date.now();
      const result = await computeClientTotp(ticketId, seedHex, now, stepSeconds);
      setTotp(result);
      setRemainingSeconds(result.remainingSeconds);
      lastCounterRef.current = result.counter;
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to compute client TOTP:', err);
    }
  }, [ticketId, seedHex, stepSeconds]);

  // Initial calculation
  useEffect(() => {
    calculateTotp();
  }, [calculateTotp]);

  // Periodic timer (1-second heartbeat)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const currentCounter = Math.floor(now / (stepSeconds * 1000));
      const elapsed = (now / 1000) % stepSeconds;
      const remaining = Math.max(0, Math.ceil(stepSeconds - elapsed));

      setRemainingSeconds(remaining);

      // If counter stepped to next epoch, recompute cryptographic token
      if (currentCounter !== lastCounterRef.current) {
        calculateTotp();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTotp, stepSeconds]);

  // Calculate progress percentage for circular ring
  const progressPercent = Math.min(100, Math.max(0, (remainingSeconds / stepSeconds) * 100));

  return {
    totp,
    remainingSeconds,
    progressPercent,
    refresh: calculateTotp,
    isLoading
  };
}
