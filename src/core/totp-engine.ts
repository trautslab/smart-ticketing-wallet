import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export interface TotpResult {
  counter: number;
  counterHex: string;
  pin: string; // 8-digit decimal code
  authMac: string; // 16-character compact hex MAC
  remainingSeconds: number;
  timeStepSeconds: number;
  timestampMs: number;
}

export class TotpEngine {
  public static readonly DEFAULT_TIME_STEP_SECONDS = 15;

  /**
   * Generates a cryptographically strong 256-bit seed (64 hex characters)
   */
  public static generateSeed(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Calculates the 64-bit counter for a given timestamp and time-step
   */
  public static getCounter(timestampMs: number, stepSeconds: number = this.DEFAULT_TIME_STEP_SECONDS): number {
    return Math.floor(timestampMs / (stepSeconds * 1000));
  }

  /**
   * Calculates the remaining seconds before the current 15-second QR code rotates
   */
  public static getRemainingSeconds(timestampMs: number, stepSeconds: number = this.DEFAULT_TIME_STEP_SECONDS): number {
    const elapsedInCurrentStep = (timestampMs / 1000) % stepSeconds;
    const remaining = stepSeconds - elapsedInCurrentStep;
    return Math.max(0, Math.ceil(remaining));
  }

  /**
   * Computes HMAC-SHA256 for a given seed and 64-bit counter
   */
  public static computeHmac(seedHex: string, counter: number): Buffer {
    const key = Buffer.from(seedHex, 'hex');
    const counterBuf = Buffer.alloc(8);
    counterBuf.writeBigUInt64BE(BigInt(counter));
    return createHmac('sha256', key).update(counterBuf).digest();
  }

  /**
   * Generates the dynamic TOTP token and auth MAC for a given seed at a specific time
   */
  public static generateToken(
    seedHex: string,
    timestampMs: number = Date.now(),
    stepSeconds: number = this.DEFAULT_TIME_STEP_SECONDS
  ): TotpResult {
    const counter = this.getCounter(timestampMs, stepSeconds);
    const counterHex = counter.toString(16).padStart(16, '0');
    const hmac = this.computeHmac(seedHex, counter);

    // RFC 4226 Dynamic Truncation
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const pin = (binary % 100000000).toString().padStart(8, '0');
    const authMac = hmac.subarray(0, 8).toString('hex'); // First 8 bytes (16 hex chars)
    const remainingSeconds = this.getRemainingSeconds(timestampMs, stepSeconds);

    return {
      counter,
      counterHex,
      pin,
      authMac,
      remainingSeconds,
      timeStepSeconds: stepSeconds,
      timestampMs
    };
  }

  /**
   * Validates a candidate auth MAC with clock-drift tolerance (default +/- 1 step = +/- 15s)
   */
  public static verifyToken(
    seedHex: string,
    candidateMac: string,
    claimedCounter: number,
    allowedDriftWindows: number = 1,
    currentTimestampMs: number = Date.now(),
    stepSeconds: number = this.DEFAULT_TIME_STEP_SECONDS
  ): { valid: boolean; matchedWindow?: number } {
    const currentCounter = this.getCounter(currentTimestampMs, stepSeconds);

    for (let offset = -allowedDriftWindows; offset <= allowedDriftWindows; offset++) {
      const targetCounter = currentCounter + offset;
      if (targetCounter === claimedCounter) {
        const expectedHmac = this.computeHmac(seedHex, targetCounter);
        const expectedMac = expectedHmac.subarray(0, 8).toString('hex').toLowerCase();
        const candidateNorm = candidateMac.toLowerCase();
        const expectedBuf = Buffer.from(expectedMac, 'utf-8');
        const candidateBuf = Buffer.from(candidateNorm, 'utf-8');
        if (expectedBuf.length === candidateBuf.length && timingSafeEqual(expectedBuf, candidateBuf)) {
          return { valid: true, matchedWindow: offset };
        }
      }
    }

    return { valid: false };
  }
}
