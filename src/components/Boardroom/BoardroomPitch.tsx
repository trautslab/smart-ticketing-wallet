import React from 'react';

export const BoardroomPitch: React.FC = () => {
  return (
    <div className="boardroom-pitch-container">
      {/* Executive Header */}
      <div className="boardroom-hero">
        <div className="boardroom-badge">DOCUMENTO ESTRATÉGICO PARA JUNTA DIRECTIVA</div>
        <h1 className="boardroom-title">
          Smart Ticketing de Próxima Generación: Erradicación del Fraude y Soberanía Operativa
        </h1>
        <p className="boardroom-summary">
          Cómo transformar la boletería tradicional en un ecosistema criptográfico offline de alto rendimiento,
          blindando el 100% del boletaje contra capturas de pantalla, clonación y reventa desleal.
        </p>
      </div>

      {/* 4 Key Business Impact KPI Cards */}
      <div className="boardroom-kpi-grid">
        <div className="kpi-card highlight-cyan">
          <div className="kpi-metric">0%</div>
          <div className="kpi-label">FRAUDE POR CAPTURA</div>
          <p className="kpi-desc">El código TOTP de 15 segundos invalida cualquier captura de pantalla o reenvío por WhatsApp.</p>
        </div>

        <div className="kpi-card highlight-green">
          <div className="kpi-metric">&lt;42ms</div>
          <div className="kpi-label">LATENCIA OFFLINE</div>
          <p className="kpi-desc">Validación descentralizada en el molinete sin depender de redes 4G saturadas ni servidores remotos.</p>
        </div>

        <div className="kpi-card highlight-red">
          <div className="kpi-metric">-94%</div>
          <div className="kpi-label">CONTRACARGOS BANCARIOS</div>
          <p className="kpi-desc">Trazabilidad biométrica y nominativa que elimina reclamos de 'desconocimiento de compra'.</p>
        </div>

        <div className="kpi-card highlight-white">
          <div className="kpi-metric">+18%</div>
          <div className="kpi-label">MONETIZACIÓN SECUNDARIA</div>
          <p className="kpi-desc">Tarifas de transferencia P2P controladas que ingresan directamente a la boletería promotora.</p>
        </div>
      </div>

      {/* Comparative Matrix Table */}
      <div className="boardroom-section">
        <h2 className="section-title">⚖️ Matriz Comparativa Tecnológica vs la Competencia</h2>
        <div className="table-responsive">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Capacidad Operativa</th>
                <th>TiketYA! (Nuestra Solución)</th>
                <th>Quentro</th>
                <th>Ticketmaster SafeTix</th>
                <th>PDF Tradicional / QR Estático</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Protección Anti-Screenshot</strong></td>
                <td className="cell-yes">✅ Dinámico TOTP (15s)</td>
                <td className="cell-yes">✅ Dinámico (15s)</td>
                <td className="cell-yes">✅ Código de barras dinámico</td>
                <td className="cell-no">❌ Nula (Copiable)</td>
              </tr>
              <tr>
                <td><strong>Operatividad 100% Offline</strong></td>
                <td className="cell-yes">✅ Criptografía Local + Mesh</td>
                <td className="cell-yes">✅ App Wallet Offline</td>
                <td className="cell-partial">⚠️ Requiere caché online previo</td>
                <td className="cell-no">❌ Conexión requerida</td>
              </tr>
              <tr>
                <td><strong>Sincronización Perimetral Mesh P2P</strong></td>
                <td className="cell-yes">✅ Gossip Sub-50ms entre molinetes</td>
                <td className="cell-partial">⚠️ Red local propietaria</td>
                <td className="cell-no">❌ Dependiente de nube</td>
                <td className="cell-no">❌ Sin protección de doble entrada</td>
              </tr>
              <tr>
                <td><strong>Apple & Google Wallet Contactless</strong></td>
                <td className="cell-yes">✅ HCE VAS 2.0 + Geofence</td>
                <td className="cell-partial">⚠️ Sólo app propia</td>
                <td className="cell-yes">✅ Apple/Google Wallet</td>
                <td className="cell-no">❌ No soportado</td>
              </tr>
              <tr>
                <td><strong>Gobernanza Anti-Reventa P2P</strong></td>
                <td className="cell-yes">✅ Techo de precio 100% nominal</td>
                <td className="cell-yes">✅ Transferencia nominativa</td>
                <td className="cell-partial">⚠️ Reventa con comisiones abusivas</td>
                <td className="cell-no">❌ Mercado negro incontrolado</td>
              </tr>
              <tr>
                <td><strong>Respaldo Falla de Pantalla</strong></td>
                <td className="cell-yes">✅ Ráfagas Acústicas (18kHz)</td>
                <td className="cell-no">❌ Manual en ventanilla</td>
                <td className="cell-no">❌ Manual en ventanilla</td>
                <td className="cell-no">❌ Manual en ventanilla</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Architecture Principles */}
      <div className="boardroom-section">
        <h2 className="section-title">🏛️ Pilares de Arquitectura e Inversión</h2>
        <div className="pillars-grid">
          <div className="pillar-item">
            <div className="pillar-icon">🔐</div>
            <div className="pillar-title">Cero Vulnerabilidades (0 CVEs)</div>
            <p className="pillar-desc">
              Código auditado de extremo a extremo, implementado en React 19 y Web Cryptography API nativa, eliminando dependencias externas frágiles.
            </p>
          </div>

          <div className="pillar-item">
            <div className="pillar-icon">📲</div>
            <div className="pillar-title">PWA Offline-First y Service Workers</div>
            <p className="pillar-desc">
              Los asistentes pueden activar Modo Avión o quedarse sin datos móviles en medio del estadio; la entrada y la rotación criptográfica funcionan con 100% de autonomía.
            </p>
          </div>

          <div className="pillar-item">
            <div className="pillar-icon">🔄</div>
            <div className="pillar-title">Re-Keying Criptográfico Atómico</div>
            <p className="pillar-desc">
              Cada transferencia genera un nuevo seed criptográfico aleatorio de 256 bits, revocando automáticamente el acceso del dueño anterior.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
