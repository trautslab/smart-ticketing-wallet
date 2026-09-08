import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, OrganizerBrand, TechMode, Ticket, UserAppRole, StaffUser } from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { TicketCard } from './components/Ticket/TicketCard';
import { TurnstileStation } from './components/Turnstile/TurnstileStation';
import { BoardroomPitch } from './components/Boardroom/BoardroomPitch';
import { P2PTransferForm } from './components/Transfer/P2PTransferForm';
import { AuditLedgerTable } from './components/Audit/AuditLedgerTable';
import { BrandingModal } from './components/Common/BrandingModal';
import { StaffLoginModal } from './components/Auth/StaffLoginModal';
import { ToastNotification } from './components/Common/ToastNotification';
import { useMeshNetwork } from './hooks/useMeshNetwork';
import { useTurnstileGate } from './hooks/useTurnstileGate';

const INITIAL_TICKET: Ticket = {
  id: 'TKT-LIMA-2026-VIP',
  eventId: 'EVT-BADBUNNY-2026',
  eventName: 'Bad Bunny - World Hottest Tour',
  eventDate: '2026-11-15T20:00:00Z',
  eventGatesOpenTime: '2026-11-15T16:00:00Z',
  venue: 'Estadio Nacional, Lima',
  section: 'OCCIDENTE VIP',
  seat: 'Fila 4, Asiento 18',
  currentOwnerId: 'USR-882194',
  ownerName: 'Carlos Mendoza',
  ownerEmail: 'carlos.mendoza@gmail.com',
  faceValue: 180.0,
  currency: 'USD',
  status: 'ACTIVE',
  seedHex: 'a3f8190c42eb517d983421bb0145ef8891c3d4a2b109e87f6543210fedcba987',
  transferCount: 0,
  maxTransfers: 2,
  createdAt: '2026-09-01T12:00:00Z',
  updatedAt: '2026-09-01T12:00:00Z'
};

export const App: React.FC = () => {
  // Role-Based State Management (RBAC/ABAC)
  const [userRole, setUserRole] = useState<UserAppRole>('attendee');
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('ticket');
  const [ticket, setTicket] = useState<Ticket>(INITIAL_TICKET);
  const [brand, setBrand] = useState<OrganizerBrand>('tiketya');
  const [customBrandName, setCustomBrandName] = useState<string>('TiketYA!');
  const [isBrandModalOpen, setIsBrandModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [isDesktop, setIsDesktop] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 900 : false
  );

  // Parse URL query parameter on initial load (e.g. ?role=operator)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role')?.toLowerCase();

    if (roleParam === 'operator' || roleParam === 'turnstile') {
      const opUser: StaffUser = {
        id: 'staff-op-url',
        name: 'Juan Pérez (Torniquete)',
        role: 'operator',
        title: 'Operador de Control de Accesos',
        badgeId: 'BADGE-OP-741',
        permissions: ['scan_qr', 'scan_nfc', 'switch_gate', 'view_station_stats'],
        assignedGate: 'GATE-A',
        token: 'URL_OP_TOKEN'
      };
      setStaffUser(opUser);
      setUserRole('operator');
      setActiveTab('turnstile');
    } else if (roleParam === 'auditor') {
      const audUser: StaffUser = {
        id: 'staff-aud-url',
        name: 'Elena Rostova (CISO)',
        role: 'auditor',
        title: 'Auditora de Seguridad Criptográfica',
        badgeId: 'BADGE-SEC-009',
        permissions: ['view_audit_ledger', 'reconcile_mesh', 'export_ledger'],
        token: 'URL_AUD_TOKEN'
      };
      setStaffUser(audUser);
      setUserRole('auditor');
      setActiveTab('audit');
    } else if (roleParam === 'boardroom' || roleParam === 'directorio') {
      const dirUser: StaffUser = {
        id: 'staff-dir-url',
        name: 'Directorio Ejecutivo TrautsLab',
        role: 'boardroom',
        title: 'Directorio & Inversionistas',
        badgeId: 'BADGE-DIR-001',
        permissions: ['view_boardroom_roi', 'view_fraud_metrics'],
        token: 'URL_DIR_TOKEN'
      };
      setStaffUser(dirUser);
      setUserRole('boardroom');
      setActiveTab('boardroom');
    }
  }, []);

  // Fetch ticket metadata from server API if online
  useEffect(() => {
    const fetchServerTicket = async () => {
      try {
        const res = await fetch('/api/ticket?id=TKT-LIMA-2026-VIP');
        if (res.ok) {
          const data = await res.json() as any;
          if (data && data.id) {
            setTicket(prev => ({
              ...prev,
              id: data.id,
              eventName: data.eventName || prev.eventName,
              venue: data.venue || prev.venue,
              section: data.section || prev.section,
              seat: data.seat || prev.seat,
              ownerName: data.currentOwner || prev.ownerName,
              seedHex: data.clientSeedHex || prev.seedHex,
              faceValue: data.faceValueUsd || prev.faceValue
            }));
          }
        }
      } catch {
        // Continue with initial ticket if offline
      }
    };
    fetchServerTicket();
  }, []);

  // Responsive window resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Handle simulation of scan from ticket to turnstile (dual desktop mode)
  const handleSimulateTurnstileScan = (payload: string, mode: TechMode) => {
    const result = turnstile.processScan(payload, mode, ticket.seedHex);
    if (result.status === 'ACCESS_GRANTED') {
      showToast('✅ Molinete Desbloqueado: Acceso Concedido en <42ms.');
    } else {
      showToast(`⛔ Molinete Bloqueado: ${result.reason}`);
    }
  };

  // Staff Login Handler
  const handleStaffLogin = (user: StaffUser) => {
    setStaffUser(user);
    setUserRole(user.role);
    if (user.role === 'operator') {
      setActiveTab('turnstile');
    } else if (user.role === 'auditor') {
      setActiveTab('audit');
    } else if (user.role === 'boardroom') {
      setActiveTab('boardroom');
    }
  };

  // Staff Logout Handler
  const handleStaffLogout = () => {
    setStaffUser(null);
    setUserRole('attendee');
    setActiveTab('ticket');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('role');
      window.history.replaceState({}, '', url.pathname);
    }
  };

  // Handle P2P Transfer execution
  const handleTransferComplete = (recipientName: string, recipientEmail: string, price: number) => {
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
      {/* Header with Organizer Branding and Role / Offline status */}
      <Header
        brand={brand}
        customBrandName={customBrandName}
        onOpenBrandModal={() => setIsBrandModalOpen(true)}
        isOffline={isOffline}
        isDesktop={isDesktop}
        userRole={userRole}
        staffUser={staffUser}
        onOpenStaffModal={() => setIsStaffModalOpen(true)}
        onLogoutStaff={handleStaffLogout}
      />

      {/* Main Content View Switcher */}
      <main className="main-content-area">
        {activeTab === 'dual' && isDesktop ? (
          <div className="desktop-dual-split">
            <div className="dual-column left-pane">
              <div className="column-badge">📱 DISPOSITIVO 1: ESPECTADOR / CLIENTE</div>
              <TicketCard
                ticket={ticket}
                onSimulateTurnstileScan={handleSimulateTurnstileScan}
                onShowToast={showToast}
                showSimulateScan={true}
              />
            </div>
            <div className="dual-column right-pane">
              <div className="column-badge">🛡️ DISPOSITIVO 2: ESCÁNER DE TORNIQUETE</div>
              <TurnstileStation
                ticket={ticket}
                turnstile={turnstile}
                mesh={mesh}
                onShowToast={showToast}
                operatorBadge={staffUser?.badgeId}
              />
            </div>
          </div>
        ) : activeTab === 'ticket' ? (
          <>
            <TicketCard
              ticket={ticket}
              onShowToast={showToast}
              showSimulateScan={false}
            />
          </>
        ) : activeTab === 'turnstile' ? (
          <TurnstileStation
            ticket={ticket}
            turnstile={turnstile}
            mesh={mesh}
            onShowToast={showToast}
            operatorBadge={staffUser?.badgeId}
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

      {/* Navigation Bar (Role-Aware Bottom Bar) */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userRole={userRole}
        staffUser={staffUser}
        onOpenStaffModal={() => setIsStaffModalOpen(true)}
        onLogoutStaff={handleStaffLogout}
        isDesktop={isDesktop}
      />

      {/* Organizer Custom Branding Modal */}
      <BrandingModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        currentBrand={brand}
        currentCustomName={customBrandName}
        onSaveBrand={(newBrand, newName) => {
          setBrand(newBrand);
          setCustomBrandName(newName);
          showToast(`🎨 Marca actualizada: ${newBrand === 'custom' ? newName : newBrand.toUpperCase()}`);
        }}
      />

      {/* Staff Intranet & RBAC Login Modal */}
      <StaffLoginModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        currentUserRole={userRole}
        staffUser={staffUser}
        onLogin={handleStaffLogin}
        onLogout={handleStaffLogout}
        onShowToast={showToast}
      />

      {/* Toast Feedback Notification Pill */}
      <ToastNotification
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
};
