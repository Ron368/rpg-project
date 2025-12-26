const FILES = {
  bgm: {
    overworld: '/assets/audio/overworld_bgm.mp3',
    battle: '/assets/audio/battle_bgm.mp3',

    golemBoss: '/assets/audio/boss.mp3',

    victory: '/assets/audio/victory.mp3',
    defeat: '/assets/audio/defeat.mp3',
  },
  sfx: {
    hit: '/assets/audio/hitHurt.wav',
    attack: '/assets/audio/swordSlash.wav',
    death: '/assets/audio/death.wav',
  },
};

class AudioManager {
  constructor() {
    this._unlocked = false;
    this._muted = false;

    this._bgmOverworld = null;
    this._bgmBattle = null;

    this._bgmGolemBoss = null;

    this._bgmVictory = null;
    this._bgmDefeat = null;

    this.bgmVolume = 0.35;
    this.sfxVolume = 0.7;
  }

  _makeBgm(src) {
    const a = new Audio(src);
    a.loop = true;
    a.preload = 'auto';
    a.volume = this._muted ? 0 : this.bgmVolume;
    return a;
  }

  unlock() {
    if (this._unlocked) return;

    this._bgmOverworld = this._makeBgm(FILES.bgm.overworld);
    this._bgmBattle = this._makeBgm(FILES.bgm.battle);
    
    this._bgmGolemBoss = this._makeBgm(FILES.bgm.golemBoss);
    
    this._bgmVictory = this._makeBgm(FILES.bgm.victory);
    this._bgmDefeat = this._makeBgm(FILES.bgm.defeat);

    this._unlocked = true;
  }

  setMuted(muted) {
    this._muted = !!muted;
    const v = this._muted ? 0 : this.bgmVolume;

    if (this._bgmOverworld) this._bgmOverworld.volume = v;
    if (this._bgmBattle) this._bgmBattle.volume = v;

    if (this._bgmGolemBoss) this._bgmGolemBoss.volume = v;
    
    if (this._bgmVictory) this._bgmVictory.volume = v;
    if (this._bgmDefeat) this._bgmDefeat.volume = v;
  }

  // Ensure only one BGM plays at once
  _pauseAllExcept(except) {
    for (const a of [
      this._bgmOverworld,
      this._bgmBattle,
      this._bgmGolemBoss,
      this._bgmVictory,
      this._bgmDefeat,
    ]) {
      if (!a || a === except) continue;
      if (!a.paused) a.pause();
    }
  }

  async playOverworldBgm() {
    if (!this._unlocked) return;
    this._pauseAllExcept(this._bgmOverworld);
    if (this._bgmOverworld && this._bgmOverworld.paused) {
      try { await this._bgmOverworld.play(); } catch (_) {}
    }
  }

  async playBattleBgm() {
    if (!this._unlocked) return;
    this._pauseAllExcept(this._bgmBattle);
    if (this._bgmBattle && this._bgmBattle.paused) {
      try { await this._bgmBattle.play(); } catch (_) {}
    }
  }

  async playGolemBossBgm() {
    if (!this._unlocked) return;
    this._pauseAllExcept(this._bgmGolemBoss);
    if (this._bgmGolemBoss && this._bgmGolemBoss.paused) {
      try { await this._bgmGolemBoss.play(); } catch (_) {}
    }
  }

  async playVictoryBgm() {
    if (!this._unlocked) return;
    this._pauseAllExcept(this._bgmVictory);
    if (this._bgmVictory) {
      this._bgmVictory.currentTime = 0;
      try { await this._bgmVictory.play(); } catch (_) {}
    }
  }

  async playDefeatBgm() {
    if (!this._unlocked) return;
    this._pauseAllExcept(this._bgmDefeat);
    if (this._bgmDefeat) {
      this._bgmDefeat.currentTime = 0;
      try { await this._bgmDefeat.play(); } catch (_) {}
    }
  }

  stopAllBgm() {
    for (const a of [
      this._bgmOverworld,
      this._bgmBattle,
      this._bgmGolemBoss,
      this._bgmVictory,
      this._bgmDefeat,
    ]) {
      if (!a) continue;
      a.pause();
      a.currentTime = 0;
    }
  }

  playSfx(name) {
    if (!this._unlocked || this._muted) return;
    const src = FILES.sfx[name];
    if (!src) return;

    const a = new Audio(src);
    a.preload = 'auto';
    a.volume = this.sfxVolume;
    a.play().catch(() => {});
  }
}

export const audioManager = new AudioManager();
export const audioFiles = FILES;