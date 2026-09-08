import { ServerStorage } from './_storage';

export async function onRequestGet(context: { request: Request }): Promise<Response> {
  const url = new URL(context.request.url);
  const ticketId = url.searchParams.get('id') ?? 'TKT-LIMA-2026-VIP';
  const reset = url.searchParams.get('reset') === 'true';

  const ticket = ServerStorage.getTicket(ticketId);
  if (!ticket) {
    return new Response(
      JSON.stringify({ error: 'Ticket not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Allow resetting ticket status for demo testing purposes if requested
  if (reset) {
    ticket.status = 'ISSUED';
    ticket.entryGate = undefined;
    ticket.entryTimestamp = undefined;
  }

  // Return ticket data to the attendee
  // Note: For client wallet generation, the client receives their individual seed so they can generate
  // rotating QR codes offline on airplane mode without internet.
  return new Response(
    JSON.stringify({
      id: ticket.id,
      eventName: ticket.eventName,
      venue: ticket.venue,
      eventDate: ticket.eventDate,
      tier: ticket.tier,
      section: ticket.section,
      seat: ticket.seat,
      faceValueUsd: ticket.faceValueUsd,
      currentOwner: ticket.currentOwner,
      ownerDni: ticket.ownerDni,
      status: ticket.status,
      entryGate: ticket.entryGate,
      entryTimestamp: ticket.entryTimestamp,
      clientSeedHex: ticket.secretSeedHex,
      serverTime: Date.now()
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
