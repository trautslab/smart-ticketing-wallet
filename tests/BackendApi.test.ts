import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost as handleVerify } from '../functions/api/verify';
import { onRequestGet as handleTicket } from '../functions/api/ticket';
import { onRequestGet as handleAudit } from '../functions/api/audit';
import { onRequestPost as handleAuth } from '../functions/api/auth';
import { computeSubtleAuthMac, ServerStorage } from '../functions/api/_storage';

describe('Serverless Edge Backend API (/api/verify, /api/ticket, /api/auth, /api/audit)', () => {
  test('GET /api/ticket: returns attendee ticket metadata without revealing other tickets', async () => {
    const req = new Request('http://localhost:3000/api/ticket?id=TKT-LIMA-2026-VIP', {
      method: 'GET'
    });
    const res = await handleTicket({ request: req });
    assert.equal(res.status, 200);

    const data = await res.json() as any;
    assert.equal(data.id, 'TKT-LIMA-2026-VIP');
    assert.equal(data.currentOwner, 'Carlos Mendoza');
    assert.equal(data.tier, 'VIP');
    assert.ok(data.clientSeedHex);
  });

  test('POST /api/verify: grants access for valid dynamic STK QR payload in under 50ms', async () => {
    // Reset ticket state for test
    const resetReq = new Request('http://localhost:3000/api/ticket?id=TKT-LIMA-2026-VIP&reset=true', { method: 'GET' });
    await handleTicket({ request: resetReq });

    const ticket = ServerStorage.getTicket('TKT-LIMA-2026-VIP')!;
    const currentCounter = Math.floor(Date.now() / 15000);
    const counterHex = currentCounter.toString(16).padStart(16, '0');
    const authMac = await computeSubtleAuthMac(ticket.secretSeedHex, currentCounter);

    const payload = `STK:v1:${ticket.id}:${counterHex}:${authMac}`;

    const req = new Request('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload,
        gateId: 'GATE-A',
        operatorId: 'OP-JUAN',
        mode: 'QR'
      })
    });

    const res = await handleVerify({ request: req });
    assert.equal(res.status, 200);

    const body = await res.json() as any;
    assert.equal(body.valid, true);
    assert.equal(body.status, 'ACCESS_GRANTED');
    assert.equal(body.attendeeName, 'Carlos Mendoza');
    assert.equal(body.gateId, 'GATE-A');
    assert.ok(body.latencyMs < 50, `Latency was ${body.latencyMs}ms, expected < 50ms`);
  });

  test('POST /api/verify: detects and blocks Replay Attack (double scan / screenshot sharing)', async () => {
    const ticket = ServerStorage.getTicket('TKT-LIMA-2026-VIP')!;
    const currentCounter = Math.floor(Date.now() / 15000);
    const counterHex = currentCounter.toString(16).padStart(16, '0');
    const authMac = await computeSubtleAuthMac(ticket.secretSeedHex, currentCounter);

    const payload = `STK:v1:${ticket.id}:${counterHex}:${authMac}`;

    // Second scan with identical token
    const req = new Request('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload,
        gateId: 'GATE-B',
        operatorId: 'OP-PEDRO',
        mode: 'QR'
      })
    });

    const res = await handleVerify({ request: req });
    assert.equal(res.status, 200);

    const body = await res.json() as any;
    assert.equal(body.valid, false);
    assert.equal(body.status, 'REPLAY_ATTACK_DETECTED');
    assert.ok(body.reason.includes('ya ingresado') || body.reason.includes('Captura de pantalla') || body.reason.includes('Doble entrada'));
  });

  test('POST /api/verify: rejects expired QR code from earlier time window (>15s)', async () => {
    // Test with fresh ticket
    const ticket = ServerStorage.getTicket('TKT-LIMA-2026-002')!;
    const oldCounter = Math.floor(Date.now() / 15000) - 5; // 5 steps (75s ago)
    const counterHex = oldCounter.toString(16).padStart(16, '0');
    const authMac = await computeSubtleAuthMac(ticket.secretSeedHex, oldCounter);

    const payload = `STK:v1:${ticket.id}:${counterHex}:${authMac}`;

    const req = new Request('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, gateId: 'GATE-A' })
    });

    const res = await handleVerify({ request: req });
    const body = await res.json() as any;
    assert.equal(body.valid, false);
    assert.equal(body.status, 'EXPIRED_WINDOW');
  });

  test('POST /api/verify: rejects tampered HMAC cryptographic signature', async () => {
    const ticket = ServerStorage.getTicket('TKT-LIMA-2026-003')!;
    const currentCounter = Math.floor(Date.now() / 15000);
    const counterHex = currentCounter.toString(16).padStart(16, '0');
    const forgedMac = 'deadbeefcafebabe';

    const payload = `STK:v1:${ticket.id}:${counterHex}:${forgedMac}`;

    const req = new Request('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, gateId: 'GATE-A' })
    });

    const res = await handleVerify({ request: req });
    const body = await res.json() as any;
    assert.equal(body.valid, false);
    assert.equal(body.status, 'INVALID_MAC');
  });

  test('POST /api/auth: authenticates staff roles and issues permissions (RBAC/ABAC)', async () => {
    // 1. Operator
    const opReq = new Request('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: 'OP-2026' })
    });
    const opRes = await handleAuth({ request: opReq });
    assert.equal(opRes.status, 200);
    const opData = await opRes.json() as any;
    assert.equal(opData.authenticated, true);
    assert.equal(opData.user.role, 'operator');
    assert.ok(opData.user.permissions.includes('scan_qr'));

    // 2. Auditor
    const audReq = new Request('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: 'AUD-2026' })
    });
    const audRes = await handleAuth({ request: audReq });
    const audData = await audRes.json() as any;
    assert.equal(audData.user.role, 'auditor');
    assert.ok(audData.user.permissions.includes('view_audit_ledger'));

    // 3. Boardroom
    const dirReq = new Request('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: 'DIR-2026' })
    });
    const dirRes = await handleAuth({ request: dirReq });
    const dirData = await dirRes.json() as any;
    assert.equal(dirData.user.role, 'boardroom');
    assert.ok(dirData.user.permissions.includes('view_boardroom_roi'));

    // 4. Invalid pin
    const badReq = new Request('http://localhost:3000/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: 'WRONG-PIN' })
    });
    const badRes = await handleAuth({ request: badReq });
    assert.equal(badRes.status, 401);
  });

  test('GET /api/audit: returns recorded scans and gate throughput metrics', async () => {
    const req = new Request('http://localhost:3000/api/audit', { method: 'GET' });
    const res = await handleAudit();
    assert.equal(res.status, 200);

    const body = await res.json() as any;
    assert.ok(body.stats.totalScans >= 4);
    assert.ok(body.stats.granted >= 1);
    assert.ok(body.stats.replayAttacks >= 1);
    assert.ok(Array.isArray(body.auditLog));
  });
});
