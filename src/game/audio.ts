/**
 * Procedural Web Audio API sound generator for Spider-Man NYC Web-Slinger 3D.
 * 100% synthesized in real time with zero external audio assets.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private whooshGain: GainNode | null = null;
  private whooshFilter: BiquadFilterNode | null = null;
  private whooshSource: AudioBufferSourceNode | null = null;
  private initialized: boolean = false;

  constructor() {
    // Respect saved mute preference
    const saved = localStorage.getItem('spiderman_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
  }

  public init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.7;
      this.masterGain.connect(this.ctx.destination);

      this.setupContinuousWhoosh();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not available', e);
    }
  }

  private ensureRunning() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private setupContinuousWhoosh() {
    if (!this.ctx || !this.masterGain) return;

    // Generate 3 seconds of looping white/pink noise buffer
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise approximation
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.3;
    }

    this.whooshSource = this.ctx.createBufferSource();
    this.whooshSource.buffer = noiseBuffer;
    this.whooshSource.loop = true;

    this.whooshFilter = this.ctx.createBiquadFilter();
    this.whooshFilter.type = 'lowpass';
    this.whooshFilter.frequency.value = 250;
    this.whooshFilter.Q.value = 1.2;

    this.whooshGain = this.ctx.createGain();
    this.whooshGain.gain.value = 0.001;

    this.whooshSource.connect(this.whooshFilter);
    this.whooshFilter.connect(this.whooshGain);
    this.whooshGain.connect(this.masterGain);

    this.whooshSource.start(0);
  }

  /**
   * Updates wind whoosh intensity dynamically based on player speed (0 to 120+ mph)
   */
  public updateSpeedWhoosh(speedMph: number) {
    if (!this.whooshGain || !this.whooshFilter || !this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const norm = Math.max(0, Math.min(1, (speedMph - 15) / 90));
    
    // Smooth ramp
    const targetGain = norm > 0.05 ? norm * 0.55 : 0.001;
    const targetFreq = 200 + norm * 2400;

    this.whooshGain.gain.setTargetAtTime(targetGain, now, 0.08);
    this.whooshFilter.frequency.setTargetAtTime(targetFreq, now, 0.08);
  }

  /**
   * Iconic Spider-Man "THWIP!" web shoot sound
   */
  public playWebShoot() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // High frequency filtered noise burst + sharp pitch drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.12);
    filter.Q.value = 3.5;

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);

    // Add high-frequency whip snap
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'sawtooth';
    snapOsc.frequency.setValueAtTime(3200, now);
    snapOsc.frequency.exponentialRampToValueAtTime(300, now + 0.06);

    snapGain.gain.setValueAtTime(0.3, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    snapOsc.connect(snapGain);
    snapGain.connect(this.masterGain);
    snapOsc.start(now);
    snapOsc.stop(now + 0.07);
  }

  /**
   * Web latch impact when attaching to building facade
   */
  public playWebLatch() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Web release spring pop
   */
  public playWebRelease() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.09);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  /**
   * Web-Zip / Point launch slingshot
   */
  public playWebZip() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.22);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(3500, now + 0.22);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  /**
   * Jump / acrobatics leap
   */
  public playJump() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Wall run scuff steps
   */
  public playWallStep() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.05);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Spider-Sense tingling warning alert
   */
  public playSpiderSense() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // High shimmer vibrating tones
    [880, 1100, 1320].forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      
      gain.gain.setValueAtTime(0.15, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.2);
    });
  }

  /**
   * Landmark Discovered fanfare
   */
  public playLandmarkDiscovered() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [392.00, 523.25, 659.25, 783.99]; // G4, C5, E5, G5 heroic chord
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.25, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.65);
    });
  }

  /**
   * Collectible pickup chime
   */
  public playCollect() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);

      gain.gain.setValueAtTime(0.2, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.38);
    });
  }

  /**
   * Ring challenge gate pass sound
   */
  public playRingPassed() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * Heavy impact / landing
   */
  public playImpact(force: number = 1) {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    const amp = Math.min(0.5, 0.15 + force * 0.25);
    gain.gain.setValueAtTime(amp, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.7;
    }
    localStorage.setItem('spiderman_muted', String(this.isMuted));
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const sound = new SoundEngine();
