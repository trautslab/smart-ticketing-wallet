import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, OrganizerBrand, TechMode, Ticket } from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { TicketCard } from './components/Ticket/TicketCard';
import { TurnstileStation } from './components/Turnstile/TurnstileStation';
import { BoardroomPitch } from './components/Boardroom/BoardroomPitch';
import { P2PTransferForm } from './components/Transfer/P2PTransferForm';
import { AuditLedgerTable } from './components/Audit/AuditLedgerTable';
import { BrandingModal } from './components/Common/BrandingModal';
import { ToastNotification } from './components/Common/ToastNotification';
import { useMeshNetwork } from './hooks/useMeshNetwork';
import { useTurnstileGate } from './hooks/useTurnstileGate';

const INITIAL_TICKET: Ticket = {
  id: 'TCK-2026-ROCK-001',
  eventId: 'EVT-GNROSES-2026',
  eventName: "Guns N' Roses: World Stadium Tour 2026",
  eventDate: '2026-10-24T20:00:00Z',
  eventGatesOpenTime: '2026-10-24T16:00:00Z',
  venue: 'Estadio Nacional',
  section: 'Occidente VIP Gold',
  seat: 'Fila 4, Butaca 18',
  currentOwnerId: 'USR-882194',
  ownerName: 'Alejandro Ramos',
  ownerEmail: 'alejandro.ramos@trautslab.com',
  faceValue: 120.0,
  currency: 'USD',
  status: 'ACTIVE',
  seedHex: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  transferCount: 0,
  maxTransfers: 2,
  createdAt: '2026-09-01T12:00:00Z',
  updatedAt: '2026-09-01T12:00:00Z'
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ticket');
  const [ticket, setTicket] = useState<Ticket>(INITIAL_TICKET);
  const [brand, setBrand] = useState<OrganizerBrand>('tiketya');
  const [customBrandName, setCustomBrandName] = useState<string>('TiketYA!');
  const [isBrandModalOpen, setIsBrandModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  // Core Hooks for Turnstile and Mesh Networking
  const mesh = useMeshNetwork();
  const turnstile = useTurnstileGate(mesh);

  // Monitor online/offline network events for PWA
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast('🌐 Conexión de red restablecida.');
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast('✈️ Modo sin conexión (Offline) activado. Criptografía local activa.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 4500);
  }, []);

  // Handle simulation of scan from ticket to turnstile
  const handleSimulateTurnstileScan = (payload: string, mode: TechMode) => {
    const result = turnstile.processScan(payload, mode, ticket.seedHex);
    if (result.status === 'ACCESS_GRANTED') {
      showToast('✅ Molinete Desbloqueado: Acceso Concedido en <42ms.');
    } else {
      showToast(`⛔ Molinete Bloqueado: ${result.reason}`);
    }
  };

  // Handle P2P Transfer execution
  const handleTransferComplete = (recipientName: string, recipientEmail: string, price: number) => {
    // Generate new random cryptographic seed (Atomic Re-Keying)
    const newSeed = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    setTicket(prev => ({
      ...prev,
      ownerName: recipientName,
      ownerEmail: recipientEmail,
      currentOwnerId: `USR-${Math.floor(100000 + Math.random() * 900000)}`,
      seedHex: newSeed,
      transferCount: prev.transferCount + 1,
      updatedAt: new Date().toISOString()
    }));

    showToast(`🔄 Entrada transferida a ${recipientName} por $${price}. Clave criptográfica re-generada.`);
  };

  return (
    <div className="app-layout">
      {/* Header with Organizer Branding and Offline status */}
      <Header
        brand={brand}
        customBrandName={customBrandName}
        onOpenBrandModal={() => setIsBrandModalOpen(true)}
        isOffline={isOffline}
      />

      {/* Main Content View Switcher */}
      <main className="main-content-area">
        {activeTab === 'dual' ? (
          <div className="desktop-dual-split">
            <div className="dual-column left-pane">
              <div className="column-badge">📱 DISPOSITIVO DEL ASISTENTE</div>
              <TicketCard
                ticket={ticket}
                onSimulateTurnstileScan={handleSimulateTurnstileScan}
                onShowToast={showToast}
              />
            </div>
            <div className="dual-column right-pane">
              <div className="column-badge">🛡️ ESTACIÓN DE MOLINETES (OFFLINE MESH)</div>
              <TurnstileStation
                ticket={ticket}
                turnstile={turnstile}
                mesh={mesh}
                onShowToast={showToast}
              />
            </div>
          </div>
        ) : activeTab === 'ticket' ? (
          <TicketCard
            ticket={ticket}
            onSimulateTurnstileScan={handleSimulateTurnstileScan}
            onShowToast={showToast}
          />
        ) : activeTab === 'turnstile' ? (
          <TurnstileStation
            ticket={ticket}
            turnstile={turnstile}
            mesh={mesh}
            onShowToast={showToast}
          />
        ) : activeTab === 'boardroom' ? (
          <BoardroomPitch />
        ) : activeTab === 'transfer' ? (
          <P2PTransferForm
            ticket={ticket}
            onTransferComplete={handleTransferComplete}
            onShowToast={showToast}
          />
        ) : (
          <AuditLedgerTable
            scanHistory={turnstile.scanHistory}
            onClearHistory={turnstile.clearHistory}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Navigation Bar (Mobile bottom bar / Desktop pills) */}
      <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Organizer Custom Branding Modal */}
      <BrandingModal
        isOpen={isBrandModalOpen}
        currentBrand={brand}
        currentCustomName={customBrandName}
        onSaveBrand={(newBrand, customName) => {
          setBrand(newBrand);
          setCustomBrandName(customName);
          showToast('🎨 Identidad de marca actualizada.');
        }}
        onClose={() => setIsBrandModalOpen(false)}
      />

      {/* Floating Feedback Notification */}
      <ToastNotification
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
};
