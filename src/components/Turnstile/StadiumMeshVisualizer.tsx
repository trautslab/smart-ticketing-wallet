import React from 'react';
import { useMeshNetwork } from '../../hooks/useMeshNetwork';

interface StadiumMeshVisualizerProps {
  mesh: ReturnType<typeof useMeshNetwork>;
  onTriggerReplaySimulation: () => void;
}

export const StadiumMeshVisualizer: React.FC<StadiumMeshVisualizerProps> = ({
  mesh,
  onTriggerReplaySimulation
}) => {
  const { gates, meshEvents } = mesh;

  return (
    <div className="mesh-visualizer-container">
      <div className="mesh-header-row">
        <div>
          <div className="mesh-title">RED MESH DE TORNIQUETES (OFFLINE P2P)</div>
          <div className="mesh-subtitle">Sincronización Perimetral Sub-50ms sin Conexión a Internet</div>
        </div>
        <button
          onClick={onTriggerReplaySimulation}
          className="btn-replay-sim"
          title="Prueba cómo la red mesh detiene el fraude de dos personas entrando al mismo tiempo"
        >
          <span>🚨</span>
          <span>Simular Intento Doble Entrada (Clon)</span>
        </button>
      </div>

      {/* 3-Gate Node Topology */}
      <div className="mesh-gates-grid">
        {gates.map(gate => (
          <div key={gate.id} className={`mesh-gate-card ${gate.status.toLowerCase()}`}>
            <div className="gate-card-header">
              <span className="gate-dot" />
              <span className="gate-name">{gate.name}</span>
            </div>
            <div className="gate-card-body">
              <div className="gate-metric">
                <span className="metric-lbl">IP MESH:</span>
                <span className="metric-val">{gate.ip}</span>
              </div>
              <div className="gate-metric">
                <span className="metric-lbl">ACCESOS:</span>
                <span className="metric-val highlight">{gate.scansProcessed}</span>
              </div>
              <div className="gate-metric">
                <span className="metric-lbl">LATENCIA P2P:</span>
                <span className="metric-val">{gate.lastSyncMs}ms</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Real-time Mesh Gossip Feed */}
      <div className="mesh-events-stream">
        <div className="stream-header">
          <span>REGISTRO DE PAQUETES GOSSIP P2P EN TIEMPO REAL</span>
          <span className="stream-count">{meshEvents.length} eventos</span>
        </div>
        <div className="stream-list">
          {meshEvents.length === 0 ? (
            <div className="empty-stream">Esperando validaciones para transmitir paquetes gossip...</div>
          ) : (
            meshEvents.slice(0, 4).map(evt => (
              <div key={evt.id} className={`stream-item ${evt.type === 'REPLAY_ALERT' ? 'alert' : ''}`}>
                <span className="evt-type-badge">
                  {evt.type === 'REPLAY_ALERT' ? '⛔ REPLAY DETECTADO' : '⚡ GOSSIP BROADCAST'}
                </span>
                <span className="evt-nodes">{evt.sourceGate} ➔ {evt.targetGate}</span>
                <span className="evt-ticket">{evt.ticketId}</span>
                <span className="evt-latency">{evt.latencyMs}ms</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
