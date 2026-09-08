import test from 'node:test';
import assert from 'node:assert/strict';
import { TicketVault } from '../src/core/ticket-vault.js';
import { TurnstileValidator } from '../src/core/turnstile-validator.js';
import { QrPayloadEncoder } from '../src/core/qr-payload.js';
import { TotpEngine } from '../src/core/totp-engine.js';

test('TurnstileValidator: grants access in under 80ms for valid dynamic QR (Happy Path)', () => {
  const vault = TicketVault.createDemoVault();
  const validator = new TurnstileValidator(vault, { gateId: 'GATE-NORTH-01' });

  const ticket = vault.getTicket('TKT-ROCK-101')!;
  const now = Date.now();
  const payload = QrPayloadEncoder.encode(ticket.id, ticket.seedHex, now, 15);

  const result = validator.scan(payload.rawPayload, now);

  assert.equal(result.status, 'ACCESS_GRANTED');
  assert.equal(result.ticketId, 'TKT-ROCK-101');
  assert.equal(result.gateId, 'GATE-NORTH-01');
  assert.equal(result.matchedWindow, 0);
  assert.ok(result.latencyMs < 80, `Latency was ${result.latencyMs}ms, expected < 80ms`);

  // Verify status in vault is updated to USED
  const postTicket = vault.getTicket('TKT-ROCK-101')!;
  assert.equal(postTicket.status, 'USED');
  assert.equal(postTicket.usedGateId, 'GATE-NORTH-01');
});

test('TurnstileValidator: detects Replay Attack on immediate double scan', () => {
  const vault = TicketVault.createDemoVault();
  const validator = new TurnstileValidator(vault, { gateId: 'GATE-NORTH-01' });

  const ticket = vault.getTicket('TKT-ROCK-102')!;
  const now = Date.now();
  const payload = QrPayloadEncoder.encode(ticket.id, ticket.seedHex, now, 15);

  // First scan: Granted
  const scan1 = validator.scan(payload.rawPayload, now);
  assert.equal(scan1.status, 'ACCESS_GRANTED');

  // Second scan (same QR screenshot or second person): Denied with ALREADY_USED
  const scan2 = validator.scan(payload.rawPayload, now + 1000);
  assert.equal(scan2.status, 'ALREADY_USED');
  assert.match(scan2.reason, /Replay Attack/i);
});

test('TurnstileValidator: rejects expired QR code from earlier time window', () => {
  const vault = TicketVault.createDemoVault();
  const validator = new TurnstileValidator(vault, { gateId: 'GATE-SOUTH-02' });

  const ticket = vault.getTicket('TKT-ROCK-103')!;
  const oldTime = Date.now() - 45000; // 45s ago = 3 steps back
  const payload = QrPayloadEncoder.encode(ticket.id, ticket.seedHex, oldTime, 15);

  const result = validator.scan(payload.rawPayload, Date.now());
  assert.equal(result.status, 'EXPIRED_CODE');
  assert.match(result.reason, /expirado/i);
});

test('TurnstileValidator: tolerates +/- 1 step clock drift (phone 10s out of sync)', () => {
  const vault = TicketVault.createDemoVault();
  const validator = new TurnstileValidator(vault, { gateId: 'GATE-EAST-03' });

  const ticket = vault.getTicket('TKT-ROCK-101')!;
  const baseTime = 1773000000000;

  // Phone generated token 15s in the past relative to validator
  const phoneTime = baseTime - 15000;
  const payload = QrPayloadEncoder.encode(ticket.id, ticket.seedHex, phoneTime, 15);

  const result = validator.scan(payload.rawPayload, baseTime);
  assert.equal(result.status, 'ACCESS_GRANTED');
  assert.equal(result.matchedWindow, -1);
});

test('TurnstileValidator: rejects invalid cryptographic MAC (tampered screenshot)', () => {
  const vault = TicketVault.createDemoVault();
  const validator = new TurnstileValidator(vault, { gateId: 'GATE-WEST-04' });

  const ticket = vault.getTicket('TKT-ROCK-102')!;
  const now = Date.now();
  const counterHex = TotpEngine.getCounter(now, 15).toString(16).padStart(16, '0');
  const tamperedPayload = `STK:${ticket.id}:${counterHex}:deadbeefcafebabe`;

  const result = validator.scan(tamperedPayload, now);
  assert.equal(result.status, 'INVALID_MAC');
  assert.match(result.reason, /Firma criptográfica inválida/i);
});

test('TurnstileValidator: rejects unknown ticket ID not in local vault', () => {
  const vault = TicketVault.createDemoVault();
  const validator = new TurnstileValidator(vault, { gateId: 'GATE-VIP-01' });

  const fakePayload = `STK:TKT-FAKE-999:0000000000000001:abcdef0123456789`;
  const result = validator.scan(fakePayload, Date.now());
  assert.equal(result.status, 'TICKET_NOT_FOUND');
});

test('TurnstileValidator: rejects revoked ticket', () => {
  const vault = TicketVault.createDemoVault();
  vault.updateStatus('TKT-ROCK-101', 'REVOKED');
  const validator = new TurnstileValidator(vault, { gateId: 'GATE-VIP-01' });

  const ticket = vault.getTicket('TKT-ROCK-101')!;
  const now = Date.now();
  const payload = QrPayloadEncoder.encode(ticket.id, ticket.seedHex, now, 15);

  const result = validator.scan(payload.rawPayload, now);
  assert.equal(result.status, 'TICKET_REVOKED');
});
