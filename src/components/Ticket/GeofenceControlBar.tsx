import React, { useState } from 'react';

interface GeofenceControlBarProps {
  venueName: string;
  isInside: boolean;
  onGeofenceToggle: (isInside: boolean) => void;
}

export const GeofenceControlBar: React.FC<GeofenceControlBarProps> = ({
  venueName,
  isInside,
  onGeofenceToggle
}) => {
  return (
    <div className="geofence-hud-bar">
      <div className="geofence-info">
        <span className={`geofence-indicator-dot ${isInside ? 'active' : 'inactive'}`} />
        <div>
          <div className="geofence-title">
            {venueName} (Perímetro 500m)
          </div>
          <div className="geofence-status">
            {isInside ? '📍 DENTRO DEL PERÍMETRO' : '🚫 FUERA DEL PERÍMETRO'}
          </div>
        </div>
      </div>

      <button
        onClick={() => onGeofenceToggle(!isInside)}
        className="btn-toggle-geofence"
        title="Simular entrar o salir del perímetro del estadio"
        id="btn-geofence-toggle"
      >
        {isInside ? 'Simular Fuera' : 'Simular Dentro'}
      </button>
    </div>
  );
};
