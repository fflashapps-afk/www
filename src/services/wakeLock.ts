/**
 * Web Screen Wake Lock Service ("Ekran O'chmasin")
 * Keeps the mobile / PC display awake while audio is streaming or playing.
 */

type WakeLockChangeListener = (isActive: boolean) => void;

class WakeLockManager {
  private wakeLockSentinel: any = null;
  private isRequestedByUser: boolean = true;
  private listeners: Set<WakeLockChangeListener> = new Set();
  private fallbackAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isRequestedByUser) {
          this.acquireWakeLock();
        }
      });
    }
  }

  public subscribe(listener: WakeLockChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.isActive());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const active = this.isActive();
    this.listeners.forEach((listener) => listener(active));
  }

  public isActive(): boolean {
    return !!this.wakeLockSentinel && !this.wakeLockSentinel.released;
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }

  public async acquireWakeLock(): Promise<boolean> {
    this.isRequestedByUser = true;

    // Standard Screen Wake Lock API
    if (this.isSupported()) {
      try {
        if (this.wakeLockSentinel && !this.wakeLockSentinel.released) {
          this.notify();
          return true;
        }

        const sentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel = sentinel;

        sentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
          this.notify();
        });

        this.notify();
        return true;
      } catch (err: any) {
        console.warn('Wake Lock request failed, using fallback:', err.message);
      }
    }

    // Fallback: subtle inaudible media playback for mobile browsers
    this.startFallbackKeepAwake();
    this.notify();
    return true;
  }

  public async releaseWakeLock(): Promise<void> {
    this.isRequestedByUser = false;

    if (this.wakeLockSentinel) {
      try {
        await this.wakeLockSentinel.release();
      } catch {
        // ignore
      }
      this.wakeLockSentinel = null;
    }

    this.stopFallbackKeepAwake();
    this.notify();
  }

  public toggle(): Promise<boolean> {
    if (this.isActive()) {
      this.releaseWakeLock();
      return Promise.resolve(false);
    } else {
      return this.acquireWakeLock();
    }
  }

  private startFallbackKeepAwake() {
    if (typeof document === 'undefined') return;
    if (!this.fallbackAudio) {
      // 0.1s silence base64 WAV
      const silenceBase64 =
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
      this.fallbackAudio = new Audio(silenceBase64);
      this.fallbackAudio.loop = true;
      this.fallbackAudio.volume = 0.01;
    }
    this.fallbackAudio.play().catch(() => {
      // Autoplay might need user gesture
    });
  }

  private stopFallbackKeepAwake() {
    if (this.fallbackAudio) {
      this.fallbackAudio.pause();
    }
  }
}

export const wakeLockService = new WakeLockManager();
