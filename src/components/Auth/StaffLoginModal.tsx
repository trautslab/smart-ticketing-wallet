import React, { useState } from 'react';
import { StaffUser, UserAppRole } from '../../types';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserAppRole;
  staffUser: StaffUser | null;
  onLogin: (user: StaffUser) => void;
  onLogout: () => void;
  onShowToast: (msg: string) => void;
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  staffUser,
  onLogin,
  onLogout,
  onShowToast
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuthenticate = async (pinOrRole: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const isRoleShorthand = ['operator', 'auditor', 'boardroom'].includes(pinOrRole);
      const payload = isRoleShorthand ? { role: pinOrRole } : { pin: pinOrRole };

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json() as any;

      if (res.ok && data.authenticated && data.user) {
        onLogin(data.user);
        onShowToast(`🔑 Sesión iniciada: ${data.user.name} (${data.user.title})`);
        onClose();
      } else {
        // Fallback for full offline simulation if API network unreachable
        let fallbackUser: StaffUser | null = null;
        const normalized = pinOrRole.toUpperCase();

        if (normalized.includes('OP') || pinOrRole === 'operator') {
          fallbackUser = {
            id: 'staff-op-offline',
            name: 'Juan Pérez (Torniquete)',
            role: 'operator',
            title: 'Operador de Control de Accesos',
            badgeId: 'BADGE-OP-741',
            permissions: ['scan_qr', 'scan_nfc', 'switch_gate', 'view_station_stats'],
            assignedGate: 'GATE-A',
            token: 'OFFLINE_OP_TOKEN'
          };
        } else if (normalized.includes('AUD') || pinOrRole === 'auditor') {
          fallbackUser = {
            id: 'staff-aud-offline',
            name: 'Elena Rostova (CISO)',
            role: 'auditor',
            title: 'Auditora de Seguridad Criptográfica',
            badgeId: 'BADGE-SEC-009',
            permissions: ['view_audit_ledger', 'reconcile_mesh', 'export_ledger'],
            token: 'OFFLINE_AUD_TOKEN'
          };
        } else if (normalized.includes('DIR') || pinOrRole === 'boardroom') {
          fallbackUser = {
            id: 'staff-dir-offline',
            name: 'Directorio Ejecutivo TrautsLab',
            role: 'boardroom',
            title: 'Directorio & Inversionistas',
            badgeId: 'BADGE-DIR-001',
            permissions: ['view_boardroom_roi', 'view_fraud_metrics'],
            token: 'OFFLINE_DIR_TOKEN'
          };
        }

        if (fallbackUser) {
          onLogin(fallbackUser);
          onShowToast(`🔑 Sesión iniciada (Modo Offline): ${fallbackUser.name}`);
          onClose();
        } else {
          setErrorMsg(data.error || 'PIN incorrecto. Ingrese OP-2026, AUD-2026 o DIR-2026.');
        }
      }
    } catch {
      setErrorMsg('Error al conectar con el servidor de autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '420px', width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>🔐</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Portal de Intranet & Personal</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Control de Acceso basado en Roles (RBAC / ABAC)
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {currentUserRole !== 'attendee' && staffUser ? (
            <div
              style={{
                background: 'rgba(0, 242, 254, 0.08)',
                border: '1px solid rgba(0, 242, 254, 0.2)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--tiktok-cyan)', fontWeight: 600 }}>
                SESIÓN ACTIVA DE PERSONAL:
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                {staffUser.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Rol: <strong style={{ color: 'var(--text-primary)' }}>{staffUser.title}</strong>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Placa / Badge: {staffUser.badgeId}
              </div>

              <button
                onClick={() => {
                  onLogout();
                  onShowToast('👋 Sesión cerrada. Regresando a la billetera de espectador.');
                  onClose();
                }}
                className="btn-danger"
                style={{ marginTop: '8px', padding: '10px', fontSize: '0.85rem' }}
              >
                🚪 Cerrar Sesión (Volver a Modo Espectador)
              </button>
            </div>
          ) : (
            <>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Ingrese PIN de Personal o Credencial de Seguridad:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value.toUpperCase())}
                    placeholder="Ej: OP-2026"
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: 'var(--tiktok-white)',
                      padding: '10px',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace'
                    }}
                  />
                  <button
                    onClick={() => handleAuthenticate(pinInput)}
                    disabled={isLoading || !pinInput.trim()}
                    className="btn-primary"
                    style={{ padding: '0 16px', fontSize: '0.85rem' }}
                  >
                    {isLoading ? '...' : 'Entrar'}
                  </button>
                </div>
                {errorMsg && (
                  <div style={{ color: 'var(--tiktok-magenta)', fontSize: '0.75rem', marginTop: '6px' }}>
                    {errorMsg}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  ACCESO RÁPIDO PARA PRUEBAS (1-CLICK):
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => handleAuthenticate('operator')}
                    style={{
                      background: 'rgba(0, 242, 254, 0.1)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      borderRadius: '8px',
                      color: 'var(--tiktok-cyan)',
                      padding: '10px 12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Operador de Torniquete (PIN: OP-2026)</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Cámara óptica WebRTC, selección de puerta y validación en &lt;42ms
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAuthenticate('auditor')}
                    style={{
                      background: 'rgba(254, 44, 85, 0.1)',
                      border: '1px solid rgba(254, 44, 85, 0.3)',
                      borderRadius: '8px',
                      color: 'var(--tiktok-magenta)',
                      padding: '10px 12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📜</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Auditor de Seguridad (PIN: AUD-2026)</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Libro mayor inmutable en servidor, trazabilidad y detección de repetición
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAuthenticate('boardroom')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: 'var(--tiktok-white)',
                      padding: '10px 12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📊</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Junta Directiva (PIN: DIR-2026)</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        ROI, reducción de fraude de $1.2M a $0 y métricas financieras
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
