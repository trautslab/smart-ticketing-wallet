import test from 'node:test';
import assert from 'node:assert/strict';
import { TicketVault } from '../src/core/ticket-vault.js';
import { LocalMeshNetwork, GateMeshNode } from '../src/core/mesh-sync.js';

test('GateMeshNode: broadcasts ticket usage to peer gates over local mesh', () => {
  const mesh = LocalMeshNetwork.getInstance();
  mesh.clear();

  const vaultA = TicketVault.createDemoVault();
  const vaultB = TicketVault.createDemoVault();

  const gateA = new GateMeshNode('GATE-NORTH-01', vaultA);
  const gateB = new GateMeshNode('GATE-SOUTH-02', vaultB);

  // Both vaults start with TKT-ROCK-101 ACTIVE
  assert.equal(vaultA.getTicket('TKT-ROCK-101')?.status, 'ACTIVE');
  assert.equal(vaultB.getTicket('TKT-ROCK-101')?.status, 'ACTIVE');

  // Gate A admits user and notifies mesh
  vaultA.updateStatus('TKT-ROCK-101', 'USED', { usedGateId: 'GATE-NORTH-01', usedAt: new Date().toISOString() });
  gateA.notifyTicketUsed('TKT-ROCK-101');

  // Gate B must have received the broadcast and marked ticket USED in its local vault
  const ticketAtGateB = vaultB.getTicket('TKT-ROCK-101');
  assert.equal(ticketAtGateB?.status, 'USED');
  assert.equal(ticketAtGateB?.usedGateId, 'GATE-NORTH-01');

  // Verify message logged in mesh
  const history = mesh.getHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].ticketId, 'TKT-ROCK-101');
  assert.equal(history[0].senderGateId, 'GATE-NORTH-01');
});
