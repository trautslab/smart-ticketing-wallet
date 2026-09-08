import { TotpEngine } from './totp-engine.js';
import { QrPayload } from '../types/index.js';

export class QrPayloadEncoder {
  public static readonly PREFIX = 'STK';

  /**
   * Generates a full QrPayload structure for a given ticket and seed
   */
  public static encode(
    ticketId: string,
    seedHex: string,
    timestampMs: number = Date.now(),
    stepSeconds: number = TotpEngine.DEFAULT_TIME_STEP_SECONDS
  ): QrPayload {
    const totp = TotpEngine.generateToken(seedHex, timestampMs, stepSeconds);
    const rawPayload = `${this.PREFIX}:${ticketId}:${totp.counterHex}:${totp.authMac}`;

    return {
      ticketId,
      counter: totp.counter,
      counterHex: totp.counterHex,
      authMac: totp.authMac,
      rawPayload,
      generatedAtMs: timestampMs,
      remainingSeconds: totp.remainingSeconds,
      timeStepSeconds: stepSeconds
    };
  }

  /**
   * Parses a raw QR scan string into component parts
   * Format: STK:<ticketId>:<counterHex>:<authMac>
   */
  public static decode(rawPayload: string): {
    ticketId: string;
    counter: number;
    counterHex: string;
    authMac: string;
  } {
    const parts = rawPayload.split(':');
    if (parts.length !== 4 || parts[0] !== this.PREFIX) {
      throw new Error(`Invalid QR payload format. Expected '${this.PREFIX}:<ticketId>:<counterHex>:<mac>', got: ${rawPayload}`);
    }

    const ticketId = parts[1];
    const counterHex = parts[2];
    const authMac = parts[3];

    const counter = parseInt(counterHex, 16);
    if (Number.isNaN(counter)) {
      throw new Error(`Invalid counter in QR payload: ${counterHex}`);
    }

    return {
      ticketId,
      counter,
      counterHex,
      authMac
    };
  }
}
