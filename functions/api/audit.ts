import { ServerStorage } from './_storage';

export async function onRequestGet(): Promise<Response> {
  const auditLog = ServerStorage.getAuditLog();
  const allTickets = ServerStorage.getAllTickets();

  const totalScans = auditLog.length;
  const granted = auditLog.filter(a => a.status === 'ACCESS_GRANTED').length;
  const rejected = auditLog.filter(a => a.status !== 'ACCESS_GRANTED').length;
  const replayAttacks = auditLog.filter(a => a.status === 'REPLAY_ATTACK_DETECTED').length;

  const avgLatency =
    totalScans > 0
      ? Number((auditLog.reduce((acc, curr) => acc + curr.latencyMs, 0) / totalScans).toFixed(2))
      : 0;

  return new Response(
    JSON.stringify({
      stats: {
        totalScans,
        granted,
        rejected,
        replayAttacks,
        avgLatencyMs: avgLatency
      },
      auditLog,
      ticketsStatus: allTickets.map(t => ({
        id: t.id,
        owner: t.currentOwner,
        tier: t.tier,
        status: t.status,
        gate: t.entryGate,
        timestamp: t.entryTimestamp
      }))
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
