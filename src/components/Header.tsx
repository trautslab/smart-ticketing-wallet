import React from 'react';
import { OrganizerBrand, UserAppRole, StaffUser } from '../types';

interface HeaderProps {
  brand: OrganizerBrand;
  customBrandName: string;
  isOffline: boolean;
  isDesktop?: boolean;
  userRole?: UserAppRole;
  staffUser?: StaffUser | null;
  onLogoutStaff?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  brand,
  customBrandName,
  isOffline,
  isDesktop = false,
  userRole = 'attendee',
  staffUser = null,
  onLogoutStaff
}) => {
  const getBrandDisplayName = () => {
    switch (brand) {
      case 'tiketya':
        return 'TiketYA!';
      case 'rock':
        return 'Rock Festival';
      case 'custom':
        return customBrandName || 'Organizador';
    }
  };

  const isStaffMode = userRole !== 'attendee';

  return (
    <header>
      <div className="brand-header">
        <div className="brand-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
              fill="url(#brandGrad)"
              stroke="#010101"
              strokeWidth="1.5"
            />
            <defs>
              <linearGradient id="brandGrad" x1="3" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#25F4EE" />
                <stop offset="1" stopColor="#FE2C55" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <div className="brand-title">
            {getBrandDisplayName()}{' '}
            <span style={{ fontSize: '0.65rem', color: isStaffMode ? 'var(--tiktok-magenta)' : 'var(--tiktok-cyan)' }}>
              {isStaffMode ? 'STAFF' : 'PRO'}
            </span>
          </div>
          <div className="brand-tagline">
            {isStaffMode ? 'CONTROL DE ACCESO & INTRANET' : 'SMART TICKETING WALLET'}
          </div>
        </div>
      </div>

      <div className="header-badges">
        {isStaffMode ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              className="offline-pill"
              style={{
                background: 'rgba(254, 44, 85, 0.15)',
                borderColor: 'rgba(254, 44, 85, 0.4)',
                color: 'var(--tiktok-magenta)'
              }}
              title={staffUser?.title}
            >
              <span className="live-dot" style={{ background: 'var(--tiktok-magenta)' }} />
              <span>
                {userRole === 'operator' ? 'OPERADOR' : userRole === 'auditor' ? 'AUDITOR' : 'DIRECTORIO'}
              </span>
            </div>

            {onLogoutStaff && (
              <button
                onClick={onLogoutStaff}
                className="brand-badge-btn"
                title="Salir a billetera de espectador"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>🚪</span>
                {isDesktop && <span className="brand-badge-label">Salir</span>}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="offline-pill" title="Protocolo 100% Offline RFC 6238">
              <span className="live-dot" />
              <span>{isOffline ? 'MODO AVIÓN' : '100% OFFLINE'}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
