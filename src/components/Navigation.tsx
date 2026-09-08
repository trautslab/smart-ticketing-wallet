import React from 'react';
import { ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  const navItems: { id: ActiveTab; label: string; icon: string; badge?: string }[] = [
    { id: 'ticket', label: 'Boleto', icon: '🎫' },
    { id: 'turnstile', label: 'Torniquete', icon: '🛡️' },
    { id: 'boardroom', label: 'Junta Directiva', icon: '📊', badge: 'ROI' },
    { id: 'transfer', label: 'Transferir', icon: '🔄' },
    { id: 'audit', label: 'Auditoría', icon: '📜' },
    { id: 'dual', label: 'Vista Dual', icon: '🖥️' }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${isActive ? 'active' : ''}`}
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
