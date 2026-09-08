import { ServerStorage, computeSubtleAuthMac, ServerAuditEntry } from './_storage';

export async function onRequestPost(context: { request: Request }): Promise<Response> {
  const start = performance.now();
  const now = Date.now();
  const isoTimestamp = new Date(now).toISOString();

  try {
    const body = await context.request.json() as {
      payload?: string;
      gateId?: string;
      operatorId?: string;
      mode?: 'QR' | 'NFC' | 'AUDIO';
    };

    const rawPayload = body.payload?.trim() ?? '';
    const gateId = body.gateId ?? 'GATE-A';
    const operatorId = body.operatorId ?? 'OP-DEFAULT';
    const mode = body.mode ?? 'QR';

    if (!rawPayload) {
      return new Response(
        JSON.stringify({
          valid: false,
          status: 'INVALID_MAC',
          reason: 'Payload vacío o inexistente',
          latencyMs: Number((performance.now() - start).toFixed(2))
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Parse STK:v1:ticketId:counterHex:authMac format
    const parts = rawPayload.split(':');
    if (parts.length < 5 || parts[0] !== 'STK' || parts[1] !== 'v1') {
      const elapsed = performance.now() - start;
      const result = {
        valid: false,
        status: 'INVALID_MAC' as const,
        reason: 'Formato QR no reconocido (debe comenzar con STK:v1)',
        ticketId: 'UNKNOWN',
        gateId,
        latencyMs: Number(elapsed.toFixed(2))
      };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const ticketId = parts[2];
    const counterHex = parts[3];
    const candidateMac = parts[4];
    const claimedCounter = parseInt(counterHex, 16);

    // 2. Fetch ticket from server vault
    const ticket = ServerStorage.getTicket(ticketId);
    if (!ticket) {
      const elapsed = performance.now() - start;
      const audit: ServerAuditEntry = {
        id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: isoTimestamp,
        ticketId,
        gateId,
        operatorId,
        status: 'NOT_FOUND',
        mode,
        latencyMs: Number(elapsed.toFixed(2)),
        reason: 'Boleto inexistente en el registro maestro'
      };
      ServerStorage.recordAudit(audit);

      return new Response(
        JSON.stringify({
          valid: false,
          status: 'NOT_FOUND',
          reason: `Boleto ${ticketId} no encontrado en la base de datos maestra`,
          ticketId,
          gateId,
          latencyMs: Number(elapsed.toFixed(2))
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check if ticket has already been consumed (Double Entry / Replay)
    const admittedInfo = ServerStorage.isTicketAdmitted(ticketId);
    if (admittedInfo) {
      const elapsed = performance.now() - start;
      const audit: ServerAuditEntry = {
        id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: isoTimestamp,
        ticketId,
        gateId,
        operatorId,
        status: 'REPLAY_ATTACK_DETECTED',
        mode,
        latencyMs: Number(elapsed.toFixed(2)),
        reason: `Doble entrada rechazada: Boleto ya ingresó en ${admittedInfo.gateId}`
      };
      ServerStorage.recordAudit(audit);

      return new Response(
        JSON.stringify({
          valid: false,
          status: 'REPLAY_ATTACK_DETECTED',
          reason: `🚨 Boleto ya ingresado en ${admittedInfo.gateId} (${admittedInfo.timestamp}). Intento de reingreso fraudulento.`,
          ticketId,
          gateId,
          attendeeName: ticket.currentOwner,
          tier: ticket.tier,
          latencyMs: Number(elapsed.toFixed(2))
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Check if this specific counter was already presented
    if (ServerStorage.isCounterUsed(ticketId, claimedCounter)) {
      const elapsed = performance.now() - start;
      const audit: ServerAuditEntry = {
        id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: isoTimestamp,
        ticketId,
        gateId,
        operatorId,
        status: 'REPLAY_ATTACK_DETECTED',
        mode,
        latencyMs: Number(elapsed.toFixed(2)),
        reason: 'Captura de pantalla repetida o token duplicado'
      };
      ServerStorage.recordAudit(audit);

      return new Response(
        JSON.stringify({
          valid: false,
          status: 'REPLAY_ATTACK_DETECTED',
          reason: '🚨 Captura de pantalla repetida: este código QR específico ya fue escaneado.',
          ticketId,
          gateId,
          latencyMs: Number(elapsed.toFixed(2))
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Time Window Drift Tolerance (RFC 6238, 15s step, +/- 1 drift window)
    const currentCounter = Math.floor(now / 15000);
    const drift = claimedCounter - currentCounter;

    if (drift < -1) {
      const elapsed = performance.now() - start;
      const audit: ServerAuditEntry = {
        id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: isoTimestamp,
        ticketId,
        gateId,
        operatorId,
        status: 'EXPIRED_WINDOW',
        mode,
        latencyMs: Number(elapsed.toFixed(2)),
        reason: `Código QR expirado (hace ${Math.abs(drift) * 15}s)`
      };
      ServerStorage.recordAudit(audit);

      return new Response(
        JSON.stringify({
          valid: false,
          status: 'EXPIRED_WINDOW',
          reason: `⏱️ Código QR expirado: La ventana de 15 segundos finalizó hace ${Math.abs(drift) * 15}s. Pida al usuario mostrar el código actual.`,
          ticketId,
          gateId,
          latencyMs: Number(elapsed.toFixed(2))
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (drift > 1) {
      const elapsed = performance.now() - start;
      return new Response(
        JSON.stringify({
          valid: false,
          status: 'INVALID_MAC',
          reason: 'Reloj del dispositivo adelantado al tiempo del servidor.',
          ticketId,
          gateId,
          latencyMs: Number(elapsed.toFixed(2))
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Cryptographic HMAC-SHA256 Verification in Cloudflare Edge Server
    const expectedMac = await computeSubtleAuthMac(ticket.secretSeedHex, claimedCounter);
    if (expectedMac.toLowerCase() !== candidateMac.toLowerCase()) {
      const elapsed = performance.now() - start;
      const audit: ServerAuditEntry = {
        id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: isoTimestamp,
        ticketId,
        gateId,
        operatorId,
        status: 'INVALID_MAC',
        mode,
        latencyMs: Number(elapsed.toFixed(2)),
        reason: 'Firma criptográfica HMAC adulterada'
      };
      ServerStorage.recordAudit(audit);

      return new Response(
        JSON.stringify({
          valid: false,
          status: 'INVALID_MAC',
          reason: '⛔ Código QR falsificado o firma criptográfica alterada.',
          ticketId,
          gateId,
          latencyMs: Number(elapsed.toFixed(2))
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 7. Validation Success: Admit Ticket
    ServerStorage.markCounterUsed(ticketId, claimedCounter);
    ServerStorage.admitTicket(ticketId, gateId, isoTimestamp);

    const elapsed = performance.now() - start;
    const latencyMs = Number(elapsed.toFixed(2));

    const audit: ServerAuditEntry = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: isoTimestamp,
      ticketId,
      gateId,
      operatorId,
      status: 'ACCESS_GRANTED',
      mode,
      latencyMs
    };
    ServerStorage.recordAudit(audit);

    return new Response(
      JSON.stringify({
        valid: true,
        status: 'ACCESS_GRANTED',
        ticketId: ticket.id,
        attendeeName: ticket.currentOwner,
        dni: ticket.ownerDni,
        tier: ticket.tier,
        section: ticket.section,
        seat: ticket.seat,
        gateId,
        timestamp: isoTimestamp,
        latencyMs
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        valid: false,
        status: 'SERVER_ERROR',
        reason: err.message,
        latencyMs: Number((performance.now() - start).toFixed(2))
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
