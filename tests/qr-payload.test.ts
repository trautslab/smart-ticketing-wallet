import test from 'node:test';
import assert from 'node:assert/strict';
import { QrPayloadEncoder } from '../src/core/qr-payload.js';
import { TotpEngine } from '../src/core/totp-engine.js';

test('QrPayloadEncoder: correctly encodes ticket payload into STK format', () => {
  const seed = TotpEngine.generateSeed();
  const ticketId = 'TKT-ROCK-101';
  const timestamp = 1773000000000;

  const payload = QrPayloadEncoder.encode(ticketId, seed, timestamp, 15);

  assert.equal(payload.ticketId, ticketId);
  assert.equal(payload.remainingSeconds, 15);
  assert.match(payload.rawPayload, /^STK:TKT-ROCK-101:[0-9a-f]{16}:[0-9a-f]{16}$/);
});

test('QrPayloadEncoder: correctly decodes valid raw STK string', () => {
  const raw = 'STK:TKT-ROCK-101:000000019cd5b880:3f7a8b9c1d2e3f40';
  const decoded = QrPayloadEncoder.decode(raw);

  assert.equal(decoded.ticketId, 'TKT-ROCK-101');
  assert.equal(decoded.counterHex, '000000019cd5b880');
  assert.equal(decoded.counter, parseInt('000000019cd5b880', 16));
  assert.equal(decoded.authMac, '3f7a8b9c1d2e3f40');
});

test('QrPayloadEncoder: throws error on malformed raw QR string', () => {
  assert.throws(() => QrPayloadEncoder.decode('INVALID:STRING'), /Invalid QR payload format/);
  assert.throws(() => QrPayloadEncoder.decode('OTHER:TKT:123:abc'), /Invalid QR payload format/);
});
