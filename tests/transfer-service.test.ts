import test from 'node:test';
import assert from 'node:assert/strict';
import { TicketVault } from '../src/core/ticket-vault.js';
import { TransferService } from '../src/core/transfer-service.js';

test('TransferService: atomically transfers ticket and re-keys cryptographic seed (Happy Path)', () => {
  const vault = TicketVault.createDemoVault();
  const service = new TransferService(vault, {
    maxTransfers: 2,
    lockWindowSecondsBeforeGates: 7200,
    enforceMaxFaceValue: true
  });

  const originalTicket = vault.getTicket('TKT-ROCK-101')!;
  const originalSeed = originalTicket.seedHex;
  const originalOwner = originalTicket.currentOwnerId;

  // Timestamp safely 5 hours before gates
  const gatesOpenMs = new Date(originalTicket.eventGatesOpenTime).getTime();
  const safeTimeMs = gatesOpenMs - 5 * 3600 * 1000;

  const result = service.transferTicket(
    {
      ticketId: 'TKT-ROCK-101',
      fromUserId: originalOwner,
      toUserId: 'USR-DAVE-99',
      toUserName: 'Dave Grohl',
      toUserEmail: 'dave@example.com',
      transferPrice: 100.0 // Below face value of 120
    },
    safeTimeMs
  );

  assert.equal(result.success, true);
  assert.ok(result.record);
  assert.equal(result.record.ticketId, 'TKT-ROCK-101');
  assert.equal(result.record.fromUserId, originalOwner);
  assert.equal(result.record.toUserId, 'USR-DAVE-99');
  assert.notEqual(result.record.previousSeedFingerprint, result.record.newSeedFingerprint);

  // Verify vault updated
  const updatedTicket = vault.getTicket('TKT-ROCK-101')!;
  assert.equal(updatedTicket.currentOwnerId, 'USR-DAVE-99');
  assert.equal(updatedTicket.ownerName, 'Dave Grohl');
  assert.notEqual(updatedTicket.seedHex, originalSeed);
  assert.equal(updatedTicket.transferCount, 1);
});

test('TransferService: enforces anti-scalping price cap (rejects price > faceValue)', () => {
  const vault = TicketVault.createDemoVault();
  const service = new TransferService(vault, {
    maxTransfers: 2,
    lockWindowSecondsBeforeGates: 7200,
    enforceMaxFaceValue: true
  });

  const ticket = vault.getTicket('TKT-ROCK-101')!; // faceValue is 120.0
  const gatesOpenMs = new Date(ticket.eventGatesOpenTime).getTime();

  const result = service.transferTicket(
    {
      ticketId: 'TKT-ROCK-101',
      fromUserId: ticket.currentOwnerId,
      toUserId: 'USR-SCALPER-01',
      toUserName: 'Scalper Reseller',
      toUserEmail: 'scalper@example.com',
      transferPrice: 350.0 // Unauthorized 300% markup
    },
    gatesOpenMs - 5 * 3600 * 1000
  );

  assert.equal(result.success, false);
  assert.match(result.error || '', /excede el valor facial oficial/i);
});

test('TransferService: enforces maximum transfer limit', () => {
  const vault = TicketVault.createDemoVault();
  const service = new TransferService(vault, {
    maxTransfers: 1, // Limit to 1 transfer
    lockWindowSecondsBeforeGates: 7200,
    enforceMaxFaceValue: true
  });

  const ticket = vault.getTicket('TKT-ROCK-103')!; // maxTransfers is 1
  const gatesOpenMs = new Date(ticket.eventGatesOpenTime).getTime();
  const safeTime = gatesOpenMs - 5 * 3600 * 1000;

  // First transfer: Success
  const t1 = service.transferTicket(
    {
      ticketId: 'TKT-ROCK-103',
      fromUserId: ticket.currentOwnerId,
      toUserId: 'USR-TEMP-1',
      toUserName: 'Temp One',
      toUserEmail: 'temp1@example.com',
      transferPrice: 75.0
    },
    safeTime
  );
  assert.equal(t1.success, true);

  // Second transfer: Fails due to limit
  const t2 = service.transferTicket(
    {
      ticketId: 'TKT-ROCK-103',
      fromUserId: 'USR-TEMP-1',
      toUserId: 'USR-TEMP-2',
      toUserName: 'Temp Two',
      toUserEmail: 'temp2@example.com',
      transferPrice: 75.0
    },
    safeTime
  );
  assert.equal(t2.success, false);
  assert.match(t2.error || '', /Límite de transferencias alcanzado/i);
});

test('TransferService: rejects transfer inside lock window before gates open', () => {
  const vault = TicketVault.createDemoVault();
  const service = new TransferService(vault, {
    maxTransfers: 2,
    lockWindowSecondsBeforeGates: 7200, // 2 hours
    enforceMaxFaceValue: true
  });

  const ticket = vault.getTicket('TKT-ROCK-101')!;
  const gatesOpenMs = new Date(ticket.eventGatesOpenTime).getTime();

  // 30 minutes before gates (inside 2h lock window)
  const insideLockWindowMs = gatesOpenMs - 30 * 60 * 1000;

  const result = service.transferTicket(
    {
      ticketId: 'TKT-ROCK-101',
      fromUserId: ticket.currentOwnerId,
      toUserId: 'USR-LATE-01',
      toUserName: 'Late Buyer',
      toUserEmail: 'late@example.com',
      transferPrice: 100.0
    },
    insideLockWindowMs
  );

  assert.equal(result.success, false);
  assert.match(result.error || '', /Ventana de transferencia cerrada/i);
});

test('TransferService: rejects transfer if requester is not legitimate owner', () => {
  const vault = TicketVault.createDemoVault();
  const service = new TransferService(vault);

  const ticket = vault.getTicket('TKT-ROCK-101')!; // Owner is USR-ALICE-01

  const result = service.transferTicket({
    ticketId: 'TKT-ROCK-101',
    fromUserId: 'USR-IMPOSTOR',
    toUserId: 'USR-BUYER',
    toUserName: 'Buyer',
    toUserEmail: 'buyer@example.com',
    transferPrice: 50.0
  });

  assert.equal(result.success, false);
  assert.match(result.error || '', /no es el titular legítimo/i);
});

test('TransferService: rejects transfer of already USED ticket', () => {
  const vault = TicketVault.createDemoVault();
  vault.updateStatus('TKT-ROCK-101', 'USED');
  const service = new TransferService(vault);

  const ticket = vault.getTicket('TKT-ROCK-101')!;

  const result = service.transferTicket({
    ticketId: 'TKT-ROCK-101',
    fromUserId: ticket.currentOwnerId,
    toUserId: 'USR-BUYER',
    toUserName: 'Buyer',
    toUserEmail: 'buyer@example.com',
    transferPrice: 50.0
  });

  assert.equal(result.success, false);
  assert.match(result.error || '', /no está activo/i);
});
