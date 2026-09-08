import React from 'react';
import { ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isDesktop?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab, isDesktop = false }) => {
  const isLargeScreen = isDesktop || (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(min-width: 900px)').matches);

  const baseNavItems: { id: ActiveTab; label: string; icon: string; badge?: string }[] = [
    { id: 'ticket', label: 'Boleto', icon: '🎫' },
    { id: 'turnstile', label: 'Torniquete', icon: '🛡️' },
    { id: 'boardroom', label: 'Directorio', icon: '📊', badge: 'ROI' },
    { id: 'transfer', label: 'Transferir', icon: '🔄' },
    { id: 'audit', label: 'Auditoría', icon: '📜' }
  ];

  const navItems = isLargeScreen
    ? [...baseNavItems, { id: 'dual' as ActiveTab, label: 'Vista Dual', icon: '🖥️' }]
    : baseNavItems;

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${item.id === 'dual' ? 'nav-item-dual' : ''} ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(item.id)}
            aria-label={item.label}
          >
            <span className="nav-icon" style={{ position: 'relative' }}>
              {item.icon}
              {item.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    background: 'var(--tiktok-red)',
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '1px 4px',
                    borderRadius: '8px'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </span>
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
