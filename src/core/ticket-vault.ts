import { Ticket, TicketStatus } from '../types/index.js';
import { TotpEngine } from './totp-engine.js';

export class TicketVault {
  private tickets: Map<string, Ticket> = new Map();

  constructor(initialTickets: Ticket[] = []) {
    for (const ticket of initialTickets) {
      this.tickets.set(ticket.id, { ...ticket });
    }
  }

  /**
   * Provisions a new ticket into the vault with a fresh cryptographically secure seed
   */
  public provisionTicket(params: {
    id: string;
    eventId: string;
    eventName: string;
    eventDate: string;
    eventGatesOpenTime: string;
    venue: string;
    section: string;
    seat: string;
    currentOwnerId: string;
    ownerName: string;
    ownerEmail: string;
    faceValue: number;
    currency?: string;
    maxTransfers?: number;
    seedHex?: string;
  }): Ticket {
    const now = new Date().toISOString();
    const seedHex = params.seedHex || TotpEngine.generateSeed();

    const ticket: Ticket = {
      id: params.id,
      eventId: params.eventId,
      eventName: params.eventName,
      eventDate: params.eventDate,
      eventGatesOpenTime: params.eventGatesOpenTime,
      venue: params.venue,
      section: params.section,
      seat: params.seat,
      currentOwnerId: params.currentOwnerId,
      ownerName: params.ownerName,
      ownerEmail: params.ownerEmail,
      faceValue: params.faceValue,
      currency: params.currency || 'USD',
      status: 'ACTIVE',
      seedHex,
      transferCount: 0,
      maxTransfers: params.maxTransfers !== undefined ? params.maxTransfers : 2,
      createdAt: now,
      updatedAt: now
    };

    this.tickets.set(ticket.id, ticket);
    return { ...ticket };
  }

  public getTicket(id: string): Ticket | undefined {
    const t = this.tickets.get(id);
    return t ? { ...t } : undefined;
  }

  public getAllTickets(): Ticket[] {
    return Array.from(this.tickets.values()).map((t) => ({ ...t }));
  }

  public getTicketsByOwner(ownerId: string): Ticket[] {
    return this.getAllTickets().filter((t) => t.currentOwnerId === ownerId);
  }

  public updateStatus(id: string, status: TicketStatus, meta?: { usedGateId?: string; usedAt?: string }): boolean {
    const ticket = this.tickets.get(id);
    if (!ticket) return false;

    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    if (meta?.usedGateId) ticket.usedGateId = meta.usedGateId;
    if (meta?.usedAt) ticket.usedAt = meta.usedAt;

    this.tickets.set(id, ticket);
    return true;
  }

  public updateSeedAndOwner(
    id: string,
    newOwnerId: string,
    newOwnerName: string,
    newOwnerEmail: string,
    newSeedHex: string
  ): boolean {
    const ticket = this.tickets.get(id);
    if (!ticket) return false;

    ticket.currentOwnerId = newOwnerId;
    ticket.ownerName = newOwnerName;
    ticket.ownerEmail = newOwnerEmail;
    ticket.seedHex = newSeedHex;
    ticket.transferCount += 1;
    ticket.updatedAt = new Date().toISOString();

    this.tickets.set(id, ticket);
    return true;
  }

  /**
   * Generates a realistic suite of sample tickets for demonstration and testing
   */
  public static createDemoVault(): TicketVault {
    const vault = new TicketVault();
    const futureDate = new Date(Date.now() + 86400000 * 7).toISOString(); // 7 days ahead
    const gatesOpen = new Date(Date.now() - 3600000).toISOString(); // Gates opened 1 hr ago

    vault.provisionTicket({
      id: 'TKT-ROCK-101',
      eventId: 'EVT-STADIUM-FEST',
      eventName: 'Rock Revolution World Tour 2026',
      eventDate: futureDate,
      eventGatesOpenTime: gatesOpen,
      venue: 'Estadio Nacional',
      section: 'VIP Campo A',
      seat: 'Fila 1 - Asiento 14',
      currentOwnerId: 'USR-ALICE-01',
      ownerName: 'Alice Johnson',
      ownerEmail: 'alice@example.com',
      faceValue: 120.0,
      currency: 'USD',
      maxTransfers: 2,
      seedHex: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0'
    });

    vault.provisionTicket({
      id: 'TKT-ROCK-102',
      eventId: 'EVT-STADIUM-FEST',
      eventName: 'Rock Revolution World Tour 2026',
      eventDate: futureDate,
      eventGatesOpenTime: gatesOpen,
      venue: 'Estadio Nacional',
      section: 'VIP Campo A',
      seat: 'Fila 1 - Asiento 15',
      currentOwnerId: 'USR-BOB-02',
      ownerName: 'Bob Martinez',
      ownerEmail: 'bob@example.com',
      faceValue: 120.0,
      currency: 'USD',
      maxTransfers: 2,
      seedHex: '0123456789abcdef0123456789abcdefa1b2c3d4e5f60718293a4b5c6d7e8f90'
    });

    vault.provisionTicket({
      id: 'TKT-ROCK-103',
      eventId: 'EVT-STADIUM-FEST',
      eventName: 'Rock Revolution World Tour 2026',
      eventDate: futureDate,
      eventGatesOpenTime: gatesOpen,
      venue: 'Estadio Nacional',
      section: 'Tribuna Occidente',
      seat: 'Sector B - Asiento 42',
      currentOwnerId: 'USR-CHARLIE-03',
      ownerName: 'Charlie Brown',
      ownerEmail: 'charlie@example.com',
      faceValue: 75.0,
      currency: 'USD',
      maxTransfers: 1,
      seedHex: 'f1e2d3c4b5a697887766554433221100fedcba98765432100123456789abcdef'
    });

    return vault;
  }
}
