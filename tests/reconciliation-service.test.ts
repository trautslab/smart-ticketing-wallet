import test from 'node:test';
import assert from 'node:assert/strict';
import { TicketVault } from '../src/core/ticket-vault.js';
import { ReconciliationService, OfflineCheckinBatch } from '../src/core/reconciliation-service.js';

test('ReconciliationService: reconciles offline batches from multiple gates without conflicts', () => {
  const vault = TicketVault.createDemoVault();
  const service = new ReconciliationService(vault);

  const batchGateNorth: OfflineCheckinBatch = {
    gateId: 'GATE-NORTH-01',
    batchId: 'BATCH-N-001',
    submittedAt: new Date().toISOString(),
    scans: [
      { ticketId: 'TKT-ROCK-101', timestamp: '2026-09-08T02:00:00.000Z', latencyMs: 1.2, matchedWindow: 0 },
      { ticketId: 'TKT-ROCK-102', timestamp: '2026-09-08T02:00:10.000Z', latencyMs: 1.5, matchedWindow: 0 }
    ]
  };

  const batchGateSouth: OfflineCheckinBatch = {
    gateId: 'GATE-SOUTH-02',
    batchId: 'BATCH-S-001',
    submittedAt: new Date().toISOString(),
    scans: [
      { ticketId: 'TKT-ROCK-103', timestamp: '2026-09-08T02:00:05.000Z', latencyMs: 0.9, matchedWindow: 0 }
    ]
  };

  const report = service.reconcileBatches([batchGateNorth, batchGateSouth]);

  assert.equal(report.batchCount, 2);
  assert.equal(report.totalScansProcessed, 3);
  assert.equal(report.uniqueTicketsAdmitted, 3);
  assert.equal(report.conflictsDetected, 0);

  // Check vault states updated
  assert.equal(vault.getTicket('TKT-ROCK-101')?.status, 'USED');
  assert.equal(vault.getTicket('TKT-ROCK-101')?.usedGateId, 'GATE-NORTH-01');
  assert.equal(vault.getTicket('TKT-ROCK-103')?.usedGateId, 'GATE-SOUTH-02');
});

test('ReconciliationService: detects and flags duplicate offline conflict between gates', () => {
  const vault = TicketVault.createDemoVault();
  const service = new ReconciliationService(vault);

  // Ticket 101 was scanned at Gate North at 02:00:00, and at Gate South at 02:00:02 (2 seconds later)
  const batchNorth: OfflineCheckinBatch = {
    gateId: 'GATE-NORTH-01',
    batchId: 'BATCH-N-002',
    submittedAt: new Date().toISOString(),
    scans: [
      { ticketId: 'TKT-ROCK-101', timestamp: '2026-09-08T02:00:00.000Z', latencyMs: 1.2 }
    ]
  };

  const batchSouth: OfflineCheckinBatch = {
    gateId: 'GATE-SOUTH-02',
    batchId: 'BATCH-S-002',
    submittedAt: new Date().toISOString(),
    scans: [
      { ticketId: 'TKT-ROCK-101', timestamp: '2026-09-08T02:00:02.000Z', latencyMs: 1.4 }
    ]
  };

  const report = service.reconcileBatches([batchNorth, batchSouth]);

  assert.equal(report.totalScansProcessed, 2);
  assert.equal(report.uniqueTicketsAdmitted, 1);
  assert.equal(report.conflictsDetected, 1);
  assert.equal(report.conflicts[0].ticketId, 'TKT-ROCK-101');
  assert.equal(report.conflicts[0].firstGateId, 'GATE-NORTH-01');
  assert.equal(report.conflicts[0].conflictingGateId, 'GATE-SOUTH-02');
  assert.equal(report.conflicts[0].deltaMs, 2000);
});
