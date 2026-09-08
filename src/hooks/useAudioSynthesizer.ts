import { useCallback, useRef } from 'react';

/**
 * 🔊 Web Audio Synthesizer Hook
 * Generates turnstile chimes and acoustic chirps with 0 external sound files.
 */
export function useAudioSynthesizer() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  /**
   * High-pitch double chime for ACCESS GRANTED (880Hz -> 1320Hz)
   */
  const playSuccessChime = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio playback fails silently if user has not interacted
    }
  }, [getAudioContext]);

  /**
   * Low-pitch buzzer for ACCESS DENIED / REPLAY (220Hz -> 140Hz)
   */
  const playDeniedBuzzer = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio playback fails silently
    }
  }, [getAudioContext]);

  /**
   * Contactless NFC Tap Soft Ping (523.25Hz / C5)
   */
  const playNfcTapChime = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Silent catch
    }
  }, [getAudioContext]);

  /**
   * Ultrasonic / 4-Tone Acoustic Chirp fallback (1200Hz -> 1800Hz)
   */
  const playAcousticChirp = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const freqs = [1200, 1400, 1600, 1800];
      const now = ctx.currentTime;

      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.04);
        gain.gain.setValueAtTime(0.15, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + (i + 1) * 0.04);
      });
    } catch {
      // Silent catch
    }
  }, [getAudioContext]);

  return {
    playSuccessChime,
    playDeniedBuzzer,
    playNfcTapChime,
    playAcousticChirp
  };
}
