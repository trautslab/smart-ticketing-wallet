import jsQR from 'jsqr';

export interface OpticalQrScannerOptions {
  videoElement: HTMLVideoElement;
  onScan: (qrPayload: string) => void;
  onError?: (error: Error) => void;
  scanIntervalMs?: number;
}

export class OpticalQrScanner {
  private video: HTMLVideoElement;
  private onScan: (qrPayload: string) => void;
  private onError?: (error: Error) => void;
  private scanIntervalMs: number;
  private stream: MediaStream | null = null;
  private isScanning: boolean = false;
  private animationFrameId: number | null = null;
  private lastScanTimestamp: number = 0;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private barcodeDetector: any = null;
  private isTorchOn: boolean = false;

  constructor(options: OpticalQrScannerOptions) {
    this.video = options.videoElement;
    this.onScan = options.onScan;
    this.onError = options.onError;
    this.scanIntervalMs = options.scanIntervalMs ?? 100;

    // Check for native BarcodeDetector API
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        this.barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code']
        });
      } catch {
        this.barcodeDetector = null;
      }
    }
  }

  /**
   * Start camera stream and begin real-time optical scanning
   */
  public async start(): Promise<void> {
    if (this.isScanning) return;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Cámara no compatible con este navegador o conexión HTTP no segura.');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      this.video.srcObject = this.stream;
      this.video.setAttribute('playsinline', 'true');
      await this.video.play();

      this.isScanning = true;
      this.initOffscreenCanvas();
      this.scanLoop();
    } catch (err: any) {
      this.onError?.(err);
      throw err;
    }
  }

  /**
   * Stop camera stream and scanning loop
   */
  public stop(): void {
    this.isScanning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }
    this.isTorchOn = false;
  }

  /**
   * Toggle flashlight/torch on mobile cameras that support it
   */
  public async toggleTorch(): Promise<boolean> {
    if (!this.stream) return false;
    const track = this.stream.getVideoTracks()[0];
    if (!track) return false;

    try {
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities && capabilities.torch) {
        this.isTorchOn = !this.isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: this.isTorchOn }]
        });
        return this.isTorchOn;
      }
    } catch {
      // Torch not supported on this device/browser
    }
    return false;
  }

  public getTorchState(): boolean {
    return this.isTorchOn;
  }

  public isActive(): boolean {
    return this.isScanning;
  }

  private initOffscreenCanvas(): void {
    if (typeof document !== 'undefined' && !this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }
  }

  /**
   * High-speed frame inspection loop
   */
  private scanLoop = async (): Promise<void> => {
    if (!this.isScanning) return;

    const now = performance.now();
    if (now - this.lastScanTimestamp >= this.scanIntervalMs) {
      this.lastScanTimestamp = now;

      if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
        try {
          let detectedQr: string | null = null;

          // 1. Hardware accelerated native BarcodeDetector (Chrome Android / modern browsers)
          if (this.barcodeDetector) {
            const barcodes = await this.barcodeDetector.detect(this.video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              detectedQr = barcodes[0].rawValue;
            }
          }

          // 2. Fallback: Pure JS QR reader (jsQR) with canvas context
          if (!detectedQr && this.canvas && this.ctx) {
            const width = this.video.videoWidth;
            const height = this.video.videoHeight;

            if (width > 0 && height > 0) {
              if (this.canvas.width !== width || this.canvas.height !== height) {
                this.canvas.width = width;
                this.canvas.height = height;
              }

              this.ctx.drawImage(this.video, 0, 0, width, height);
              const imageData = this.ctx.getImageData(0, 0, width, height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
              });

              if (code && code.data) {
                detectedQr = code.data;
              }
            }
          }

          if (detectedQr) {
            this.onScan(detectedQr);
          }
        } catch {
          // Ignore individual frame errors in loop
        }
      }
    }

    if (this.isScanning) {
      this.animationFrameId = requestAnimationFrame(this.scanLoop);
    }
  };
}
