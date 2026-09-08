import { performance } from 'node:perf_hooks';
import { TicketVault } from './ticket-vault.js';
import { TotpEngine } from './totp-engine.js';
import { QrPayloadEncoder } from './qr-payload.js';
import { ScanResult, ValidationStatus } from '../types/index.js';

export interface TurnstileValidatorOptions {
  gateId: string;
  allowedDriftWindows?: number; // default: 1 (+/- 15s)
  timeStepSeconds?: number; // default: 15s
}

export class TurnstileValidator {
  public readonly gateId: string;
  public readonly allowedDriftWindows: number;
  public readonly timeStepSeconds: number;
  private vault: TicketVault;
  private scanAuditLog: ScanResult[] = [];

  constructor(vault: TicketVault, options: TurnstileValidatorOptions) {
    this.vault = vault;
    this.gateId = options.gateId;
    this.allowedDriftWindows = options.allowedDriftWindows ?? 1;
    this.timeStepSeconds = options.timeStepSeconds ?? TotpEngine.DEFAULT_TIME_STEP_SECONDS;
  }

  /**
   * Evaluates a raw QR scan string 100% offline with zero cloud requests.
   * Target latency: < 80 milliseconds.
   */
  public scan(rawPayload: string, currentTimestampMs: number = Date.now()): ScanResult {
    const start = performance.now();
    const isoTimestamp = new Date(currentTimestampMs).toISOString();

    let decoded: { ticketId: string; counter: number; counterHex: string; authMac: string };
    try {
      decoded = QrPayloadEncoder.decode(rawPayload);
    } catch (err: any) {
      const elapsed = performance.now() - start;
      const result: ScanResult = {
        status: 'INVALID_MAC',
        ticketId: 'UNKNOWN',
        timestamp: isoTimestamp,
        latencyMs: Number(elapsed.toFixed(2)),
        gateId: this.gateId,
        reason: `Formato de QR corrupto o ilegible: ${err.message}`
      };
      this.scanAuditLog.push(result);
      return result;
    }

    const { ticketId, counter, authMac } = decoded;
    const ticket = this.vault.getTicket(ticketId);

    // 1. Check ticket existence in offline database
    if (!ticket) {
      const elapsed = performance.now() - start;
      const result: ScanResult = {
        status: 'TICKET_NOT_FOUND',
        ticketId,
        timestamp: isoTimestamp,
        latencyMs: Number(elapsed.toFixed(2)),
        gateId: this.gateId,
        reason: `Boleto ${ticketId} no existe en la base de datos perimetral del estadio.`
      };
      this.scanAuditLog.push(result);
      return result;
    }

    // 2. Check ticket lifecycle status
    if (ticket.status === 'REVOKED') {
      const elapsed = performance.now() - start;
      const result: ScanResult = {
        status: 'TICKET_REVOKED',
        ticketId,
        timestamp: isoTimestamp,
        latencyMs: Number(elapsed.toFixed(2)),
        gateId: this.gateId,
        ticket,
        reason: `Acceso denegado: El boleto fue revocado (transferido a otro titular o cancelado).`
      };
      this.scanAuditLog.push(result);
      return result;
    }

    if (ticket.status === 'LOCKED') {
      const elapsed = performance.now() - start;
      const result: ScanResult = {
        status: 'TICKET_REVOKED',
        ticketId,
        timestamp: isoTimestamp,
        latencyMs: Number(elapsed.toFixed(2)),
        gateId: this.gateId,
        ticket,
        reason: `Acceso denegado: Boleto bloqueado administrativamente.`
      };
      this.scanAuditLog.push(result);
      return result;
    }

    if (ticket.status === 'USED') {
      const elapsed = performance.now() - start;
      const result: ScanResult = {
        status: 'ALREADY_USED',
        ticketId,
        timestamp: isoTimestamp,
        latencyMs: Number(elapsed.toFixed(2)),
        gateId: this.gateId,
        ticket,
        reason: `Alerta de seguridad (Replay Attack): El boleto ya fue usado previamente a las ${ticket.usedAt} en la puerta ${ticket.usedGateId || 'DESCONOCIDA'}.`
      };
      this.scanAuditLog.push(result);
      return result;
    }

    // 3. Cryptographic HMAC validation with clock-drift tolerance
    const verification = TotpEngine.verifyToken(
      ticket.seedHex,
      authMac,
      counter,
      this.allowedDriftWindows,
      currentTimestampMs,
      this.timeStepSeconds
    );

    const elapsed = performance.now() - start;

    if (!verification.valid) {
      const currentCounter = TotpEngine.getCounter(currentTimestampMs, this.timeStepSeconds);
      const isExpired = counter < currentCounter - this.allowedDriftWindows;

      const status: ValidationStatus = isExpired ? 'EXPIRED_CODE' : 'INVALID_MAC';
      const reason = isExpired
        ? `Código QR expirado (paso presentado: ${counter}, actual: ${currentCounter}). Por favor use la app móvil en tiempo real.`
        : `Firma criptográfica inválida. Posible código adulterado o captura de pantalla de otra cuenta.`;

      const result: ScanResult = {
        status,
        ticketId,
        timestamp: isoTimestamp,
        latencyMs: Number(elapsed.toFixed(2)),
        gateId: this.gateId,
        ticket,
        reason
      };
      this.scanAuditLog.push(result);
      return result;
    }

    // 4. Access Granted: Transition to USED immediately
    this.vault.updateStatus(ticketId, 'USED', {
      usedGateId: this.gateId,
      usedAt: isoTimestamp
    });

    const updatedTicket = this.vault.getTicket(ticketId);

    const result: ScanResult = {
      status: 'ACCESS_GRANTED',
      ticketId,
      timestamp: isoTimestamp,
      latencyMs: Number(elapsed.toFixed(2)),
      gateId: this.gateId,
      ticket: updatedTicket,
      reason: `Acceso autorizado para ${ticket.ownerName} (${ticket.section} - ${ticket.seat}).`,
      matchedWindow: verification.matchedWindow
    };

    this.scanAuditLog.push(result);
    return result;
  }

  public getAuditLog(): ScanResult[] {
    return [...this.scanAuditLog];
  }

  public clearAuditLog(): void {
    this.scanAuditLog = [];
  }
}
