import { EventEmitter } from 'node:events';
import { createHash } from 'node:crypto';
import { MeshSyncMessage } from '../types/index.js';
import { TurnstileValidator } from './turnstile-validator.js';
import { TicketVault } from './ticket-vault.js';

export class LocalMeshNetwork extends EventEmitter {
  private static instance: LocalMeshNetwork;
  private messageHistory: MeshSyncMessage[] = [];

  private constructor() {
    super();
  }

  public static getInstance(): LocalMeshNetwork {
    if (!LocalMeshNetwork.instance) {
      LocalMeshNetwork.instance = new LocalMeshNetwork();
    }
    return LocalMeshNetwork.instance;
  }

  /**
   * Broadcasts a message across the local stadium turnstiles subnet
   */
  public broadcast(message: MeshSyncMessage): void {
    this.messageHistory.push(message);
    this.emit('message', message);
  }

  public getHistory(): MeshSyncMessage[] {
    return [...this.messageHistory];
  }

  public clear(): void {
    this.messageHistory = [];
    this.removeAllListeners();
  }
}

export class GateMeshNode {
  public readonly gateId: string;
  private vault: TicketVault;
  private mesh: LocalMeshNetwork;

  constructor(gateId: string, vault: TicketVault) {
    this.gateId = gateId;
    this.vault = vault;
    this.mesh = LocalMeshNetwork.getInstance();

    this.mesh.on('message', (msg: MeshSyncMessage) => {
      if (msg.senderGateId !== this.gateId && msg.type === 'TICKET_USED_BROADCAST') {
        this.handlePeerTicketUsed(msg);
      }
    });
  }

  /**
   * Notifies peers in the stadium local mesh when this gate marks a ticket USED
   */
  public notifyTicketUsed(ticketId: string): MeshSyncMessage {
    const timestamp = new Date().toISOString();
    const signature = createHash('sha256')
      .update(`${this.gateId}:${ticketId}:${timestamp}`)
      .digest('hex')
      .substring(0, 16);

    const message: MeshSyncMessage = {
      type: 'TICKET_USED_BROADCAST',
      senderGateId: this.gateId,
      ticketId,
      timestamp,
      signature
    };

    this.mesh.broadcast(message);
    return message;
  }

  /**
   * Updates local cache when receiving a broadcast from a peer gate
   */
  private handlePeerTicketUsed(msg: MeshSyncMessage): void {
    this.vault.updateStatus(msg.ticketId, 'USED', {
      usedGateId: msg.senderGateId,
      usedAt: msg.timestamp
    });
  }
}
