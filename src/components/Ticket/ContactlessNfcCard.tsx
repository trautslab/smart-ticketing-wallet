import React, { useState } from 'react';
import { Ticket } from '../../types';
import { useAudioSynthesizer } from '../../hooks/useAudioSynthesizer';

interface ContactlessNfcCardProps {
  ticket: Ticket;
  onSimulateTap: () => void;
}

export const ContactlessNfcCard: React.FC<ContactlessNfcCardProps> = ({
  ticket,
  onSimulateTap
}) => {
  const [isTapping, setIsTapping] = useState<boolean>(false);
  const { playNfcTapChime } = useAudioSynthesizer();

  const handleTapAction = () => {
    setIsTapping(true);
    playNfcTapChime();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40, 60, 40]);
    }
    setTimeout(() => {
      setIsTapping(false);
      onSimulateTap();
    }, 450);
  };

  return (
    <div className={`nfc-card-container ${isTapping ? 'nfc-tapping' : ''}`}>
      <div className="nfc-pass-card">
        <div className="nfc-card-top">
          <div className="nfc-icon-wave">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 0 1 10 10" />
              <path d="M12 6a6 6 0 0 1 6 6" />
              <path d="M12 10a2 2 0 0 1 2 2" />
            </svg>
          </div>
          <span className="nfc-badge">HCE VAS 2.0 PROTOCOL</span>
        </div>

        <div className="nfc-card-body">
          <div className="nfc-event-title">{ticket.eventName}</div>
          <div className="nfc-seat-details">
            SECTOR: <strong>{ticket.section}</strong> • ASIENTO: <strong>{ticket.seat}</strong>
          </div>
          <div className="nfc-card-footer">
            <span className="nfc-holder">{ticket.ownerName}</span>
            <span className="nfc-status-pill">DESBLOQUEADO POR GEOFENCE</span>
          </div>
        </div>
      </div>

      <div className="nfc-instructions">
        <div className="nfc-radar-pulse">
          <div className="pulse-ring" />
          <div className="pulse-dot" />
        </div>
        <p>Acerca la parte superior de tu móvil al lector NFC del molinete</p>
      </div>

      <button
        id="btn-simulate-nfc-tap"
        className="btn-tap-nfc"
        onClick={handleTapAction}
        disabled={isTapping}
      >
        <span>⚡</span>
        <span>{isTapping ? 'Transmitiendo Criptograma...' : 'Simular Toque NFC al Molinete'}</span>
      </button>
    </div>
  );
};
