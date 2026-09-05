// Web Audio API Procedural Retro Sound Engine
// Zero external audio files needed - pure synthesized 8-bit / 16-bit sound effects & chiptune music!

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.isMuted = false;
    this.currentTrack = null;
    this.musicTimer = null;
    this.tempo = 130;
    this.step = 0;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      if (typeof window === 'undefined') {
        this.initialized = true;
        return;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio could not be initialized:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // --- Sound Effects ---

  playTone(freq, type, duration, gain = 0.5, slideFreq = null) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = type;
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(freq, now);

    if (slideFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideFreq), now + duration);
    }

    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(g);
    g.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  playNoise(duration, gain = 0.4, isExplosion = false) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown/Pink noise for explosions, white for swoosh
      if (isExplosion) {
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      } else {
        data[i] = white * 0.3;
      }
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = isExplosion ? 'lowpass' : 'bandpass';
    filter.frequency.setValueAtTime(isExplosion ? 380 : 1200, this.ctx.currentTime);

    const g = this.ctx.createGain();
    const now = this.ctx.currentTime;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);

    noise.start(now);
  }

  swordSlash(combo = 0) {
    const freqs = [350, 480, 620];
    const freq = freqs[combo % freqs.length];
    this.playTone(freq, 'sawtooth', 0.12, 0.4, freq * 0.4);
    this.playNoise(0.09, 0.25);
  }

  swordHit() {
    this.playTone(880, 'square', 0.06, 0.6, 220);
    this.playNoise(0.08, 0.5, true);
  }

  spinCharge() {
    this.playTone(220, 'sine', 0.2, 0.3, 550);
  }

  spinRelease() {
    this.playTone(660, 'sawtooth', 0.25, 0.6, 180);
    this.playNoise(0.2, 0.5);
  }

  bowShoot() {
    this.playTone(700, 'triangle', 0.1, 0.5, 200);
    this.playNoise(0.08, 0.2);
  }

  shieldBlock() {
    this.playTone(1200, 'square', 0.08, 0.6, 300);
    this.playTone(1800, 'triangle', 0.04, 0.4);
  }

  dodgeRoll() {
    this.playNoise(0.18, 0.35);
    this.playTone(320, 'sine', 0.14, 0.25, 120);
  }

  playerHurt() {
    this.playTone(280, 'square', 0.2, 0.7, 70);
    this.playNoise(0.15, 0.4, true);
  }

  enemyHurt() {
    this.playTone(440, 'triangle', 0.1, 0.4, 150);
  }

  enemyDeath() {
    this.playTone(350, 'sawtooth', 0.25, 0.5, 60);
    this.playNoise(0.2, 0.4, true);
  }

  grassCut() {
    this.playTone(850, 'sine', 0.07, 0.3, 400);
    this.playNoise(0.06, 0.3);
  }

  potSmash() {
    this.playTone(950, 'square', 0.05, 0.4, 300);
    this.playNoise(0.15, 0.5, true);
  }

  rupee(value = 1) {
    const base = value >= 20 ? 880 : value >= 5 ? 740 : 587;
    this.playTone(base, 'triangle', 0.08, 0.45);
    setTimeout(() => {
      this.playTone(base * 1.5, 'triangle', 0.12, 0.45);
    }, 60);
  }

  heart() {
    this.playTone(523, 'sine', 0.09, 0.5);
    setTimeout(() => {
      this.playTone(659, 'sine', 0.12, 0.5);
      setTimeout(() => {
        this.playTone(784, 'sine', 0.15, 0.5);
      }, 70);
    }, 70);
  }

  chestFanfare() {
    const notes = [
      { f: 392, d: 0.1 }, // G4
      { f: 523, d: 0.1 }, // C5
      { f: 659, d: 0.1 }, // E5
      { f: 784, d: 0.12 },// G5
      { f: 987, d: 0.15 },// B5
      { f: 1046, d: 0.45 } // C6
    ];
    let time = 0;
    notes.forEach(n => {
      setTimeout(() => {
        this.playTone(n.f, 'triangle', n.d, 0.6);
        this.playTone(n.f * 0.5, 'sawtooth', n.d * 0.8, 0.3);
      }, time * 1000);
      time += n.d + 0.04;
    });
  }

  puzzleSolved() {
    const notes = [784, 740, 622, 440, 415, 330, 415, 523];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.14, 0.5);
      }, idx * 110);
    });
  }

  bossSlam() {
    this.playTone(120, 'sawtooth', 0.4, 0.8, 30);
    this.playNoise(0.5, 0.8, true);
  }

  bossRoar() {
    this.playTone(90, 'sawtooth', 0.6, 0.7, 45);
    this.playNoise(0.4, 0.6, true);
  }

  // --- Dynamic Chiptune Music Engine ---

  playMusic(trackName) {
    if (this.currentTrack === trackName) return;
    this.stopMusic();
    this.currentTrack = trackName;
    this.step = 0;

    if (!this.initialized) return;

    if (trackName === 'village') {
      this.tempo = 115;
      this.startMusicLoop(this.playVillageStep.bind(this));
    } else if (trackName === 'overworld') {
      this.tempo = 135;
      this.startMusicLoop(this.playOverworldStep.bind(this));
    } else if (trackName === 'boss') {
      this.tempo = 150;
      this.startMusicLoop(this.playBossStep.bind(this));
    }
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.currentTrack = null;
  }

  startMusicLoop(stepFn) {
    const intervalMs = (60 / this.tempo / 4) * 1000; // 16th notes
    this.musicTimer = setInterval(() => {
      if (!this.isMuted && this.ctx && this.ctx.state === 'running') {
        stepFn(this.step);
      }
      this.step++;
    }, intervalMs);
  }

  playNote(freq, type, dur, gain = 0.25) {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(g);
    g.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + dur);
  }

  // Peaceful Village Theme (C Major Pentatonic)
  playVillageStep(s) {
    const melody = [
      523, 0, 587, 0, 659, 0, 784, 0, 659, 0, 587, 0, 523, 0, 0, 0,
      440, 0, 523, 0, 587, 0, 659, 0, 587, 0, 440, 0, 392, 0, 0, 0,
      523, 0, 659, 0, 784, 0, 880, 0, 784, 0, 659, 0, 587, 0, 0, 0,
      523, 587, 659, 784, 659, 587, 523, 440, 523, 0, 0, 0, 0, 0, 0, 0
    ];
    const bass = [
      130, 0, 0, 0, 196, 0, 0, 0, 130, 0, 0, 0, 196, 0, 0, 0,
      110, 0, 0, 0, 164, 0, 0, 0, 98, 0, 0, 0, 146, 0, 0, 0,
      130, 0, 0, 0, 196, 0, 0, 0, 110, 0, 0, 0, 164, 0, 0, 0,
      130, 0, 164, 0, 196, 0, 164, 0, 130, 0, 0, 0, 130, 0, 0, 0
    ];

    const idx = s % melody.length;
    if (melody[idx]) {
      this.playNote(melody[idx], 'triangle', 0.16, 0.22);
    }
    if (bass[idx]) {
      this.playNote(bass[idx], 'sawtooth', 0.2, 0.12);
    }
  }

  // Adventurous Overworld (Koholint/Zelda-esque)
  playOverworldStep(s) {
    const melody = [
      440, 0, 440, 0, 440, 0, 440, 523, 587, 0, 659, 0, 587, 0, 523, 0,
      440, 0, 392, 0, 440, 0, 0, 0, 523, 0, 587, 0, 659, 0, 784, 0,
      880, 0, 784, 0, 659, 0, 587, 0, 659, 0, 587, 0, 523, 0, 440, 0,
      523, 0, 587, 0, 659, 0, 784, 0, 880, 0, 0, 0, 880, 0, 0, 0
    ];
    const bass = [
      110, 0, 110, 0, 164, 0, 164, 0, 146, 0, 146, 0, 130, 0, 130, 0,
      110, 0, 98, 0, 110, 0, 110, 0, 130, 0, 146, 0, 164, 0, 196, 0,
      220, 0, 196, 0, 164, 0, 146, 0, 164, 0, 146, 0, 130, 0, 110, 0,
      130, 0, 146, 0, 164, 0, 196, 0, 220, 0, 110, 0, 220, 0, 110, 0
    ];

    const idx = s % melody.length;
    if (melody[idx]) {
      this.playNote(melody[idx], 'square', 0.12, 0.18);
    }
    if (bass[idx]) {
      this.playNote(bass[idx], 'triangle', 0.14, 0.15);
    }
    if (s % 4 === 2) {
      this.playNoise(0.04, 0.08); // hi-hat
    }
  }

  // Intense Boss Fight Theme
  playBossStep(s) {
    const bassline = [
      73, 73, 110, 73, 82, 73, 110, 73,
      65, 65, 98, 65, 73, 65, 98, 65,
      55, 55, 82, 55, 65, 55, 82, 55,
      82, 82, 123, 82, 98, 82, 123, 82
    ];
    const lead = [
      0, 293, 0, 329, 0, 370, 0, 440,
      0, 392, 0, 370, 0, 329, 0, 293,
      0, 220, 0, 246, 0, 261, 0, 293,
      0, 329, 0, 370, 0, 440, 0, 587
    ];

    const bIdx = s % bassline.length;
    this.playNote(bassline[bIdx], 'sawtooth', 0.1, 0.2);

    if (lead[bIdx] && (s % 2 === 1)) {
      this.playNote(lead[bIdx], 'square', 0.14, 0.22);
    }

    if (s % 4 === 0) {
      this.playNoise(0.08, 0.25, true); // kick
    } else if (s % 4 === 2) {
      this.playNoise(0.06, 0.2); // snare
    }
  }
}

export const sound = new SoundEngine();
