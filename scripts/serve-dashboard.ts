#!/usr/bin/env node
/**
 * 🚀 Smart Ticketing & Digital Wallet Dashboard Server
 * Servidor HTTP nativo con API REST para la simulación interactiva web.
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { TicketVault } from '../src/core/ticket-vault.js';
import { TurnstileValidator } from '../src/core/turnstile-validator.js';
import { QrPayloadEncoder } from '../src/core/qr-payload.js';
import { TransferService } from '../src/core/transfer-service.js';
import { GateMeshNode } from '../src/core/mesh-sync.js';
import { TotpEngine } from '../src/core/totp-engine.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3300;
const htmlPath = resolve(process.cwd(), 'observability', 'index.html');

// In-memory instances
const vault = TicketVault.createDemoVault();
const validators: Record<string, TurnstileValidator> = {
  'GATE-NORTH-01': new TurnstileValidator(vault, { gateId: 'GATE-NORTH-01' }),
  'GATE-SOUTH-02': new TurnstileValidator(vault, { gateId: 'GATE-SOUTH-02' }),
  'GATE-VIP-01': new TurnstileValidator(vault, { gateId: 'GATE-VIP-01' })
};

const meshNodes: Record<string, GateMeshNode> = {
  'GATE-NORTH-01': new GateMeshNode('GATE-NORTH-01', vault),
  'GATE-SOUTH-02': new GateMeshNode('GATE-SOUTH-02', vault),
  'GATE-VIP-01': new GateMeshNode('GATE-VIP-01', vault)
};

const transferService = new TransferService(vault, {
  maxTransfers: 2,
  lockWindowSecondsBeforeGates: 7200,
  enforceMaxFaceValue: true
});

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

const server = createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  try {
    // 1. Static HTML dashboard
    if (pathname === '/' || pathname === '/index.html') {
      if (!existsSync(htmlPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Dashboard HTML no encontrado');
      }
      const html = readFileSync(htmlPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    // 2. GET /api/tickets - List all tickets with current dynamic QR payload
    if (req.method === 'GET' && pathname === '/api/tickets') {
      const tickets = vault.getAllTickets();
      const now = Date.now();
      const response = tickets.map((t) => {
        const payload = QrPayloadEncoder.encode(t.id, t.seedHex, now, 15);
        return {
          ...t,
          seedHexObfuscated: `${t.seedHex.substring(0, 8)}...${t.seedHex.substring(56)}`,
          currentQr: payload
        };
      });
      return sendJson(res, 200, response);
    }

    // 3. GET /api/ticket/:id - Get specific ticket with live payload
    if (req.method === 'GET' && pathname.startsWith('/api/ticket/')) {
      const ticketId = pathname.replace('/api/ticket/', '');
      const ticket = vault.getTicket(ticketId);
      if (!ticket) {
        return sendJson(res, 404, { error: 'Boleto no encontrado' });
      }
      const now = Date.now();
      const payload = QrPayloadEncoder.encode(ticket.id, ticket.seedHex, now, 15);
      return sendJson(res, 200, {
        ticket,
        qrPayload: payload
      });
    }

    // 4. POST /api/scan - Simulate turnstile scan
    if (req.method === 'POST' && pathname === '/api/scan') {
      const body = await parseJsonBody(req);
      const gateId = body.gateId || 'GATE-NORTH-01';
      const rawPayload = body.rawPayload;
      const timestampMs = body.timestampMs ? parseInt(body.timestampMs, 10) : Date.now();

      const validator = validators[gateId] || validators['GATE-NORTH-01'];
      const result = validator.scan(rawPayload, timestampMs);

      // If access was granted, notify peers via local mesh
      if (result.status === 'ACCESS_GRANTED') {
        const mesh = meshNodes[gateId];
        if (mesh) {
          mesh.notifyTicketUsed(result.ticketId);
        }
      }

      return sendJson(res, 200, result);
    }

    // 5. POST /api/transfer - Simulate P2P transfer
    if (req.method === 'POST' && pathname === '/api/transfer') {
      const body = await parseJsonBody(req);
      const result = transferService.transferTicket({
        ticketId: body.ticketId,
        fromUserId: body.fromUserId,
        toUserId: body.toUserId,
        toUserName: body.toUserName,
        toUserEmail: body.toUserEmail,
        transferPrice: parseFloat(body.transferPrice || '0')
      });
      return sendJson(res, 200, result);
    }

    // 6. GET /api/audit - Get logs
    if (req.method === 'GET' && pathname === '/api/audit') {
      const allLogs = Object.values(validators).flatMap((v) => v.getAuditLog());
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const transfers = transferService.getLedger();
      return sendJson(res, 200, { scans: allLogs, transfers });
    }

    // 7. POST /api/reset - Reset demo vault
    if (req.method === 'POST' && pathname === '/api/reset') {
      const newVault = TicketVault.createDemoVault();
      for (const t of newVault.getAllTickets()) {
        vault.updateStatus(t.id, 'ACTIVE');
      }
      return sendJson(res, 200, { success: true, message: 'Bóveda reseteada' });
    }

    sendJson(res, 404, { error: 'Ruta no encontrada' });
  } catch (err: any) {
    sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n🎟️  Smart Ticketing Observability & Simulation Server`);
  console.log(`📡 URL Local: http://localhost:${PORT}`);
  console.log(`⚡ Modo: 100% Offline Cryptographic Engine Active\n`);
});
