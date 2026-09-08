import { Ticket } from '../types/index.js';

export interface ApplePassStructure {
  formatVersion: number;
  passTypeIdentifier: string;
  serialNumber: string;
  teamIdentifier: string;
  webServiceURL?: string;
  authenticationToken?: string;
  organizationName: string;
  description: string;
  foregroundColor: string;
  backgroundColor: string;
  labelColor: string;
  eventTicket: {
    primaryFields: Array<{ key: string; label: string; value: string }>;
    secondaryFields: Array<{ key: string; label: string; value: string }>;
    auxiliaryFields: Array<{ key: string; label: string; value: string }>;
    backFields: Array<{ key: string; label: string; value: string }>;
  };
  barcodes: Array<{
    format: 'PKBarcodeFormatQR';
    message: string;
    messageEncoding: 'iso-8859-1' | 'utf-8';
    altText?: string;
  }>;
}

export interface GoogleWalletPassStructure {
  id: string;
  classId: string;
  state: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  cardTitle: { defaultValue: { language: string; value: string } };
  header: { defaultValue: { language: string; value: string } };
  subheader: { defaultValue: { language: string; value: string } };
  barcode: {
    type: 'QR_CODE';
    value: string;
    alternateText: string;
  };
}

export class WalletPassAdapter {
  /**
   * Generates Apple Wallet pass.json structure for native iOS wallet integration
   */
  public static generateApplePass(ticket: Ticket, livePayload: string, webServiceBaseUrl?: string): ApplePassStructure {
    return {
      formatVersion: 1,
      passTypeIdentifier: 'pass.com.trautslab.smartticketing',
      serialNumber: ticket.id,
      teamIdentifier: 'TRAUTSLAB99',
      webServiceURL: webServiceBaseUrl ? `${webServiceBaseUrl}/api/v1/passes` : undefined,
      authenticationToken: ticket.seedHex.substring(0, 32),
      organizationName: 'TrautsLab Smart Ticketing',
      description: ticket.eventName,
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(11, 15, 25)',
      labelColor: 'rgb(14, 165, 233)',
      eventTicket: {
        primaryFields: [
          { key: 'event', label: 'EVENTO', value: ticket.eventName }
        ],
        secondaryFields: [
          { key: 'venue', label: 'LUGAR', value: ticket.venue },
          { key: 'owner', label: 'TITULAR', value: ticket.ownerName }
        ],
        auxiliaryFields: [
          { key: 'section', label: 'SECCIÓN', value: ticket.section },
          { key: 'seat', label: 'ASIENTO', value: ticket.seat },
          { key: 'date', label: 'FECHA', value: new Date(ticket.eventDate).toLocaleDateString() }
        ],
        backFields: [
          { key: 'ticket_id', label: 'ID DE BOLETO', value: ticket.id },
          { key: 'status', label: 'ESTADO', value: ticket.status },
          { key: 'transfers', label: 'TRASPASOS', value: `${ticket.transferCount}/${ticket.maxTransfers}` },
          {
            key: 'terms',
            label: 'TÉRMINOS Y CONDICIONES',
            value: 'Entrada digital nominativa con código criptográfico rotativo. Prohibida la reventa por encima del valor facial.'
          }
        ]
      },
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: livePayload,
          messageEncoding: 'utf-8',
          altText: 'Código dinámico protegido contra capturas'
        }
      ]
    };
  }

  /**
   * Generates Google Wallet generic pass object
   */
  public static generateGoogleWalletPass(ticket: Ticket, livePayload: string): GoogleWalletPassStructure {
    return {
      id: `generic.${ticket.id}`,
      classId: `generic.trautslab_${ticket.eventId}`,
      state: ticket.status === 'ACTIVE' ? 'ACTIVE' : 'COMPLETED',
      cardTitle: { defaultValue: { language: 'es', value: ticket.eventName } },
      header: { defaultValue: { language: 'es', value: `${ticket.section} — ${ticket.seat}` } },
      subheader: { defaultValue: { language: 'es', value: ticket.ownerName } },
      barcode: {
        type: 'QR_CODE',
        value: livePayload,
        alternateText: 'Smart Ticket Dinámico'
      }
    };
  }
}
