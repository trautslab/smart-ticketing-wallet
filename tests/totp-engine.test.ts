import test from 'node:test';
import assert from 'node:assert/strict';
import { TotpEngine } from '../src/core/totp-engine.js';

test('TotpEngine: generates a 256-bit seed in hex format', () => {
  const seed = TotpEngine.generateSeed();
  assert.equal(typeof seed, 'string');
  assert.equal(seed.length, 64); // 32 bytes * 2 hex chars
  assert.match(seed, /^[0-9a-f]{64}$/);
});

test('TotpEngine: calculates consistent 15-second counters', () => {
  const t0 = 1773000000000; // Exact multiple of 15,000ms
  const counter0 = TotpEngine.getCounter(t0, 15);
  const counter14s = TotpEngine.getCounter(t0 + 14999, 15);
  const counter15s = TotpEngine.getCounter(t0 + 15000, 15);

  assert.equal(counter0, counter14s, 'Counter should be identical within the same 15s interval');
  assert.equal(counter15s, counter0 + 1, 'Counter must increment exactly by 1 after 15s');
});

test('TotpEngine: calculates remaining seconds correctly', () => {
  const t0 = 1773000000000; // at 0s into window
  assert.equal(TotpEngine.getRemainingSeconds(t0, 15), 15);

  const t5 = t0 + 5000; // 5s in
  assert.equal(TotpEngine.getRemainingSeconds(t5, 15), 10);

  const t14 = t0 + 14100; // 14.1s in
  assert.equal(TotpEngine.getRemainingSeconds(t14, 15), 1);
});

test('TotpEngine: generates valid TOTP PIN and 16-char auth MAC', () => {
  const seed = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const token = TotpEngine.generateToken(seed, 1773000000000, 15);

  assert.equal(typeof token.pin, 'string');
  assert.equal(token.pin.length, 8);
  assert.match(token.pin, /^\d{8}$/);

  assert.equal(typeof token.authMac, 'string');
  assert.equal(token.authMac.length, 16);
  assert.match(token.authMac, /^[0-9a-f]{16}$/);

  assert.equal(token.counterHex.length, 16);
});

test('TotpEngine: verifies token within +/- 1 step drift window', () => {
  const seed = TotpEngine.generateSeed();
  const baseTime = 1773000000000;
  const currentToken = TotpEngine.generateToken(seed, baseTime, 15);

  // Exact match (window 0)
  const exact = TotpEngine.verifyToken(seed, currentToken.authMac, currentToken.counter, 1, baseTime, 15);
  assert.equal(exact.valid, true);
  assert.equal(exact.matchedWindow, 0);

  // Past window -1 (user's phone is 10s ahead or turnstile scanned during rotation)
  const prevTime = baseTime - 15000;
  const prevToken = TotpEngine.generateToken(seed, prevTime, 15);
  const verifyPrev = TotpEngine.verifyToken(seed, prevToken.authMac, prevToken.counter, 1, baseTime, 15);
  assert.equal(verifyPrev.valid, true);
  assert.equal(verifyPrev.matchedWindow, -1);

  // Future window +1
  const futureTime = baseTime + 15000;
  const futureToken = TotpEngine.generateToken(seed, futureTime, 15);
  const verifyFuture = TotpEngine.verifyToken(seed, futureToken.authMac, futureToken.counter, 1, baseTime, 15);
  assert.equal(verifyFuture.valid, true);
  assert.equal(verifyFuture.matchedWindow, 1);

  // Out of window (+2 steps / 30s away)
  const outOfWindowTime = baseTime + 30000;
  const outOfWindowToken = TotpEngine.generateToken(seed, outOfWindowTime, 15);
  const verifyOut = TotpEngine.verifyToken(seed, outOfWindowToken.authMac, outOfWindowToken.counter, 1, baseTime, 15);
  assert.equal(verifyOut.valid, false);

  // Invalid MAC
  const fakeMac = '0000000000000000';
  const verifyFake = TotpEngine.verifyToken(seed, fakeMac, currentToken.counter, 1, baseTime, 15);
  assert.equal(verifyFake.valid, false);
});
