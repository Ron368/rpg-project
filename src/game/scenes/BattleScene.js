import Phaser from 'phaser'
import ratRunURL from '../../assets/characters/enemies/Rat/Rat_Idle.png?url'
import ratAttackURL from '../../assets/characters/enemies/Rat/Rat_Attack.png?url'
import ratDeathURL from '../../assets/characters/enemies/Rat/Rat_Death.png?url'
import ratHitURL from '../../assets/characters/enemies/Rat/Rat_Hit.png?url'
import slimeRunURL from '../../assets/characters/enemies/Slime/Slime_Spiked_Idle.png?url'
import slimeAttackURL from '../../assets/characters/enemies/Slime/Slime_Spiked_Jump.png?url'
import slimeDeathURL from '../../assets/characters/enemies/Slime/Slime_Spiked_Death.png?url'
import slimeHitURL from '../../assets/characters/enemies/Slime/Slime_Spiked_Hit.png?url'

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene')
    this.player = null
    this.monster = null
    this.monsterType = 'rat'
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

    
    this.load.spritesheet('battle_slime_idle', slimeRunURL, { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('battle_slime_attack', slimeAttackURL, { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('battle_slime_death', slimeDeathURL, { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('battle_slime_hit', slimeHitURL, { frameWidth: 64, frameHeight: 64 })

    this.load.on('complete', () => {
      const p = this.textures.get('battle_player')
      const r = this.textures.get('battle_rat_idle')
      const s = this.textures.get('battle_slime_idle')
      if (p) p.setFilter(Phaser.Textures.FilterMode.NEAREST)
      if (r) r.setFilter(Phaser.Textures.FilterMode.NEAREST)
      if (s) s.setFilter(Phaser.Textures.FilterMode.NEAREST)
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

    if (!this.anims.exists('battle-slime-idle')) {
      this.anims.create({
        key: 'battle-slime-idle',
        frames: this.anims.generateFrameNumbers('battle_slime_idle', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      })
      this.anims.create({
        key: 'battle-slime-attack',
        frames: this.anims.generateFrameNumbers('battle_slime_attack', { start: 0, end: 7 }),
        frameRate: 16,
        repeat: 0,
      })
      this.anims.create({
        key: 'battle-slime-hit',
        frames: this.anims.generateFrameNumbers('battle_slime_hit', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: 0,
      })
      this.anims.create({
        key: 'battle-slime-death',
        frames: this.anims.generateFrameNumbers('battle_slime_death', { start: 0, end: 5 }),
        frameRate: 8,
        repeat: 0,
      })
    }

    this.player.play('battle-player-idle', true)

    // Ensure correct monster visuals on initial mount
    this.setMonsterType(this.monsterType)
  }

  // Called from React via BattleStage
  setMonsterType(type) {
    const next = (type === 'slime' || type === 'rat') ? type : 'rat'
    this.monsterType = next

    if (!this.monster) return

    if (next === 'slime') {
      this.monster.setTexture('battle_slime_idle', 0)
      this.monster.play('battle-slime-idle', true)
      this.monster.setFlipX(true)
    } else {
      this.monster.setTexture('battle_rat_idle', 0)
      this.monster.play('battle-rat-idle', true)
      this.monster.setFlipX(true)
    }
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
    const atkKey = this.monsterType === 'slime' ? 'battle-slime-attack' : 'battle-rat-attack'
    const idleKey = this.monsterType === 'slime' ? 'battle-slime-idle' : 'battle-rat-idle'

    this.monster.play(atkKey, true)
    this.monster.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.monster) this.monster.play(idleKey, true)
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
    const hitKey = this.monsterType === 'slime' ? 'battle-slime-hit' : 'battle-rat-hit'
    const idleKey = this.monsterType === 'slime' ? 'battle-slime-idle' : 'battle-rat-idle'

    this.monster.play(hitKey, true)
    this.monster.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.monster) this.monster.play(idleKey, true)
    })
  }

  playPlayerDeath() {
    if (!this.player) return
    this.player.play('battle-player-dead', true)
  }

  playMonsterDeath() {
    if (!this.monster) return
    const deathKey = this.monsterType === 'slime' ? 'battle-slime-death' : 'battle-rat-death'
    this.monster.play(deathKey, true)
  }

  flashSprite(sprite, tint) {
    sprite.setTint(tint)
    this.time.delayedCall(120, () => sprite.clearTint())
  }
}