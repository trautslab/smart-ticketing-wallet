import { useState, useCallback } from 'react';

export interface GateNode {
  id: string;
  name: string;
  ip: string;
  status: 'ONLINE' | 'OFFLINE' | 'SYNCING';
  scansProcessed: number;
  lastSyncMs: number;
}

export interface MeshEvent {
  id: string;
  type: 'SYNC' | 'REPLAY_ALERT' | 'TICKET_ADMITTED';
  sourceGate: string;
  targetGate: string;
  ticketId: string;
  latencyMs: number;
  timestamp: string;
}

const INITIAL_GATES: GateNode[] = [
  { id: 'GATE-A', name: 'Puerta A (Norte)', ip: '10.0.1.11', status: 'ONLINE', scansProcessed: 42, lastSyncMs: 12 },
  { id: 'GATE-B', name: 'Puerta B (Sur)', ip: '10.0.1.12', status: 'ONLINE', scansProcessed: 38, lastSyncMs: 15 },
  { id: 'GATE-C', name: 'Puerta C (VIP)', ip: '10.0.1.13', status: 'ONLINE', scansProcessed: 19, lastSyncMs: 9 }
];

export function useMeshNetwork() {
  const [gates, setGates] = useState<GateNode[]>(INITIAL_GATES);
  const [usedTicketsMap, setUsedTicketsMap] = useState<Record<string, { gateId: string; timestamp: string }>>({});
  const [meshEvents, setMeshEvents] = useState<MeshEvent[]>([]);

  const broadcastTicketUsed = useCallback((gateId: string, ticketId: string) => {
    const timestamp = new Date().toISOString();
    setUsedTicketsMap(prev => ({ ...prev, [ticketId]: { gateId, timestamp } }));

    // Increment scan count on source gate
    setGates(prev =>
      prev.map(g => (g.id === gateId ? { ...g, scansProcessed: g.scansProcessed + 1, lastSyncMs: Math.floor(8 + Math.random() * 15) } : g))
    );

    // Create gossip sync events to other gates
    const peerGates = gates.filter(g => g.id !== gateId);
    peerGates.forEach(peer => {
      const event: MeshEvent = {
        id: `mesh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'SYNC',
        sourceGate: gateId,
        targetGate: peer.id,
        ticketId,
        latencyMs: Math.floor(10 + Math.random() * 20),
        timestamp
      };
      setMeshEvents(prev => [event, ...prev.slice(0, 19)]);
    });
  }, [gates]);

  const checkDoubleEntry = useCallback((targetGateId: string, ticketId: string) => {
    const existing = usedTicketsMap[ticketId];
    if (existing) {
      const alertEvent: MeshEvent = {
        id: `alert-${Date.now()}`,
        type: 'REPLAY_ALERT',
        sourceGate: existing.gateId,
        targetGate: targetGateId,
        ticketId,
        latencyMs: 4,
        timestamp: new Date().toISOString()
      };
      setMeshEvents(prev => [alertEvent, ...prev.slice(0, 19)]);
      return { isDoubleEntry: true, originGate: existing.gateId, usedAt: existing.timestamp };
    }
    return { isDoubleEntry: false };
  }, [usedTicketsMap]);

  return {
    gates,
    usedTicketsMap,
    meshEvents,
    broadcastTicketUsed,
    checkDoubleEntry
  };
}
