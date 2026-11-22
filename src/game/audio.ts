class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private musicEnabled = false;
  private musicVolume = 0.35;
  private musicTimer: number | null = null;
  private musicStep = 0;

  private ambienceEnabled = false;
  private ambienceMode: 'ocean' | 'rain' = 'ocean';
  private ambienceVolume = 0.28;
  private ambienceSource: AudioBufferSourceNode | null = null;
  private ambienceGain: GainNode | null = null;
  private ambienceLfo: OscillatorNode | null = null;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx
        .resume()
        .then(() => {
          if (this.ambienceEnabled && !this.muted && !this.ambienceSource) {
            this.startAmbienceLoop();
          }
        })
        .catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
    if (this.ambienceEnabled && !this.muted) {
      this.startAmbienceLoop();
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopMusicLoop();
      this.stopAmbienceLoop();
    } else {
      if (this.musicEnabled) this.startMusicLoop();
      if (this.ambienceEnabled) this.startAmbienceLoop();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMusicConfig(enabled: boolean, volume: number): void {
    this.musicEnabled = enabled;
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (enabled && !this.muted) {
      this.startMusicLoop();
    } else {
      this.stopMusicLoop();
    }
  }

  public setAmbienceConfig(
    enabled: boolean,
    volume: number,
    mode: 'ocean' | 'rain' = this.ambienceMode
  ): void {
    const modeChanged = mode !== this.ambienceMode;
    this.ambienceEnabled = enabled;
    this.ambienceMode = mode;
    this.ambienceVolume = Math.max(0, Math.min(1, volume));
    if (modeChanged) {
      this.stopAmbienceLoop();
    } else if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setTargetAtTime(
        (this.ambienceMode === 'rain' ? 0.045 : 0.055) * this.ambienceVolume,
        this.ctx.currentTime,
        0.12
      );
    }
    if (enabled && !this.muted) {
      this.startAmbienceLoop();
    } else {
      this.stopAmbienceLoop();
    }
  }

  private startAmbienceLoop(): void {
    if (this.ambienceSource || typeof window === 'undefined') return;
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running') return;
    try {
      const length = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        data[i] =
          this.ambienceMode === 'rain'
            ? (lastOut + 0.08 * white) / 1.08
            : (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
      }

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = this.ambienceMode === 'rain' ? 'bandpass' : 'lowpass';
      filter.frequency.value = this.ambienceMode === 'rain' ? 920 : 380;

      const gain = ctx.createGain();
      gain.gain.value = (this.ambienceMode === 'rain' ? 0.045 : 0.055) * this.ambienceVolume;

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = this.ambienceMode === 'rain' ? 0.35 : 0.14;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = this.ambienceMode === 'rain' ? 140 : 180;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      src.start();
      lfo.start();
      this.ambienceSource = src;
      this.ambienceGain = gain;
      this.ambienceLfo = lfo;
    } catch {
      // Ignore WebAudio node creation errors in restricted environments
    }
  }

  private stopAmbienceLoop(): void {
    try {
      this.ambienceSource?.stop();
      this.ambienceLfo?.stop();
    } catch {
      // ignore
    }
    this.ambienceSource = null;
    this.ambienceGain = null;
    this.ambienceLfo = null;
  }

  private startMusicLoop(): void {
    if (this.musicTimer !== null || typeof window === 'undefined') return;
    const chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 349.23], // Fmaj7
      [196.0, 246.94, 293.66, 392.0], // G6
    ];

    this.musicTimer = window.setInterval(() => {
      if (!this.musicEnabled || this.muted) return;
      const ctx = this.ensureContext();
      if (!ctx || ctx.state !== 'running') return;
      const chord = chords[Math.floor(this.musicStep / 4) % chords.length];
      const note = chord[this.musicStep % 4];
      this.musicStep++;
      this.playTone(note, note, 0.36, 'sine', 0.045 * this.musicVolume, 0);
    }, 420);
  }

  private stopMusicLoop(): void {
    if (this.musicTimer !== null && typeof window !== 'undefined') {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playTone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playJump(isDouble: boolean): void {
    if (isDouble) {
      this.playTone(520, 980, 0.16, 'triangle', 0.11);
      this.playTone(780, 1320, 0.14, 'sine', 0.08, 0.04);
    } else {
      this.playTone(340, 680, 0.14, 'sine', 0.11);
    }
  }

  public playSlide(): void {
    this.playTone(420, 190, 0.14, 'triangle', 0.08);
  }

  public playTwirl(): void {
    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((n, idx) => {
      this.playTone(n, n * 1.06, 0.15, 'sine', 0.09, idx * 0.045);
    });
  }

  public playDiamond(combo: number): void {
    const semitone = Math.min(combo, 10);
    const base = 659.25 * Math.pow(1.059463, semitone);
    this.playTone(base, base * 1.25, 0.12, 'sine', 0.1);
  }

  public playCrown(): void {
    this.playTone(783.99, 783.99, 0.1, 'triangle', 0.1);
    this.playTone(987.77, 987.77, 0.11, 'triangle', 0.1, 0.06);
    this.playTone(1318.51, 1318.51, 0.18, 'sine', 0.11, 0.12);
  }

  public playHeart(): void {
    this.playTone(523.25, 659.25, 0.14, 'sine', 0.11);
    this.playTone(783.99, 1046.5, 0.2, 'sine', 0.11, 0.08);
  }

  public playWardrobeBox(): void {
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    chord.forEach((freq, idx) => {
      this.playTone(freq, freq, 0.22, 'triangle', 0.09, idx * 0.05);
    });
  }

  public playShatter(): void {
    this.playTone(880, 440, 0.12, 'square', 0.05);
    this.playTone(1174.66, 1567.98, 0.14, 'sine', 0.09, 0.03);
  }

  public playHit(): void {
    this.playTone(210, 82, 0.22, 'sawtooth', 0.09);
    this.playTone(140, 65, 0.24, 'triangle', 0.1, 0.02);
  }

  public playStageClear(): void {
    const melody = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
    melody.forEach((freq, idx) => {
      this.playTone(freq, freq, idx === melody.length - 1 ? 0.35 : 0.13, 'triangle', 0.11, idx * 0.09);
    });
  }

  public playVictory(): void {
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    fanfare.forEach((freq, idx) => {
      this.playTone(freq, freq, idx === fanfare.length - 1 ? 0.5 : 0.14, 'sine', 0.11, idx * 0.085);
    });
  }

  public playPickup(): void {
    this.playTone(440, 620, 0.08, 'sine', 0.07);
  }

  public playCorrectPlace(streak = 1): void {
    const pitch = 587.33 * Math.pow(1.05, Math.min(streak, 8));
    this.playTone(pitch, pitch * 1.25, 0.14, 'triangle', 0.1);
  }

  public playWrongPlace(): void {
    this.playTone(240, 165, 0.18, 'sawtooth', 0.06);
  }

  public playWheelTick(): void {
    this.playTone(900, 620, 0.04, 'triangle', 0.05);
  }

  public playCutePop(): void {
    this.playTone(540, 760, 0.075, 'sine', 0.065);
  }

  public playMagicDiscover(): void {
    const notes = [659.25, 830.61, 987.77, 1318.51];
    notes.forEach((f, idx) => {
      this.playTone(f, f * 1.04, 0.16, 'sine', 0.095, idx * 0.045);
    });
  }

  public playGentleWrong(): void {
    this.playTone(310, 235, 0.14, 'sine', 0.06);
  }

  public playClutterMove(): void {
    this.playTone(380, 510, 0.09, 'triangle', 0.06);
  }

  public playAssistantHint(): void {
    this.playTone(740, 987.77, 0.15, 'triangle', 0.08);
    this.playTone(987.77, 1174.66, 0.18, 'sine', 0.08, 0.08);
  }

  public playShimmerDiscover(): void {
    const harp = [659.25, 783.99, 987.77, 1318.51, 1567.98];
    harp.forEach((freq, idx) => {
      this.playTone(freq, freq * 1.015, 0.24, 'sine', 0.075, idx * 0.042);
    });
  }

  public playDrawerSlide(): void {
    this.playTone(220, 310, 0.11, 'triangle', 0.055);
    this.playTone(460, 520, 0.08, 'sine', 0.04, 0.05);
  }

  public playLampToggle(): void {
    this.playTone(620, 880, 0.06, 'sine', 0.055);
  }

  public playMirrorChime(): void {
    this.playTone(1046.5, 1174.66, 0.18, 'sine', 0.05);
    this.playTone(1567.98, 1760, 0.2, 'sine', 0.04, 0.05);
  }

  public playTimingGrade(perfect: boolean): void {
    if (perfect) {
      this.playTone(987.77, 1318.51, 0.08, 'triangle', 0.06);
      this.playTone(1318.51, 1567.98, 0.1, 'sine', 0.05, 0.045);
    } else {
      this.playTone(783.99, 987.77, 0.06, 'sine', 0.045);
    }
  }

  public playShutter(): void {
    this.playTone(1100, 320, 0.04, 'triangle', 0.06);
    this.playTone(680, 920, 0.05, 'sine', 0.04, 0.04);
  }

  public playWaterDrop(): void {
    this.playTone(580, 960, 0.09, 'sine', 0.055);
    this.playTone(760, 1180, 0.08, 'sine', 0.04, 0.05);
  }

  public playFlowerBloom(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      this.playTone(f, f * 1.03, 0.22, 'sine', 0.06, idx * 0.055);
    });
  }
}

export const soundEngine = new SoundEngine();
