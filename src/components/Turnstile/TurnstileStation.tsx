import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTurnstileGate } from '../../hooks/useTurnstileGate';
import { useMeshNetwork } from '../../hooks/useMeshNetwork';
import { StadiumMeshVisualizer } from './StadiumMeshVisualizer';
import { Ticket, ScanResult } from '../../types';
import { OpticalQrScanner } from '../../core/scanner/OpticalQrScanner';
import { TurnstileFeedback } from '../../utils/audioFeedback';

interface TurnstileStationProps {
  ticket: Ticket;
  turnstile: ReturnType<typeof useTurnstileGate>;
  mesh: ReturnType<typeof useMeshNetwork>;
  onShowToast: (msg: string) => void;
  operatorBadge?: string;
}

export const TurnstileStation: React.FC<TurnstileStationProps> = ({
  ticket,
  turnstile,
  mesh,
  onShowToast,
  operatorBadge = 'BADGE-OP-741'
}) => {
  const {
    selectedGate,
    setSelectedGate,
    lastScanResult,
    stats,
    processScan
  } = turnstile;

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isScanningLock, setIsScanningLock] = useState<boolean>(false);
  const [serverScanResult, setServerScanResult] = useState<ScanResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<OpticalQrScanner | null>(null);
  const lastScannedPayloadRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  /**
   * Process incoming QR code payload from camera or simulation
   */
  const handleQrDetected = useCallback(async (payload: string) => {
    const now = Date.now();
    // Debounce identical scans within 2 seconds
    if (payload === lastScannedPayloadRef.current && now - lastScannedTimeRef.current < 2000) {
      return;
    }

    lastScannedPayloadRef.current = payload;
    lastScannedTimeRef.current = now;
    setIsScanningLock(true);

    try {
      // 1. First attempt authoritative Cloudflare Pages serverless edge validation (/api/verify)
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload,
          gateId: selectedGate,
          operatorId: operatorBadge,
          mode: 'QR'
        })
      });

      if (res.ok) {
        const data = await res.json() as any;

        const scanResult: ScanResult = {
          status: data.status,
          ticketId: data.ticketId || 'STK-QR',
          timestamp: data.timestamp || new Date().toISOString(),
          latencyMs: data.latencyMs || 24,
          gateId: data.gateId || selectedGate,
          reason: data.reason || (data.valid ? `Acceso permitido a ${data.attendeeName || 'Espectador'} (${data.tier || 'VIP'})` : 'Validación fallida')
        };

        setServerScanResult(scanResult);

        if (data.valid && data.status === 'ACCESS_GRANTED') {
          TurnstileFeedback.playSuccess();
          mesh.broadcastTicketUsed(selectedGate, data.ticketId);
          onShowToast(`✅ ACCESO PERMITIDO: ${data.attendeeName || data.ticketId} (<${data.latencyMs}ms)`);
        } else if (data.status === 'REPLAY_ATTACK_DETECTED') {
          TurnstileFeedback.playError();
          onShowToast(`🚨 REPLAY DETECTADO: ${data.reason}`);
        } else if (data.status === 'EXPIRED_WINDOW') {
          TurnstileFeedback.playError();
          onShowToast(`⏱️ EXPIRADO: ${data.reason}`);
        } else {
          TurnstileFeedback.playError();
          onShowToast(`⛔ ACCESO DENEGADO: ${data.reason}`);
        }

        // Also update local hook stats
        processScan(payload, 'QR');
      } else {
        throw new Error('API offline fallback');
      }
    } catch {
      // 2. Offline Fallback: Local Turnstile Validator RFC 6238
      const localResult = processScan(payload, 'QR');
      setServerScanResult(localResult);

      if (localResult.status === 'ACCESS_GRANTED') {
        TurnstileFeedback.playSuccess();
        onShowToast(`✅ ACCESO PERMITIDO (OFFLINE LOCAL): <${localResult.latencyMs}ms`);
      } else {
        TurnstileFeedback.playError();
        onShowToast(`⛔ ${localResult.reason}`);
      }
    } finally {
      setTimeout(() => {
        setIsScanningLock(false);
      }, 1200);
    }
  }, [selectedGate, operatorBadge, mesh, processScan, onShowToast]);

  // Toggle Camera
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current = null;
      }
      setIsCameraActive(false);
      setIsTorchOn(false);
    } else {
      if (!videoRef.current) return;

      try {
        const scanner = new OpticalQrScanner({
          videoElement: videoRef.current,
          onScan: handleQrDetected,
          onError: (err) => {
            onShowToast(`⚠️ Error de cámara: ${err.message}`);
          }
        });

        await scanner.start();
        scannerRef.current = scanner;
        setIsCameraActive(true);
        onShowToast('📹 Escáner óptico WebRTC activado. Enfoque la pantalla del otro celular.');
      } catch (err: any) {
        onShowToast(`⚠️ No se pudo acceder a la cámara: ${err.message}`);
      }
    }
  };

  const handleToggleTorch = async () => {
    if (scannerRef.current) {
      const newState = await scannerRef.current.toggleTorch();
      setIsTorchOn(newState);
      onShowToast(newState ? '🔦 Linterna activada' : '🔦 Linterna apagada');
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current = null;
      }
    };
  }, []);

  const handleValidScan = () => {
    const validCounter = Math.floor(Date.now() / 15000);
    const validHex = validCounter.toString(16).padStart(16, '0');
    const authMac = ticket.seedHex.substring(0, 16);
    const payload = `STK:v1:${ticket.id}:${validHex}:${authMac}`;
    handleQrDetected(payload);
  };

  const handleExpiredScan = () => {
    const oldCounter = Math.floor(Date.now() / 15000) - 8;
    const oldHex = oldCounter.toString(16).padStart(16, '0');
    const authMac = ticket.seedHex.substring(0, 16);
    const payload = `STK:v1:${ticket.id}:${oldHex}:${authMac}`;
    handleQrDetected(payload);
  };

  const handleTamperedScan = () => {
    const counterHex = Math.floor(Date.now() / 15000).toString(16).padStart(16, '0');
    const fakeMac = 'deadbeefbadf00d1';
    const payload = `STK:v1:${ticket.id}:${counterHex}:${fakeMac}`;
    handleQrDetected(payload);
  };

  const handleReplayAttackSim = () => {
    const validCounter = Math.floor(Date.now() / 15000);
    const validHex = validCounter.toString(16).padStart(16, '0');
    const authMac = ticket.seedHex.substring(0, 16);
    const payload = `STK:v1:${ticket.id}:${validHex}:${authMac}`;

    // Mark as used in Gate A
    mesh.broadcastTicketUsed('GATE-A', ticket.id);

    // Scan at Gate B
    setSelectedGate('GATE-B');
    handleQrDetected(payload);
  };

  const activeResult = serverScanResult || lastScanResult;

  return (
    <div className="turnstile-station-container">
      {/* Gate Selector & Operator Banner */}
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

        <div className="station-offline-badge" title="Validación Cloudflare Edge + Fallback Local">
          <span className="live-dot" />
          <span>EDGE SERVERLESS &lt;42ms</span>
        </div>
      </div>

      {/* Optical Camera Viewfinder Area */}
      <div className="viewfinder-card">
        <div className={`scanner-viewfinder ${isScanningLock ? 'scan-locked' : ''}`}>
          {/* Always have the video tag in the DOM so refs don't disconnect */}
          <video
            ref={videoRef}
            className={`camera-feed ${isCameraActive ? 'visible' : 'hidden'}`}
            autoPlay
            playsInline
            muted
          />

          {!isCameraActive && (
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
                <span>Apunta la cámara del operador hacia la pantalla del otro celular</span>
              </div>
            </div>
          )}

          {isCameraActive && (
            <div className="viewfinder-active-hud">
              <div className="laser-sweep-line" />
              <div className="target-reticle">
                <div className="corner top-left" />
                <div className="corner top-right" />
                <div className="corner bottom-left" />
                <div className="corner bottom-right" />
              </div>
              <div className="hud-badge">
                <span>🔴 ESCANEANDO QR EN VIVO...</span>
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
            <span>{isCameraActive ? '⏹️ Detener Cámara' : '📹 Activar Escáner de Cámara'}</span>
          </button>

          {isCameraActive && (
            <button
              onClick={handleToggleTorch}
              className={`btn-torch-toggle ${isTorchOn ? 'active' : ''}`}
              title="Encender/apagar flash"
            >
              <span>{isTorchOn ? '🔦 Flash ON' : '💡 Flash'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time Scan Result Banner */}
      {activeResult && (
        <div className={`scan-result-banner ${activeResult.status.toLowerCase()}`}>
          <div className="result-main-line">
            <span className="result-icon">
              {activeResult.status === 'ACCESS_GRANTED' ? '✅' : '⛔'}
            </span>
            <span className="result-text">
              {activeResult.status === 'ACCESS_GRANTED' ? 'ACCESO AUTORIZADO' : 'ACCESO DENEGADO'}
            </span>
            <span className="result-latency">{activeResult.latencyMs}ms</span>
          </div>
          <div className="result-reason">{activeResult.reason}</div>
          <div className="result-meta">
            <span>BOLETO: <strong>{activeResult.ticketId}</strong></span>
            <span>•</span>
            <span>PUERTA: <strong>{activeResult.gateId}</strong></span>
          </div>
        </div>
      )}

      {/* Simulator Test Buttons for Edge Cases */}
      <div className="turnstile-sim-actions">
        <div className="actions-label">SIMULADOR DE CASOS DE SEGURIDAD (PRUEBA RÁPIDA 1-CLICK):</div>
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
            <span>Escanear QR Firma Falsa</span>
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
