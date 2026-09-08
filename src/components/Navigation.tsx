import React from 'react';
import { ActiveTab, UserAppRole, StaffUser } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  userRole: UserAppRole;
  staffUser: StaffUser | null;
  onOpenStaffModal: () => void;
  onLogoutStaff: () => void;
  isDesktop?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  staffUser,
  onOpenStaffModal,
  onLogoutStaff,
  isDesktop = false
}) => {
  const isLargeScreen = isDesktop || (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(min-width: 900px)').matches);

  // Define navigation items depending on current Role (RBAC/ABAC)
  let navItems: { id: ActiveTab | 'staff_login' | 'logout'; label: string; icon: string; badge?: string }[] = [];

  if (userRole === 'attendee') {
    // Pure Attendee Wallet Navigation
    navItems = [
      { id: 'ticket', label: 'Mi Entrada', icon: '🎫' },
      { id: 'transfer', label: 'Transferir', icon: '🔄' },
      { id: 'staff_login', label: 'Staff', icon: '🔒' }
    ];

    if (isLargeScreen) {
      navItems.push({ id: 'dual', label: 'Vista Dual', icon: '🖥️' });
    }
  } else if (userRole === 'operator') {
    // Turnstile Gate Operator Navigation
    navItems = [
      { id: 'turnstile', label: 'Torniquete', icon: '🛡️' },
      { id: 'audit', label: 'Auditoría', icon: '📜' },
      { id: 'logout', label: 'Salir', icon: '🚪' }
    ];
  } else if (userRole === 'auditor') {
    // Security Auditor Navigation
    navItems = [
      { id: 'audit', label: 'Auditoría', icon: '📜' },
      { id: 'turnstile', label: 'Estaciones', icon: '🛡️' },
      { id: 'logout', label: 'Salir', icon: '🚪' }
    ];
  } else if (userRole === 'boardroom') {
    // Boardroom Executive Navigation
    navItems = [
      { id: 'boardroom', label: 'Directorio', icon: '📊', badge: 'ROI' },
      { id: 'audit', label: 'Auditoría', icon: '📜' },
      { id: 'logout', label: 'Salir', icon: '🚪' }
    ];
  }

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const isActive = activeTab === item.id;
        const handleClick = () => {
          if (item.id === 'staff_login') {
            onOpenStaffModal();
          } else if (item.id === 'logout') {
            onLogoutStaff();
          } else {
            onSelectTab(item.id as ActiveTab);
          }
        };

        return (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${item.id === 'dual' ? 'nav-item-dual' : ''} ${isActive ? 'active' : ''}`}
            onClick={handleClick}
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
                    color: 'var(--tiktok-white)',
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
