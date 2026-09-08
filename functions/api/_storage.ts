// Backend Server State & Master Secret Vault (Cloudflare Pages Functions)
// Keeps cryptographic secrets and ticket states strictly in the server environment.

export interface ServerTicket {
  id: string;
  eventName: string;
  venue: string;
  eventDate: string;
  tier: 'VIP' | 'GENERAL' | 'TRIBUNA' | 'PREMIUM';
  section: string;
  seat: string;
  faceValueUsd: number;
  originalBuyer: string;
  currentOwner: string;
  ownerDni: string;
  status: 'ISSUED' | 'USED' | 'REVOKED' | 'TRANSFERRED';
  entryTimestamp?: string;
  entryGate?: string;
  secretSeedHex: string; // Master secret - never sent in client bundle
}

export interface ServerAuditEntry {
  id: string;
  timestamp: string;
  ticketId: string;
  gateId: string;
  operatorId: string;
  status: 'ACCESS_GRANTED' | 'REPLAY_ATTACK_DETECTED' | 'INVALID_MAC' | 'EXPIRED_WINDOW' | 'REVOKED' | 'NOT_FOUND';
  mode: 'QR' | 'NFC' | 'AUDIO';
  latencyMs: number;
  reason?: string;
}

// In-Memory Database for Serverless Edge Instance
// (In enterprise production, backed by Cloudflare KV / D1 SQLite / Durable Objects)
const MASTER_TICKETS: Map<string, ServerTicket> = new Map([
  [
    'TKT-LIMA-2026-VIP',
    {
      id: 'TKT-LIMA-2026-VIP',
      eventName: 'Bad Bunny - World Hottest Tour',
      venue: 'Estadio Nacional, Lima',
      eventDate: '15 Noviembre 2026, 20:00 PET',
      tier: 'VIP',
      section: 'OCCIDENTE VIP',
      seat: 'Fila 4, Asiento 18',
      faceValueUsd: 180,
      originalBuyer: 'Carlos Mendoza',
      currentOwner: 'Carlos Mendoza',
      ownerDni: '74829104',
      status: 'ISSUED',
      secretSeedHex: 'a3f8190c42eb517d983421bb0145ef8891c3d4a2b109e87f6543210fedcba987'
    }
  ],
  [
    'TKT-LIMA-2026-002',
    {
      id: 'TKT-LIMA-2026-002',
      eventName: 'Bad Bunny - World Hottest Tour',
      venue: 'Estadio Nacional, Lima',
      eventDate: '15 Noviembre 2026, 20:00 PET',
      tier: 'GENERAL',
      section: 'CAMPO A',
      seat: 'Entrada General #2940',
      faceValueUsd: 95,
      originalBuyer: 'Lucía Benavides',
      currentOwner: 'Lucía Benavides',
      ownerDni: '48201947',
      status: 'ISSUED',
      secretSeedHex: 'b8471920ac3918bf823719230192830192830192830192830192830192830192'
    }
  ],
  [
    'TKT-LIMA-2026-003',
    {
      id: 'TKT-LIMA-2026-003',
      eventName: 'Bad Bunny - World Hottest Tour',
      venue: 'Estadio Nacional, Lima',
      eventDate: '15 Noviembre 2026, 20:00 PET',
      tier: 'TRIBUNA',
      section: 'ORIENTE ALTA',
      seat: 'Fila 12, Asiento 4',
      faceValueUsd: 65,
      originalBuyer: 'Mateo Quispe',
      currentOwner: 'Mateo Quispe',
      ownerDni: '71938472',
      status: 'ISSUED',
      secretSeedHex: 'c918237102938102938102938102938102938102938102938102938102938102'
    }
  ]
]);

// Anti-Replay Store: Tracks consumed (ticketId, counter) combinations
const USED_COUNTERS: Set<string> = new Set();
// Admitted Tickets: Tracks tickets admitted to prevent re-entry
const ADMITTED_TICKETS: Map<string, { gateId: string; timestamp: string }> = new Map();

// Immutable Audit Log
const AUDIT_LOG: ServerAuditEntry[] = [];

export const ServerStorage = {
  getTicket(id: string): ServerTicket | undefined {
    return MASTER_TICKETS.get(id);
  },

  getAllTickets(): ServerTicket[] {
    return Array.from(MASTER_TICKETS.values());
  },

  isCounterUsed(ticketId: string, counter: number): boolean {
    return USED_COUNTERS.has(`${ticketId}:${counter}`);
  },

  markCounterUsed(ticketId: string, counter: number): void {
    USED_COUNTERS.add(`${ticketId}:${counter}`);
  },

  isTicketAdmitted(ticketId: string): { gateId: string; timestamp: string } | undefined {
    return ADMITTED_TICKETS.get(ticketId);
  },

  admitTicket(ticketId: string, gateId: string, timestamp: string): void {
    ADMITTED_TICKETS.set(ticketId, { gateId, timestamp });
    const ticket = MASTER_TICKETS.get(ticketId);
    if (ticket) {
      ticket.status = 'USED';
      ticket.entryTimestamp = timestamp;
      ticket.entryGate = gateId;
    }
  },

  recordAudit(entry: ServerAuditEntry): void {
    AUDIT_LOG.unshift(entry);
    if (AUDIT_LOG.length > 500) {
      AUDIT_LOG.pop();
    }
  },

  getAuditLog(): ServerAuditEntry[] {
    return [...AUDIT_LOG];
  }
};

/**
 * Universal HMAC-SHA256 calculation using standard Web Crypto API (SubtleCrypto)
 */
export async function computeSubtleAuthMac(seedHex: string, counter: number): Promise<string> {
  const keyBytes = new Uint8Array(seedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(counter), false); // Big-Endian 64-bit integer

  const signature = await crypto.subtle.sign('HMAC', key, buffer);
  const sigBytes = new Uint8Array(signature);

  // Return first 8 bytes formatted as 16 lowercase hex characters (matches TOTP RFC 4226 / STK v1)
  return Array.from(sigBytes.slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
