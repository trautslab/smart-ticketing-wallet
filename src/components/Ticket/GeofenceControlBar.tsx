import React, { useState } from 'react';

interface GeofenceControlBarProps {
  venueName: string;
  onGeofenceToggle?: (isInside: boolean) => void;
}

export const GeofenceControlBar: React.FC<GeofenceControlBarProps> = ({
  venueName,
  onGeofenceToggle
}) => {
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean>(true);

  const toggleGeofence = () => {
    const newState = !isInsideGeofence;
    setIsInsideGeofence(newState);
    if (onGeofenceToggle) {
      onGeofenceToggle(newState);
    }
  };

  return (
    <div className="geofence-hud-bar">
      <div className="geofence-info">
        <span className={`geofence-indicator-dot ${isInsideGeofence ? 'active' : 'inactive'}`} />
        <div>
          <div className="geofence-title">
            {venueName} (Perímetro 500m)
          </div>
          <div className="geofence-status">
            {isInsideGeofence ? '📍 DENTRO DEL PERÍMETRO' : '🚫 FUERA DEL PERÍMETRO'}
          </div>
        </div>
      </div>

      <button
        onClick={toggleGeofence}
        className="btn-toggle-geofence"
        title="Simular entrar o salir del perímetro del estadio"
      >
        {isInsideGeofence ? 'Simular Fuera' : 'Simular Dentro'}
      </button>
    </div>
  );
};
