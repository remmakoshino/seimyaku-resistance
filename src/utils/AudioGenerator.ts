// Web Audio API による BGM / SE 動的生成

export class AudioGenerator {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private seGain: GainNode | null = null;
  private currentBgm: OscillatorNode[] = [];

  init(): void {
    this.audioCtx = new AudioContext();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.audioCtx.destination);

    this.bgmGain = this.audioCtx.createGain();
    this.bgmGain.gain.value = 0.4;
    this.bgmGain.connect(this.masterGain);

    this.seGain = this.audioCtx.createGain();
    this.seGain.gain.value = 0.6;
    this.seGain.connect(this.masterGain);
  }

  private ensureContext(): AudioContext {
    if (!this.audioCtx) this.init();
    return this.audioCtx!;
  }

  // === SE ===
  playAttackSE(): void {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.seGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  playMagicSE(): void {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.seGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  }

  playHealSE(): void {
    const ctx = this.ensureContext();
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(this.seGain!);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.3);
    });
  }

  playDamageSE(): void {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.seGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  playVictorySE(): void {
    const ctx = this.ensureContext();
    const melody = [523, 659, 784, 1047, 784, 1047]; // C E G C' G C'
    const durations = [0.15, 0.15, 0.15, 0.3, 0.15, 0.4];
    let time = ctx.currentTime;
    melody.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + durations[i]);
      osc.connect(gain);
      gain.connect(this.seGain!);
      osc.start(time);
      osc.stop(time + durations[i]);
      time += durations[i];
    });
  }

  playAwakenSE(): void {
    const ctx = this.ensureContext();
    // 上昇するアルペジオ
    const notes = [262, 330, 392, 523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(this.seGain!);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.4);
    });
  }

  playCursorSE(): void {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.seGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }

  playConfirmSE(): void {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.seGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  // === BGM ===
  playTitleBGM(): void {
    this.stopBGM();
    const ctx = this.ensureContext();
    // シンプルなアンビエントBGM
    const melody = [262, 294, 330, 392, 330, 294, 262, 196];
    let noteIndex = 0;

    const playNote = (): void => {
      if (!this.audioCtx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = melody[noteIndex % melody.length];
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(this.bgmGain!);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
      this.currentBgm.push(osc);
      noteIndex++;

      // パッドサウンド
      const pad = ctx.createOscillator();
      const padGain = ctx.createGain();
      pad.type = 'sine';
      pad.frequency.value = melody[noteIndex % melody.length] / 2;
      padGain.gain.value = 0.03;
      pad.connect(padGain);
      padGain.connect(this.bgmGain!);
      pad.start(ctx.currentTime);
      pad.stop(ctx.currentTime + 0.8);

      setTimeout(playNote, 800);
    };
    playNote();
  }

  playBattleBGM(): void {
    this.stopBGM();
    const ctx = this.ensureContext();
    const bassLine = [131, 165, 147, 175]; // C3, E3, D3, F3
    let noteIndex = 0;

    const playBeat = (): void => {
      if (!this.audioCtx) return;
      // ベースライン
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = 'sawtooth';
      bass.frequency.value = bassLine[noteIndex % bassLine.length];
      bassGain.gain.setValueAtTime(0.06, ctx.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      bass.connect(bassGain);
      bassGain.connect(this.bgmGain!);
      bass.start(ctx.currentTime);
      bass.stop(ctx.currentTime + 0.4);
      this.currentBgm.push(bass);

      // ドラムキック
      const kick = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(150, ctx.currentTime);
      kick.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);
      kickGain.gain.setValueAtTime(0.15, ctx.currentTime);
      kickGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      kick.connect(kickGain);
      kickGain.connect(this.bgmGain!);
      kick.start(ctx.currentTime);
      kick.stop(ctx.currentTime + 0.1);

      noteIndex++;
      setTimeout(playBeat, 500);
    };
    playBeat();
  }

  playBossBGM(): void {
    this.stopBGM();
    const ctx = this.ensureContext();
    const bassLine = [110, 131, 147, 131]; // A2, C3, D3, C3
    let noteIndex = 0;

    const playBeat = (): void => {
      if (!this.audioCtx) return;
      // ヘビーベース
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = 'sawtooth';
      bass.frequency.value = bassLine[noteIndex % bassLine.length];
      bassGain.gain.setValueAtTime(0.08, ctx.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      bass.connect(bassGain);
      bassGain.connect(this.bgmGain!);
      bass.start(ctx.currentTime);
      bass.stop(ctx.currentTime + 0.35);
      this.currentBgm.push(bass);

      // ドラムキック（短い間隔）
      const kick = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(180, ctx.currentTime);
      kick.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.08);
      kickGain.gain.setValueAtTime(0.18, ctx.currentTime);
      kickGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      kick.connect(kickGain);
      kickGain.connect(this.bgmGain!);
      kick.start(ctx.currentTime);
      kick.stop(ctx.currentTime + 0.08);

      noteIndex++;
      setTimeout(playBeat, 400);
    };
    playBeat();
  }

  stopBGM(): void {
    for (const osc of this.currentBgm) {
      try { osc.stop(); } catch { /* already stopped */ }
    }
    this.currentBgm = [];
  }

  setMasterVolume(vol: number): void {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, vol));
  }

  resume(): void {
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  destroy(): void {
    this.stopBGM();
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}

// グローバルインスタンス
export const audioGenerator = new AudioGenerator();
