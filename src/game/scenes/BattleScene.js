import Phaser from 'phaser'
import ratRunURL from '../../assets/characters/enemies/Rat/Rat_Idle.png?url'
import ratAttackURL from '../../assets/characters/enemies/Rat/Rat_Attack.png?url'
import ratDeathURL from '../../assets/characters/enemies/Rat/Rat_Death.png?url'
import ratHitURL from '../../assets/characters/enemies/Rat/Rat_Hit.png?url'
import slimeRunURL from '../../assets/characters/enemies/Slime/Slime_Spiked_Idle.png?url'
import slimeAttackURL from '../../assets/characters/enemies/Slime/Slime_Spiked_Jump.png?url'
import slimeDeathURL from '../../assets/characters/enemies/Slime/Slime_Spiked_Death.png?url'
import slimeHitURL from '../../assets/characters/enemies/Slime/Slime_Spiked_Hit.png?url'
import golemArmorIdleURL from '../../assets/characters/enemies/Golem/Golem_Armor_Idle.png?url'
import golemArmorHitURL from '../../assets/characters/enemies/Golem/Golem_Armor_Hit.png?url'
import golemArmorAttackURL from '../../assets/characters/enemies/Golem/Golem_Armor_AttackA.png?url'
import golemArmorBreakURL from '../../assets/characters/enemies/Golem/Golem_Armor_ArmorBreak.png?url'
import golemUpgradeURL from '../../assets/characters/enemies/Golem/Golem_Upgrade.png?url'
import golemIdleURL from '../../assets/characters/enemies/Golem/Golem_IdleA.png?url'
import golemHitURL from '../../assets/characters/enemies/Golem/Golem_HitA.png?url'
import golemAttackURL from '../../assets/characters/enemies/Golem/Golem_AttackA.png?url'
import golemDeathURL from '../../assets/characters/enemies/Golem/Golem_DeathA.png?url'

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene')
    this.player = null
    this.monster = null
    this.monsterType = 'rat'
    this.golemArmored = true // NEW
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

    this.load.spritesheet('battle_golem_armor_idle', golemArmorIdleURL, { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('battle_golem_armor_hit', golemArmorHitURL, { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('battle_golem_armor_attack', golemArmorAttackURL, { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('battle_golem_armor_break', golemArmorBreakURL, { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('battle_golem_upgrade', golemUpgradeURL, { frameWidth: 64, frameHeight: 64 })

    this.load.spritesheet('battle_golem_idle', golemIdleURL, { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('battle_golem_hit', golemHitURL, { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('battle_golem_attack', golemAttackURL, { frameWidth: 64, frameHeight: 64 })
    this.load.spritesheet('battle_golem_death', golemDeathURL, { frameWidth: 64, frameHeight: 64 })

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

    // Golem animations
    if (!this.anims.exists('battle-golem-armor-idle')) {
      this.anims.create({
        key: 'battle-golem-armor-idle',
        frames: this.anims.generateFrameNumbers('battle_golem_armor_idle', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      })
      this.anims.create({
        key: 'battle-golem-armor-attack',
        frames: this.anims.generateFrameNumbers('battle_golem_armor_attack', { start: 0, end: 10 }),
        frameRate: 10,
        repeat: 0,
      })
      this.anims.create({
        key: 'battle-golem-armor-hit',
        frames: this.anims.generateFrameNumbers('battle_golem_armor_hit', { start: 0, end: 4 }),
        frameRate: 10,
        repeat: 0,
      })
      this.anims.create({
        key: 'battle-golem-upgrade',
        frames: this.anims.generateFrameNumbers('battle_golem_upgrade', { start: 0, end: 10 }),
        frameRate: 10,
        repeat: 0,
      })
      this.anims.create({
        key: 'battle-golem-armor-break',
        frames: this.anims.generateFrameNumbers('battle_golem_armor_break', { start: 0, end: 4 }),
        frameRate: 10,
        repeat: 0,
      })

      this.anims.create({
        key: 'battle-golem-idle',
        frames: this.anims.generateFrameNumbers('battle_golem_idle', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      })
      this.anims.create({
        key: 'battle-golem-attack',
        frames: this.anims.generateFrameNumbers('battle_golem_attack', { start: 0, end: 11 }),
        frameRate: 10,
        repeat: 0,
      })
      this.anims.create({
        key: 'battle-golem-hit',
        frames: this.anims.generateFrameNumbers('battle_golem_hit', { start: 0, end: 4 }),
        frameRate: 10,
        repeat: 0,
      })
      this.anims.create({
        key: 'battle-golem-death',
        frames: this.anims.generateFrameNumbers('battle_golem_death', { start: 0, end: 4 }),
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
    const next = (type === 'slime' || type === 'rat' || type === 'golem') ? type : 'rat'
    this.monsterType = next

    if (!this.monster) return

    if (next === 'golem') {
      this._applyGolemVisuals()
      return
    }

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

  // NEW
  setGolemArmored(v) {
    this.golemArmored = !!v
    if (this.monsterType === 'golem') this._applyGolemVisuals()
  }

  // NEW
  _applyGolemVisuals() {
    if (!this.monster) return
    if (this.golemArmored) {
      this.monster.setTexture('battle_golem_armor_idle', 0)
      this.monster.play('battle-golem-armor-idle', true)
    } else {
      this.monster.setTexture('battle_golem_idle', 0)
      this.monster.play('battle-golem-idle', true)
    }
    this.monster.setFlipX(true)
  }

  // NEW: upgrade animation (gains armor)
  playMonsterUpgrade() {
    if (this.monsterType !== 'golem' || !this.monster) return
    this.monster.play('battle-golem-upgrade', true)
    this.monster.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.setGolemArmored(true)
    })
  }

  // NEW: armor break animation (switch to normal golem)
  playMonsterArmorBreak() {
    if (this.monsterType !== 'golem' || !this.monster) return
    this.monster.play('battle-golem-armor-break', true)
    this.monster.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.setGolemArmored(false)
    })
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

    if (this.monsterType === 'golem') {
      const atkKey = this.golemArmored ? 'battle-golem-armor-attack' : 'battle-golem-attack'
      const idleKey = this.golemArmored ? 'battle-golem-armor-idle' : 'battle-golem-idle'
      this.monster.play(atkKey, true)
      this.monster.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (this.monster) this.monster.play(idleKey, true)
      })
      return
    }

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

    if (this.monsterType === 'golem') {
      const hitKey = this.golemArmored ? 'battle-golem-armor-hit' : 'battle-golem-hit'
      const idleKey = this.golemArmored ? 'battle-golem-armor-idle' : 'battle-golem-idle'
      this.monster.play(hitKey, true)
      this.monster.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (this.monster) this.monster.play(idleKey, true)
      })
      return
    }

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
    if (this.monsterType === 'golem') {
      this.monster.play('battle-golem-death', true)
      return
    }
    
    const deathKey = this.monsterType === 'slime' ? 'battle-slime-death' : 'battle-rat-death'
    this.monster.play(deathKey, true)
  }

  flashSprite(sprite, tint) {
    sprite.setTint(tint)
    this.time.delayedCall(120, () => sprite.clearTint())
  }
}