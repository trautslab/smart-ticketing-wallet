import { TicketVault } from './ticket-vault.js';
import { ScanResult } from '../types/index.js';

export interface OfflineCheckinBatch {
  gateId: string;
  batchId: string;
  submittedAt: string;
  scans: Array<{
    ticketId: string;
    timestamp: string; // ISO 8601
    latencyMs: number;
    matchedWindow?: number;
  }>;
}

export interface ReconciliationConflict {
  ticketId: string;
  firstGateId: string;
  firstTimestamp: string;
  conflictingGateId: string;
  conflictingTimestamp: string;
  deltaMs: number;
  resolution: 'FIRST_ENTRY_AUTHORIZED_DUPLICATE_FLAGGED';
}

export interface ReconciliationReport {
  batchCount: number;
  totalScansProcessed: number;
  uniqueTicketsAdmitted: number;
  conflictsDetected: number;
  conflicts: ReconciliationConflict[];
  processedAt: string;
}

export class ReconciliationService {
  private centralVault: TicketVault;

  constructor(centralVault: TicketVault) {
    this.centralVault = centralVault;
  }

  /**
   * Reconciles multiple offline batches from stadium turnstiles
   */
  public reconcileBatches(batches: OfflineCheckinBatch[]): ReconciliationReport {
    const allScans: Array<{
      ticketId: string;
      gateId: string;
      timestamp: string;
      timestampMs: number;
    }> = [];

    for (const batch of batches) {
      for (const scan of batch.scans) {
        allScans.push({
          ticketId: scan.ticketId,
          gateId: batch.gateId,
          timestamp: scan.timestamp,
          timestampMs: new Date(scan.timestamp).getTime()
        });
      }
    }

    // Sort chronologically by earliest scan
    allScans.sort((a, b) => a.timestampMs - b.timestampMs);

    const firstSeen = new Map<string, { gateId: string; timestamp: string; timestampMs: number }>();
    const conflicts: ReconciliationConflict[] = [];

    for (const scan of allScans) {
      const existing = firstSeen.get(scan.ticketId);
      if (!existing) {
        // First legitimate scan
        firstSeen.set(scan.ticketId, {
          gateId: scan.gateId,
          timestamp: scan.timestamp,
          timestampMs: scan.timestampMs
        });
        // Update central vault
        this.centralVault.updateStatus(scan.ticketId, 'USED', {
          usedGateId: scan.gateId,
          usedAt: scan.timestamp
        });
      } else {
        // Conflict: duplicate entry occurred offline before sync
        const deltaMs = Math.abs(scan.timestampMs - existing.timestampMs);
        conflicts.push({
          ticketId: scan.ticketId,
          firstGateId: existing.gateId,
          firstTimestamp: existing.timestamp,
          conflictingGateId: scan.gateId,
          conflictingTimestamp: scan.timestamp,
          deltaMs,
          resolution: 'FIRST_ENTRY_AUTHORIZED_DUPLICATE_FLAGGED'
        });
      }
    }

    return {
      batchCount: batches.length,
      totalScansProcessed: allScans.length,
      uniqueTicketsAdmitted: firstSeen.size,
      conflictsDetected: conflicts.length,
      conflicts,
      processedAt: new Date().toISOString()
    };
  }
}
