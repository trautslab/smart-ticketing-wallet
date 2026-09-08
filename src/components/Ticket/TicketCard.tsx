import React, { useState } from 'react';
import { Ticket, TechMode } from '../../types';
import { useDynamicQr } from '../../hooks/useDynamicQr';
import { DynamicQrDisplay } from './DynamicQrDisplay';
import { ContactlessNfcCard } from './ContactlessNfcCard';
import { GeofenceControlBar } from './GeofenceControlBar';

interface TicketCardProps {
  ticket: Ticket;
  onSimulateTurnstileScan?: (payload: string, mode: TechMode) => void;
  onShowToast: (msg: string) => void;
  showSimulateScan?: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onSimulateTurnstileScan,
  onShowToast,
  showSimulateScan = false
}) => {
  const searchParams = new URLSearchParams(window.location.search);
  const initialInside = searchParams.get('geofence') !== 'outside';
  const [techMode, setTechMode] = useState<TechMode>('QR');
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean>(initialInside);

  const { totp, remainingSeconds, progressPercent } = useDynamicQr({
    ticketId: ticket.id,
    seedHex: ticket.seedHex,
    stepSeconds: 15
  });

  const handleSimulateScan = () => {
    if (techMode === 'QR' && totp?.rawPayload) {
      onSimulateTurnstileScan?.(totp.rawPayload, 'QR');
    } else {
      onSimulateTurnstileScan?.(`NFC:STK:${ticket.id}:${Date.now()}`, 'NFC');
    }
  };

  return (
    <div className="ticket-view-container">
      {/* Tech Switcher Tab Bar */}
      <div className="tech-mode-switcher">
        <button
          className={`tech-btn ${techMode === 'QR' ? 'active' : ''}`}
          onClick={() => setTechMode('QR')}
          id="btn-mode-qr"
        >
          <span>📱</span>
          <span>QR Dinámico</span>
        </button>
        <button
          className={`tech-btn ${techMode === 'NFC' ? 'active' : ''}`}
          onClick={() => setTechMode('NFC')}
          id="btn-mode-nfc"
        >
          <span>💳</span>
          <span>Contactless NFC</span>
        </button>
      </div>

      {/* Geofence Perimeter Bar connected to real state */}
      <GeofenceControlBar
        venueName={ticket.venue}
        isInside={isInsideGeofence}
        onGeofenceToggle={setIsInsideGeofence}
      />

      {/* Main Ticket Glass Card */}
      <div className="ticket-card-wrapper">
        {/* Ticket Header Banner */}
        <div className="ticket-hero-header">
          <div className="ticket-badge-tag">ENTRADA GENERAL VIP</div>
          <h2 className="ticket-event-name">{ticket.eventName}</h2>
          <div className="ticket-event-meta">
            <span>📅 {new Date(ticket.eventDate).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <span>•</span>
            <span>🏟️ {ticket.venue}</span>
          </div>
        </div>

        {/* Seat / Gate Grid */}
        <div className="ticket-seat-grid">
          <div className="seat-grid-item">
            <span className="grid-label">PUERTA</span>
            <span className="grid-value">SUR (GATE B)</span>
          </div>
          <div className="seat-grid-item">
            <span className="grid-label">SECCIÓN</span>
            <span className="grid-value">{ticket.section}</span>
          </div>
          <div className="seat-grid-item">
            <span className="grid-label">ASIENTO</span>
            <span className="grid-value">{ticket.seat}</span>
          </div>
        </div>

        {/* Perforated Separator Line */}
        <div className="ticket-cut-divider">
          <div className="notch notch-left" />
          <div className="dashed-line" />
          <div className="notch notch-right" />
        </div>

        {/* Dynamic Presentation (QR or NFC) */}
        <div className="ticket-presentation-area">
          {techMode === 'QR' ? (
            <DynamicQrDisplay
              totp={totp}
              remainingSeconds={remainingSeconds}
              progressPercent={progressPercent}
              ticketId={ticket.id}
              onShowToast={onShowToast}
              isInsideGeofence={isInsideGeofence}
            />
          ) : (
            <ContactlessNfcCard
              ticket={ticket}
              onSimulateTap={handleSimulateScan}
            />
          )}
        </div>

        {/* Quick Test Scan Action (Only shown in dual desktop mode) */}
        {showSimulateScan && (
          <div className="quick-scan-container">
            <button
              id="btn-quick-turnstile-test"
              className="btn-quick-scan"
              onClick={handleSimulateScan}
              title="Envía instantáneamente este token al torniquete para verificar acceso"
            >
              <span>🚀</span>
              <span>Escanear en Torniquete (&lt;42ms)</span>
            </button>
          </div>
        )}

        {/* Security & Ownership Footer (Consumer-friendly) */}
        <div className="ticket-security-footer">
          <div className="owner-info">
            <span className="owner-title">TITULAR NOMINATIVO</span>
            <span className="owner-name">{ticket.ownerName}</span>
            <span className="owner-id">ID: {ticket.currentOwnerId} • DNI: 74829104</span>
          </div>
          <div className="crypto-badge" title="Protección criptográfica anti-clonación activa">
            <span className="shield-icon">🛡️</span>
            <span>ENTRADA OFICIAL SEGURA</span>
          </div>
        </div>
      </div>
    </div>
  );
};
