import test from 'node:test';
import assert from 'node:assert/strict';
import { TicketVault } from '../src/core/ticket-vault.js';
import { WalletPassAdapter } from '../src/core/wallet-pass-adapter.js';

test('WalletPassAdapter: generates valid Apple Wallet PKPass structure', () => {
  const vault = TicketVault.createDemoVault();
  const ticket = vault.getTicket('TKT-ROCK-101')!;
  const livePayload = 'STK:TKT-ROCK-101:0000000003b5a12:9f8a3c2e1b4d';

  const pass = WalletPassAdapter.generateApplePass(ticket, livePayload, 'https://tickets.trautslab.site');

  assert.equal(pass.formatVersion, 1);
  assert.equal(pass.passTypeIdentifier, 'pass.com.trautslab.smartticketing');
  assert.equal(pass.serialNumber, 'TKT-ROCK-101');
  assert.equal(pass.barcodes[0].format, 'PKBarcodeFormatQR');
  assert.equal(pass.barcodes[0].message, livePayload);
  assert.equal(pass.eventTicket.primaryFields[0].value, ticket.eventName);
});

test('WalletPassAdapter: generates valid Google Wallet pass object', () => {
  const vault = TicketVault.createDemoVault();
  const ticket = vault.getTicket('TKT-ROCK-102')!;
  const livePayload = 'STK:TKT-ROCK-102:0000000003b5a12:8a3c2e1b4d9f';

  const gpass = WalletPassAdapter.generateGoogleWalletPass(ticket, livePayload);

  assert.equal(gpass.id, 'generic.TKT-ROCK-102');
  assert.equal(gpass.state, 'ACTIVE');
  assert.equal(gpass.barcode.type, 'QR_CODE');
  assert.equal(gpass.barcode.value, livePayload);
  assert.equal(gpass.cardTitle.defaultValue.value, ticket.eventName);
});
