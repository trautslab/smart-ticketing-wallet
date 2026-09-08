import React from 'react';
import { OrganizerBrand } from '../types';

interface HeaderProps {
  brand: OrganizerBrand;
  customBrandName: string;
  onOpenBrandModal: () => void;
  isOffline: boolean;
  isDesktop?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  brand,
  customBrandName,
  onOpenBrandModal,
  isOffline,
  isDesktop = false
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

  return (
    <header>
      <div className="brand-header" onClick={onOpenBrandModal} style={{ cursor: 'pointer' }} title="Cambiar organizador o logo">
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
            {getBrandDisplayName()} <span style={{ fontSize: '0.65rem', color: 'var(--tiktok-cyan)' }}>PRO</span>
          </div>
          <div className="brand-tagline">SMART TICKETING ENGINE</div>
        </div>
      </div>

      <div className="header-badges">
        <button
          onClick={onOpenBrandModal}
          className="brand-badge-btn"
          title="Cambiar marca / organizador"
        >
          <span>🎨</span>
          {isDesktop && <span className="brand-badge-label">{getBrandDisplayName()}</span>}
        </button>

        <div className="offline-pill" title="Protocolo 100% Offline RFC 6238">
          <span className="live-dot" />
          <span>{isOffline ? 'MODO AVIÓN' : '100% OFFLINE'}</span>
        </div>
      </div>
    </header>
  );
};
