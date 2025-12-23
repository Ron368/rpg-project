import Phaser from 'phaser'
import ratRunURL from '../../assets/characters/enemies/Rat/Rat_Idle.png?url'
import ratAttackURL from '../../assets/characters/enemies/Rat/Rat_Attack.png?url'
import ratDeathURL from '../../assets/characters/enemies/Rat/Rat_Death.png?url'
import ratHitURL from '../../assets/characters/enemies/Rat/Rat_Hit.png?url'

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene')
    this.player = null
    this.monster = null
  }

  preload() {
    // Reuse the same player discovery approach as [`DungeonScene`](src/game/scenes/DungeonScene.js)
    const p1 = import.meta.glob('../../assets/player/*.{png,webp}', {
      eager: true,
      query: '?url',
      import: 'default',
    })
    const p2 = import.meta.glob('../../assets/characters/player/*.{png,webp}', {
      eager: true,
      query: '?url',
      import: 'default',
    })
    const playerSheetUrl = Object.values({ ...p1, ...p2 })[0]

    if (playerSheetUrl) {
      this.load.spritesheet('battle_player', playerSheetUrl, { frameWidth: 64, frameHeight: 64 })
    }

    this.load.spritesheet('battle_rat_idle', ratRunURL, { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('battle_rat_attack', ratAttackURL, { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('battle_rat_death', ratDeathURL, { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('battle_rat_hit', ratHitURL, { frameWidth: 64, frameHeight: 64 })
    
    this.load.on('complete', () => {
      const p = this.textures.get('battle_player')
      const r = this.textures.get('battle_rat_idle')
      if (p) p.setFilter(Phaser.Textures.FilterMode.NEAREST)
      if (r) r.setFilter(Phaser.Textures.FilterMode.NEAREST)
    })
  }

  create() {
    // simple “arena” baseline
    const w = this.scale.width
    const h = this.scale.height

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.25)
    this.add.rectangle(w / 2, h - 18, w - 24, 10, 0x56e0ff, 0.25)

    // sprites
    this.player = this.add.sprite(140, h - -10, 'battle_player', 0).setOrigin(0.5, 1)
    this.monster = this.add.sprite(w - 140, h - -10, 'battle_rat_idle', 0).setOrigin(0.5, 1)

    // scale similar to overworld; tweak as desired
    this.player.setScale(2.4)
    this.monster.setScale(2)
    this.monster.setFlipX(true)

    // animations (indices mirror usage in [`DungeonScene`](src/game/scenes/DungeonScene.js))
    if (!this.anims.exists('battle-player-idle')) {
      this.anims.create({
        key: 'battle-player-idle',
        frames: this.anims.generateFrameNumbers('battle_player', { start: 0, end: 4 }),
        frameRate: 6,
        repeat: -1,
      })
      this.anims.create({
        key: 'battle-player-attack',
        frames: this.anims.generateFrameNumbers('battle_player', { start: 32, end: 37 }),
        frameRate: 12,
        repeat: 0,
      })
      this.anims.create({
        key: 'battle-player-dead',
        frames: this.anims.generateFrameNumbers('battle_player', { start: 48, end: 54 }),
        frameRate: 8,
        repeat: 0,
      })
      this.anims.create({
        key: 'battle-player-hit',
        frames: this.anims.generateFrameNumbers('battle_player', { start: 40, end: 40 }),
        frameRate: 1,
        repeat: 0,
      })
    }

    if (!this.anims.exists('battle-rat-idle')) {
      this.anims.create({
        key: 'battle-rat-idle',
        frames: this.anims.generateFrameNumbers('battle_rat_idle', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1,
      })
      this.anims.create({
        key: 'battle-rat-attack',
        frames: this.anims.generateFrameNumbers('battle_rat_attack', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: 0,
      })
      this.anims.create({
        key: 'battle-rat-death',
        frames: this.anims.generateFrameNumbers('battle_rat_death', { start: 0, end: 4 }),
        frameRate: 10,
        repeat: 0,
      })
      this.anims.create({
        key: 'battle-rat-hit',
        frames: this.anims.generateFrameNumbers('battle_rat_hit', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: 0,
      })
    }

    this.player.play('battle-player-idle', true)
    this.monster.play('battle-rat-idle', true)
  }

  // --- External API (called from React) ---
  playPlayerAttack() {
    if (!this.player) return
    this.player.play('battle-player-attack', true)
    this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.player) this.player.play('battle-player-idle', true)
    })
  }

  playMonsterAttack() {
    if (!this.monster) return
    this.monster.play('battle-rat-attack', true)
    this.monster.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.monster) this.monster.play('battle-rat-idle', true)
    })
  }

  playPlayerHit() {
    if (!this.player) return
    this.player.play('battle-player-hit', true)
    this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.player) this.player.play('battle-player-idle', true)
    })
  }

  playMonsterHit() {
    if (!this.monster) return
    this.monster.play('battle-rat-hit', true)
    this.monster.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.monster) this.monster.play('battle-rat-idle', true)
    })
  }

  playPlayerDeath() {
    if (!this.player) return
    this.player.play('battle-player-dead', true)
  }

  playMonsterDeath() {
    if (!this.monster) return
    this.monster.play('battle-rat-death', true)
  }

  flashSprite(sprite, tint) {
    sprite.setTint(tint)
    this.time.delayedCall(120, () => sprite.clearTint())
  }
}