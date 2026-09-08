import React, { useEffect, useRef, useState } from 'react';
import { ClientTotpResult } from '../../utils/crypto';
import { useAudioSynthesizer } from '../../hooks/useAudioSynthesizer';
import { detectUserPlatform } from '../../utils/deviceDetection';

interface DynamicQrDisplayProps {
  totp: ClientTotpResult | null;
  remainingSeconds: number;
  progressPercent: number;
  ticketId: string;
  onShowToast: (msg: string) => void;
  isInsideGeofence?: boolean;
}

export const DynamicQrDisplay: React.FC<DynamicQrDisplayProps> = ({
  totp,
  remainingSeconds,
  progressPercent,
  ticketId,
  onShowToast,
  isInsideGeofence = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { playAcousticChirp } = useAudioSynthesizer();
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop'>('desktop');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [walletModalType, setWalletModalType] = useState<'apple' | 'google'>('google');

  useEffect(() => {
    setPlatform(detectUserPlatform());
  }, []);

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
    onShowToast('📡 Emitiendo ráfaga sónica (18kHz) hacia el micrófono del molinete...');
  };

  const handleOpenWalletModal = (type: 'apple' | 'google') => {
    setWalletModalType(type);
    setIsWalletModalOpen(true);
    onShowToast(
      type === 'google'
        ? '📲 Vinculando con Google Wallet (Smart Tap)...'
        : '📲 Vinculando con Apple Wallet (Apple VAS)...'
    );
  };

  const circumference = 2 * Math.PI * 18; // r=18
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="dynamic-qr-container">
      {/* Consumer-friendly anti-fraud indicator */}
      <div
        className="qr-watermark-pill"
        title="El código se renueva cada 15 segundos. Las capturas de pantalla fijas quedan invalidadas en los molinetes."
      >
        <span className="live-pulse" />
        <span>CÓDIGO DINÁMICO 15s • ANTI-COPIAS</span>
      </div>

      {/* QR Canvas Area with Geofence Lock Overlay */}
      <div className="qr-canvas-wrapper" style={{ position: 'relative' }}>
        <canvas
          id="qr-canvas"
          ref={canvasRef}
          width={220}
          height={220}
          className={`qr-canvas-el ${!isInsideGeofence ? 'geofence-blurred' : ''}`}
          style={{
            transition: 'filter 0.3s ease',
            filter: !isInsideGeofence ? 'blur(14px)' : 'none'
          }}
        />

        {/* Security Lock Overlay when outside perimeter */}
        {!isInsideGeofence && (
          <div
            className="geofence-lock-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(5, 5, 8, 0.78)',
              backdropFilter: 'blur(6px)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
              zIndex: 10
            }}
          >
            <span style={{ fontSize: '2.4rem', marginBottom: '8px' }}>🔒</span>
            <div style={{ color: 'var(--tiktok-magenta)', fontWeight: 800, fontSize: '0.86rem', letterSpacing: '0.5px' }}>
              QR PROTEGIDO POR GEOCERCA
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '6px', lineHeight: 1.3 }}>
              Se activará automáticamente al ingresar al perímetro del estadio (&lt;500m)
            </div>
          </div>
        )}
      </div>

      {/* Metadata & Progress HUD */}
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
                stroke="var(--tiktok-cyan)"
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={isInsideGeofence ? strokeDashoffset : circumference}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 0.9s linear',
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%'
                }}
              />
            </svg>
            <div className="countdown-seconds">
              {isInsideGeofence ? `${remainingSeconds}s` : '🔒'}
            </div>
          </div>

          <div className="countdown-labels">
            <span className="countdown-caption">ROTACIÓN SEGURA</span>
            <span className="countdown-sub">
              {isInsideGeofence ? `Válido por ${remainingSeconds} seg` : 'En pausa preventiva'}
            </span>
          </div>
        </div>

        {/* Dynamic Numerical PIN Fallback */}
        <div className="totp-pin-box">
          <span className="pin-label">CÓDIGO NUMÉRICO</span>
          <span className="pin-value">
            {isInsideGeofence && totp?.pin
              ? `${totp.pin.substring(0, 4)} ${totp.pin.substring(4)}`
              : '•••• ••••'}
          </span>
        </div>
      </div>

      {/* Actions: Acoustic Chirp and Platform-detected Wallet Button */}
      <div className="qr-action-buttons">
        <button
          className="btn-acoustic-chirp"
          onClick={handleAcousticChirp}
          title="Si la pantalla de tu celular está rota o rayada, pulsa para transmitir tu entrada por audio al torniquete"
        >
          <span>🔊</span>
          <span>Respaldo Acústico (Pantalla Rota)</span>
        </button>

        {/* Operating System Aware Native Wallet Button */}
        <div className="wallet-pass-row">
          {platform === 'android' ? (
            <button
              className="btn-wallet google-wallet"
              onClick={() => handleOpenWalletModal('google')}
              style={{ width: '100%' }}
            >
              <span style={{ color: '#4285F4', fontWeight: 900, fontSize: '1.1rem' }}>G</span>
              <span>Guardar en Google Wallet</span>
            </button>
          ) : platform === 'ios' ? (
            <button
              className="btn-wallet apple-wallet"
              onClick={() => handleOpenWalletModal('apple')}
              style={{ width: '100%' }}
            >
              <span style={{ fontSize: '1.1rem' }}></span>
              <span>Agregar a Apple Wallet</span>
            </button>
          ) : (
            <>
              <button
                className="btn-wallet apple-wallet"
                onClick={() => handleOpenWalletModal('apple')}
              >
                <span></span>
                <span>Apple Wallet</span>
              </button>
              <button
                className="btn-wallet google-wallet"
                onClick={() => handleOpenWalletModal('google')}
              >
                <span style={{ color: '#4285F4', fontWeight: 900 }}>G</span>
                <span>Google Wallet</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal Educativo y de Integración con Billeteras Oficiales */}
      {isWalletModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsWalletModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>
                  {walletModalType === 'google' ? '💳' : ''}
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                    {walletModalType === 'google' ? 'Google Wallet (Smart Tap)' : 'Apple Wallet (Apple VAS)'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Pase de Billetera Digital Criptográfico
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsWalletModalOpen(false)}>×</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '0.8rem',
                  lineHeight: 1.4,
                  color: 'var(--text-muted)'
                }}
              >
                En una instalación corporativa oficial, el pase se vincula directamente con el chip Secure Element de tu celular ({walletModalType === 'google' ? 'Google Play Services' : 'Secure Enclave'}).
              </div>

              <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>ID DE BOLETO: <strong style={{ color: 'var(--tiktok-cyan)' }}>{ticketId}</strong></div>
                <div>TOKEN ACTIVO: <strong style={{ fontFamily: 'monospace' }}>{totp?.authMac || 'ROTARY-TOKEN'}</strong></div>
                <div>PROTOCOLO NFC: <strong>{walletModalType === 'google' ? 'Google Smart Tap (AES-128)' : 'Apple VAS (ISO 14443-4)'}</strong></div>
              </div>

              <button
                className="btn-primary"
                onClick={() => {
                  onShowToast(`✅ Vinculación con ${walletModalType === 'google' ? 'Google Wallet' : 'Apple Wallet'} autorizada.`);
                  setIsWalletModalOpen(false);
                }}
                style={{ padding: '12px', fontSize: '0.85rem' }}
              >
                Confirmar y Agregar a mi Billetera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
