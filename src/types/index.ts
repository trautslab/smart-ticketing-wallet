/**
 * 🎫 Smart Digital Ticketing & Cryptographic Wallet Types
 * RFC-001 / Quentro-inspired offline-first protocol.
 */

export type TicketStatus = 'ACTIVE' | 'USED' | 'REVOKED' | 'LOCKED';

export interface Ticket {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string; // ISO 8601
  eventGatesOpenTime: string; // ISO 8601
  venue: string;
  section: string;
  seat: string;
  currentOwnerId: string;
  ownerName: string;
  ownerEmail: string;
  faceValue: number;
  currency: string;
  status: TicketStatus;
  seedHex: string; // 32-byte (64 hex characters) cryptographic secret
  transferCount: number;
  maxTransfers: number;
  usedAt?: string;
  usedGateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QrPayload {
  ticketId: string;
  counter: number;
  counterHex: string;
  authMac: string;
  rawPayload: string;
  generatedAtMs: number;
  remainingSeconds: number;
  timeStepSeconds: number;
}

export type ValidationStatus =
  | 'ACCESS_GRANTED'
  | 'ALREADY_USED'
  | 'EXPIRED_CODE'
  | 'INVALID_MAC'
  | 'TICKET_NOT_FOUND'
  | 'TICKET_REVOKED'
  | 'EVENT_NOT_OPEN';

export interface ScanResult {
  status: ValidationStatus;
  ticketId: string;
  timestamp: string;
  latencyMs: number;
  gateId: string;
  ticket?: Ticket;
  reason: string;
  matchedWindow?: number; // -1 (prev), 0 (current), 1 (next)
}

export interface TransferPolicy {
  maxTransfers: number;
  lockWindowSecondsBeforeGates: number;
  enforceMaxFaceValue: boolean;
}

export interface TransferRecord {
  transferId: string;
  ticketId: string;
  fromUserId: string;
  toUserId: string;
  toUserEmail: string;
  toUserName: string;
  transferPrice: number;
  timestamp: string;
  previousSeedFingerprint: string;
  newSeedFingerprint: string;
  status: 'COMPLETED' | 'REJECTED';
}

export interface MeshSyncMessage {
  type: 'TICKET_USED_BROADCAST' | 'GATE_HEARTBEAT';
  senderGateId: string;
  ticketId: string;
  timestamp: string;
  signature: string;
}

export type ActiveTab = 'boardroom' | 'dual' | 'ticket' | 'turnstile' | 'transfer' | 'audit';
export type TechMode = 'QR' | 'NFC';
export type OrganizerBrand = 'tiketya' | 'rock' | 'custom';

export type UserAppRole = 'attendee' | 'operator' | 'auditor' | 'boardroom';

export interface StaffUser {
  id: string;
  name: string;
  role: 'operator' | 'auditor' | 'boardroom';
  title: string;
  badgeId: string;
  permissions: string[];
  assignedGate?: string;
  token: string;
}

