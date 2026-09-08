import React, { useState, useRef, useEffect } from 'react';
import { useTurnstileGate } from '../../hooks/useTurnstileGate';
import { useMeshNetwork } from '../../hooks/useMeshNetwork';
import { StadiumMeshVisualizer } from './StadiumMeshVisualizer';
import { Ticket } from '../../types';

interface TurnstileStationProps {
  ticket: Ticket;
  turnstile: ReturnType<typeof useTurnstileGate>;
  mesh: ReturnType<typeof useMeshNetwork>;
  onShowToast: (msg: string) => void;
}

export const TurnstileStation: React.FC<TurnstileStationProps> = ({
  ticket,
  turnstile,
  mesh,
  onShowToast
}) => {
  const {
    selectedGate,
    setSelectedGate,
    lastScanResult,
    stats,
    processScan
  } = turnstile;

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Toggle Camera
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          setIsCameraActive(true);
          onShowToast('📹 Cámara activada para escaneo de torniquete.');
        } else {
          onShowToast('⚠️ Cámara no disponible en este contexto. Usa el simulador rápido.');
        }
      } catch {
        onShowToast('⚠️ Permiso de cámara denegado o no disponible en HTTP local.');
      }
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleValidScan = () => {
    const validCounter = Math.floor(Date.now() / 15000);
    const validHex = validCounter.toString(16).padStart(16, '0');
    const authMac = ticket.seedHex.substring(0, 16);
    const payload = `STK:v1:${ticket.id}:${validHex}:${authMac}`;
    processScan(payload, 'QR');
  };

  const handleExpiredScan = () => {
    // Counter from 2 minutes ago (8 periods expired)
    const oldCounter = Math.floor(Date.now() / 15000) - 8;
    const oldHex = oldCounter.toString(16).padStart(16, '0');
    const authMac = ticket.seedHex.substring(0, 16);
    const payload = `STK:v1:${ticket.id}:${oldHex}:${authMac}`;
    processScan(payload, 'QR');
    onShowToast('🚫 Captura vieja rechazada: la ventana temporal expiró hace más de 15s.');
  };

  const handleTamperedScan = () => {
    const counterHex = Math.floor(Date.now() / 15000).toString(16).padStart(16, '0');
    const fakeMac = 'deadbeefbadf00d1';
    const payload = `STK:v1:${ticket.id}:${counterHex}:${fakeMac}`;
    processScan(payload, 'QR');
    onShowToast('⛔ Código alterado rechazado: firma HMAC inválida.');
  };

  const handleReplayAttackSim = () => {
    // Force double entry test
    // First admit at Gate A
    const validCounter = Math.floor(Date.now() / 15000);
    const validHex = validCounter.toString(16).padStart(16, '0');
    const authMac = ticket.seedHex.substring(0, 16);
    const payload = `STK:v1:${ticket.id}:${validHex}:${authMac}`;

    // Mark as used in Gate A
    mesh.broadcastTicketUsed('GATE-A', ticket.id);

    // Now try to scan at Gate B
    setSelectedGate('GATE-B');
    processScan(payload, 'QR');
    onShowToast('🚨 Intento de doble entrada detectado en Gate B. El boleto ya fue consumido en Gate A.');
  };

  return (
    <div className="turnstile-station-container">
      {/* Gate Selector */}
      <div className="station-header-bar">
        <div className="station-gate-selector">
          <label htmlFor="gate-select">ESTACIÓN:</label>
          <select
            id="gate-select"
            value={selectedGate}
            onChange={(e) => setSelectedGate(e.target.value)}
            className="gate-dropdown"
          >
            <option value="GATE-A">Puerta A (Norte) — Molinete #1</option>
            <option value="GATE-B">Puerta B (Sur) — Molinete #2</option>
            <option value="GATE-C">Puerta C (VIP) — Molinete #3</option>
          </select>
        </div>

        <div className="station-offline-badge">
          <span className="live-dot" />
          <span>MOTOR OFFLINE ACTIVO (&lt;42ms)</span>
        </div>
      </div>

      {/* Viewfinder Area */}
      <div className="viewfinder-card">
        <div className="scanner-viewfinder">
          {isCameraActive ? (
            <video ref={videoRef} className="camera-feed" autoPlay playsInline muted />
          ) : (
            <div className="viewfinder-placeholder">
              <div className="laser-line" />
              <div className="target-corners">
                <div className="corner top-left" />
                <div className="corner top-right" />
                <div className="corner bottom-left" />
                <div className="corner bottom-right" />
              </div>
              <div className="viewfinder-prompt">
                <span className="viewfinder-icon">📷</span>
                <span>Apunta la cámara del operador hacia el QR dinámico</span>
              </div>
            </div>
          )}
        </div>

        <div className="viewfinder-controls">
          <button
            onClick={toggleCamera}
            className={`btn-camera-toggle ${isCameraActive ? 'active' : ''}`}
            id="btn-toggle-camera"
          >
            <span>{isCameraActive ? '⏹️ Detener Cámara' : '📹 Activar Cámara WebRTC'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Scan Result Banner */}
      {lastScanResult && (
        <div className={`scan-result-banner ${lastScanResult.status.toLowerCase()}`}>
          <div className="result-main-line">
            <span className="result-icon">
              {lastScanResult.status === 'ACCESS_GRANTED' ? '✅' : '⛔'}
            </span>
            <span className="result-text">
              {lastScanResult.status === 'ACCESS_GRANTED' ? 'ACCESO AUTORIZADO' : 'ACCESO DENEGADO'}
            </span>
            <span className="result-latency">{lastScanResult.latencyMs}ms</span>
          </div>
          <div className="result-reason">{lastScanResult.reason}</div>
          <div className="result-meta">
            <span>BOLETO: <strong>{lastScanResult.ticketId}</strong></span>
            <span>•</span>
            <span>PUERTA: <strong>{lastScanResult.gateId}</strong></span>
          </div>
        </div>
      )}

      {/* Simulator Test Buttons for Edge Cases */}
      <div className="turnstile-sim-actions">
        <div className="actions-label">SIMULADOR DE CASOS DE SEGURIDAD (PRUEBAS RÁPIDAS):</div>
        <div className="sim-buttons-grid">
          <button
            id="btn-sim-valid"
            className="btn-sim-action btn-valid"
            onClick={handleValidScan}
          >
            <span>✅</span>
            <span>Escanear QR Válido</span>
          </button>

          <button
            id="btn-sim-expired"
            className="btn-sim-action btn-expired"
            onClick={handleExpiredScan}
          >
            <span>⏱️</span>
            <span>Escanear Captura Vieja (&gt;15s)</span>
          </button>

          <button
            id="btn-sim-tampered"
            className="btn-sim-action btn-tampered"
            onClick={handleTamperedScan}
          >
            <span>⚠️</span>
            <span>Escanear QR con Firma Alterada</span>
          </button>
        </div>
      </div>

      {/* Turnstile Performance Stats */}
      <div className="turnstile-stats-grid">
        <div className="stat-card">
          <span className="stat-label">TOTAL ESCANEOS</span>
          <span className="stat-value">{stats.totalScans}</span>
        </div>
        <div className="stat-card success">
          <span className="stat-label">INGRESOS EXITOSOS</span>
          <span className="stat-value">{stats.grantedCount}</span>
        </div>
        <div className="stat-card danger">
          <span className="stat-label">RECHAZOS FRAUDE</span>
          <span className="stat-value">{stats.rejectedCount}</span>
        </div>
        <div className="stat-card cyan">
          <span className="stat-label">LATENCIA MEDIA</span>
          <span className="stat-value">{stats.averageLatencyMs}ms</span>
        </div>
      </div>

      {/* Mesh Network Visualizer */}
      <StadiumMeshVisualizer
        mesh={mesh}
        onTriggerReplaySimulation={handleReplayAttackSim}
      />
    </div>
  );
};
