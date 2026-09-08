import { createHash, randomUUID } from 'node:crypto';
import { TicketVault } from './ticket-vault.js';
import { TotpEngine } from './totp-engine.js';
import { Ticket, TransferPolicy, TransferRecord } from '../types/index.js';

export interface TransferRequest {
  ticketId: string;
  fromUserId: string;
  toUserId: string;
  toUserName: string;
  toUserEmail: string;
  transferPrice: number;
}

export interface TransferResult {
  success: boolean;
  record?: TransferRecord;
  updatedTicket?: Ticket;
  error?: string;
}

export class TransferService {
  private vault: TicketVault;
  private policy: TransferPolicy;
  private ledger: TransferRecord[] = [];

  constructor(
    vault: TicketVault,
    policy: TransferPolicy = {
      maxTransfers: 2,
      lockWindowSecondsBeforeGates: 7200, // 2 hours
      enforceMaxFaceValue: true
    }
  ) {
    this.vault = vault;
    this.policy = policy;
  }

  /**
   * Computes a safe 8-character fingerprint of a cryptographic seed for audit trails
   */
  public static seedFingerprint(seedHex: string): string {
    return createHash('sha256').update(seedHex).digest('hex').substring(0, 12);
  }

  /**
   * Executes an atomic cryptographic transfer of a ticket
   */
  public transferTicket(request: TransferRequest, currentTimestampMs: number = Date.now()): TransferResult {
    const ticket = this.vault.getTicket(request.ticketId);

    // 1. Verify existence
    if (!ticket) {
      return { success: false, error: `Boleto ${request.ticketId} no encontrado en la bóveda.` };
    }

    // 2. Verify ownership
    if (ticket.currentOwnerId !== request.fromUserId) {
      return {
        success: false,
        error: `El usuario solicitante (${request.fromUserId}) no es el titular legítimo del boleto (${ticket.currentOwnerId}).`
      };
    }

    // 3. Verify recipient differs from current owner
    if (request.toUserId === request.fromUserId) {
      return { success: false, error: 'No se puede transferir el boleto al mismo titular.' };
    }

    // 4. Verify ticket status
    if (ticket.status !== 'ACTIVE') {
      return {
        success: false,
        error: `El boleto no está activo para transferencias (estado actual: ${ticket.status}).`
      };
    }

    // 5. Enforce anti-scalping: maximum transfer limit
    const allowedMax = ticket.maxTransfers !== undefined ? ticket.maxTransfers : this.policy.maxTransfers;
    if (ticket.transferCount >= allowedMax) {
      return {
        success: false,
        error: `Límite de transferencias alcanzado (${ticket.transferCount}/${allowedMax}). Política anti-reventa activa.`
      };
    }

    // 6. Enforce anti-scalping: price cap (face value enforcement)
    if (this.policy.enforceMaxFaceValue && request.transferPrice > ticket.faceValue) {
      return {
        success: false,
        error: `Violación de política anti-reventa: El precio solicitado (${request.transferPrice} ${ticket.currency}) excede el valor facial oficial (${ticket.faceValue} ${ticket.currency}).`
      };
    }

    // 7. Enforce transfer lock window before event
    const gatesOpenMs = new Date(ticket.eventGatesOpenTime).getTime();
    const lockCutoffMs = gatesOpenMs - this.policy.lockWindowSecondsBeforeGates * 1000;
    if (currentTimestampMs >= lockCutoffMs) {
      const remainingMins = Math.round((gatesOpenMs - currentTimestampMs) / 60000);
      return {
        success: false,
        error: `Ventana de transferencia cerrada. Las transferencias se bloquean ${this.policy.lockWindowSecondsBeforeGates / 3600}h antes de puertas (faltan ${remainingMins} min).`
      };
    }

    // 8. Atomic Re-Keying: Generate brand-new 256-bit seed
    const oldSeedHex = ticket.seedHex;
    const newSeedHex = TotpEngine.generateSeed();

    const previousFingerprint = TransferService.seedFingerprint(oldSeedHex);
    const newFingerprint = TransferService.seedFingerprint(newSeedHex);

    // Update vault
    this.vault.updateSeedAndOwner(
      ticket.id,
      request.toUserId,
      request.toUserName,
      request.toUserEmail,
      newSeedHex
    );

    const updatedTicket = this.vault.getTicket(ticket.id)!;

    const record: TransferRecord = {
      transferId: `TRX-${randomUUID().substring(0, 8).toUpperCase()}`,
      ticketId: ticket.id,
      fromUserId: request.fromUserId,
      toUserId: request.toUserId,
      toUserEmail: request.toUserEmail,
      toUserName: request.toUserName,
      transferPrice: request.transferPrice,
      timestamp: new Date(currentTimestampMs).toISOString(),
      previousSeedFingerprint: previousFingerprint,
      newSeedFingerprint: newFingerprint,
      status: 'COMPLETED'
    };

    this.ledger.push(record);

    return {
      success: true,
      record,
      updatedTicket
    };
  }

  public getLedger(): TransferRecord[] {
    return [...this.ledger];
  }

  public getPolicy(): TransferPolicy {
    return { ...this.policy };
  }
}
