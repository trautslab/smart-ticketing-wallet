import React from 'react';
import { ScanResult } from '../../types';

interface AuditLedgerTableProps {
  scanHistory: ScanResult[];
  onClearHistory: () => void;
  onShowToast: (msg: string) => void;
}

export const AuditLedgerTable: React.FC<AuditLedgerTableProps> = ({
  scanHistory,
  onClearHistory,
  onShowToast
}) => {
  const exportLedgerJson = () => {
    const dataStr = JSON.stringify(scanHistory, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-ledger-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('📜 Registro de auditoría exportado en formato JSON.');
  };

  return (
    <div className="audit-ledger-container">
      <div className="ledger-header">
        <div>
          <h2 className="ledger-title">📜 Registro Criptográfico de Auditoría Perimetral</h2>
          <p className="ledger-sub">
            Trazabilidad inmutable de cada intento de acceso a molinetes y transferencias ejecutadas.
          </p>
        </div>

        <div className="ledger-actions">
          <button
            onClick={exportLedgerJson}
            className="btn-export-ledger"
            disabled={scanHistory.length === 0}
          >
            <span>💾</span>
            <span>Exportar JSON</span>
          </button>
          <button
            onClick={onClearHistory}
            className="btn-clear-ledger"
            disabled={scanHistory.length === 0}
          >
            <span>🗑️</span>
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      <div className="ledger-table-wrapper">
        {scanHistory.length === 0 ? (
          <div className="ledger-empty-state">
            <span>🛡️</span>
            <p>Aún no se han registrado lecturas en los torniquetes. Realiza un escaneo desde la pestaña de Torniquete.</p>
          </div>
        ) : (
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Molinete</th>
                <th>Boleto</th>
                <th>Estado</th>
                <th>Latencia</th>
                <th>Causa / Diagnóstico</th>
              </tr>
            </thead>
            <tbody>
              {scanHistory.map((entry, idx) => (
                <tr key={`${entry.timestamp}-${idx}`} className={entry.status.toLowerCase()}>
                  <td className="cell-time">
                    {new Date(entry.timestamp).toLocaleTimeString('es-ES', { hour12: false })}
                  </td>
                  <td className="cell-gate">{entry.gateId}</td>
                  <td className="cell-ticket">{entry.ticketId}</td>
                  <td>
                    <span className={`status-pill ${entry.status.toLowerCase()}`}>
                      {entry.status === 'ACCESS_GRANTED' ? 'AUTORIZADO' : 'DENEGADO'}
                    </span>
                  </td>
                  <td className="cell-latency">{entry.latencyMs}ms</td>
                  <td className="cell-reason">{entry.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
