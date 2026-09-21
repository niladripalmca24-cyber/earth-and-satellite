// Procedural Web Audio API sound generator for aerospace HUD sound effects

class AudioService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const autoUnlock = () => {
        this.init();
        if (this.ctx && this.ctx.state === 'running') {
          this.isUnlocked = true;
          window.removeEventListener('pointerdown', autoUnlock);
          window.removeEventListener('keydown', autoUnlock);
          window.removeEventListener('touchstart', autoUnlock);
        }
      };
      window.addEventListener('pointerdown', autoUnlock, { passive: true });
      window.addEventListener('keydown', autoUnlock, { passive: true });
      window.addEventListener('touchstart', autoUnlock, { passive: true });
      window.addEventListener('load', autoUnlock, { passive: true });
    }
  }

  public acceptAllPermissions(): boolean {
    this.init();
    this.muted = false;
    this.isUnlocked = true;
    return true;
  }

  public getPermissionsGranted(): boolean {
    return this.isUnlocked || (this.ctx !== null && this.ctx.state === 'running');
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public getMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  public playHover() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch {
      // AudioContext error suppressed
    }
  }

  public playSelect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // AudioContext error suppressed
    }
  }

  public playLockOn() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [1200, 1500, 2000].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.05, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.08);
      });
    } catch {
      // AudioContext error suppressed
    }
  }

  public playWarp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {
      // AudioContext error suppressed
    }
  }

  public playEnterExperience() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Deep sub boom
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(90, now);
      osc1.frequency.exponentialRampToValueAtTime(35, now + 1.2);

      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 1.2);

      // Shimmering chord
      [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.2);

        gain.gain.setValueAtTime(0.04, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + 0.2);
        osc.stop(now + 1.5);
      });
    } catch {
      // AudioContext error suppressed
    }
  }
}

export const audio = new AudioService();
