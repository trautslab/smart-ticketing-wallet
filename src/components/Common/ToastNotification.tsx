import React from 'react';

interface ToastNotificationProps {
  message: string | null;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="toast-notification-banner" onClick={onClose}>
      <div className="toast-content">
        <span className="toast-icon">✨</span>
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close-btn" onClick={onClose} aria-label="Cerrar">
        ✕
      </button>
    </div>
  );
};
