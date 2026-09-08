import React, { useEffect, useRef } from 'react';
import { ClientTotpResult } from '../../utils/crypto';
import { useAudioSynthesizer } from '../../hooks/useAudioSynthesizer';

interface DynamicQrDisplayProps {
  totp: ClientTotpResult | null;
  remainingSeconds: number;
  progressPercent: number;
  ticketId: string;
  onShowToast: (msg: string) => void;
}

export const DynamicQrDisplay: React.FC<DynamicQrDisplayProps> = ({
  totp,
  remainingSeconds,
  progressPercent,
  ticketId,
  onShowToast
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { playAcousticChirp } = useAudioSynthesizer();

  // Draw QR code onto canvas
  useEffect(() => {
    if (!canvasRef.current || !totp?.rawPayload) return;

    const canvas = canvasRef.current;
    const windowWithQr = window as unknown as {
      QRCode?: {
        toCanvas: (
          canvas: HTMLCanvasElement,
          text: string,
          options: unknown,
          callback?: (error: unknown) => void
        ) => void;
      };
    };

    if (windowWithQr.QRCode?.toCanvas) {
      windowWithQr.QRCode.toCanvas(
        canvas,
        totp.rawPayload,
        {
          width: 220,
          margin: 1,
          color: {
            dark: '#010101',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H' // High redundancy allows logo in center
        },
        (error) => {
          if (!error) {
            // Draw center logo overlay
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const size = canvas.width;
              const logoSize = size * 0.22;
              const center = size / 2;
              
              // Dark circular background for badge
              ctx.fillStyle = '#010101';
              ctx.beginPath();
              ctx.arc(center, center, logoSize / 2 + 4, 0, Math.PI * 2);
              ctx.fill();

              // Cyan border ring
              ctx.strokeStyle = '#25F4EE';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(center, center, logoSize / 2 + 3, 0, Math.PI * 2);
              ctx.stroke();

              // Draw neon lightning bolt icon
              ctx.fillStyle = '#FE2C55';
              ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('⚡', center, center);
            }
          }
        }
      );
    }
  }, [totp]);

  const handleAcousticChirp = () => {
    playAcousticChirp();
    onShowToast('📡 Emitiendo ráfaga acústica ultrasónica (18kHz) hacia el torniquete...');
  };

  const handleDownloadWallet = (walletType: 'apple' | 'google') => {
    const filename = walletType === 'apple' ? `ticket-${ticketId}.pkpass` : `ticket-${ticketId}-wallet.json`;
    const dummyContent = JSON.stringify({
      passTypeIdentifier: 'pass.com.tiketya.smartticket',
      serialNumber: ticketId,
      authenticationToken: totp?.authMac || 'rotary-token',
      description: 'TiketYA! Smart Ticket Pass',
      teamIdentifier: 'TRTSLAB26'
    }, null, 2);

    const blob = new Blob([dummyContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    onShowToast(`📲 Pase descargado para ${walletType === 'apple' ? 'Apple Wallet (.pkpass)' : 'Google Wallet'}`);
  };

  const circumference = 2 * Math.PI * 18; // r=18
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="dynamic-qr-container">
      <div className="qr-watermark-pill">
        <span className="live-pulse" />
        <span>ANTI-SCREENSHOT ACTIVO</span>
      </div>

      <div className="qr-canvas-wrapper">
        <canvas id="qr-canvas" ref={canvasRef} width={220} height={220} className="qr-canvas-el" />
      </div>

      <div className="qr-metadata-row">
        <div className="countdown-hud">
          <div className="circle-progress-container">
            <svg width="44" height="44" className="progress-ring">
              <circle
                cx="22"
                cy="22"
                r="18"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="3.5"
                fill="transparent"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                stroke={remainingSeconds <= 3 ? 'var(--tiktok-red)' : 'var(--tiktok-cyan)'}
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease',
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%'
                }}
              />
            </svg>
            <span className="progress-seconds-text">{remainingSeconds}s</span>
          </div>

          <div className="countdown-labels">
            <span className="countdown-caption">ROTACIÓN TOTP</span>
            <span className="countdown-sub">Válido por {remainingSeconds} seg</span>
          </div>
        </div>

        <div className="totp-pin-box">
          <span className="pin-label">PIN TOTP</span>
          <span className="pin-value">
            {totp ? `${totp.pin.slice(0, 4)} ${totp.pin.slice(4)}` : '•••• ••••'}
          </span>
        </div>
      </div>

      <div className="qr-action-buttons">
        <button
          className="btn-acoustic-chirp"
          onClick={handleAcousticChirp}
          title="Transmite el código por ráfagas de audio de alta frecuencia si tu pantalla está rota"
        >
          <span>🔊</span>
          <span>Respaldo Acústico (18kHz)</span>
        </button>

        <div className="wallet-pass-row">
          <button
            className="btn-wallet apple-wallet"
            onClick={() => handleDownloadWallet('apple')}
          >
            <span></span>
            <span>Apple Wallet</span>
          </button>
          <button
            className="btn-wallet google-wallet"
            onClick={() => handleDownloadWallet('google')}
          >
            <span style={{ color: '#4285F4', fontWeight: 800 }}>G</span>
            <span>Google Wallet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
