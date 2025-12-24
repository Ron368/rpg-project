import Phaser from 'phaser'
import tilesPNG from '../../assets/tilesets/tilemap.png'
import dungeonMapUrl from '../../assets/tilemaps/dungeon_level_1.tmj?url'
import ratRunURL     from '../../assets/characters/enemies/Rat/Rat_Run.png?url'
import slimeRunURL   from '../../assets/characters/enemies/Slime/Slime_Spiked_Run.png?url'
import golemArmorIdleURL from '../../assets/characters/enemies/Golem/Golem_Armor_Idle.png?url'

const PLAYER_DISPLAY_SCALE = 1.5;

const RAT_FACES_RIGHT = true;
// Patrol speed for the rat
const RAT_SPEED = 40

// Spawn point for slime 
const SLIME_SPAWN_X = 520
const SLIME_SPAWN_Y = 160

// Optional tuning
const SLIME_SPEED = 35

// Spawn point for golem 
const GOLEM_SPAWN_X = 440
const GOLEM_SPAWN_Y = 100

// TEMP: set to true to show spawn markers/labels
const DEBUG_SPAWNS = true

export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super('DungeonScene')

    this.reactAPI = {
      showBattleModal: (payload) => console.log('[DungeonScene] reactAPI.showBattleModal called:', payload)
    }

    this.player = null
    this.monster = null // rat
    this.slime = null   
    this.golem = null

    this.cursors = null
    this.patrolDir = -1       // rat direction
    this.slimePatrolDir = 1   

    this.ratFrameKeys = []

    this.lastFacingLeft = false

    // battle gate / cooldown so overlap doesn't re-trigger instantly
    this.inBattle = false
    this.battleCooldownUntil = 0

    // Track which monster triggered the current battle
    this.activeEncounterType = null
  }

  preload() {
    // Map + tiles
    this.load.image('tiles', tilesPNG)
    this.load.tilemapTiledJSON('dungeon-level-1', dungeonMapUrl)

    // Player spritesheet: try src/assets/player first, then fallback to src/assets/characters/player
    const p1 = import.meta.glob('../../assets/player/*.{png,webp}', { eager: true, query: '?url', import: 'default' })
    const p2 = import.meta.glob('../../assets/characters/player/*.{png,webp}', { eager: true, query: '?url', import: 'default' })
    const playerSheetUrl = Object.values({ ...p1, ...p2 })[0]
    if (playerSheetUrl) {
      // IMPORTANT: frames are 64x64 (sprite is 16x16 centered inside)
      this.load.spritesheet('player', playerSheetUrl, { frameWidth: 64, frameHeight: 64 })
      console.log('[DungeonScene] Player sheet loaded from', playerSheetUrl)
    } else {
      console.warn('[DungeonScene] No player spritesheet found in src/assets/player or src/assets/characters/player')
    }

    // Enemy Rat: individual PNGs from src/assets/characters/enemies/Rat
    const ratMods = import.meta.glob('../../assets/characters/enemies/Rat/*.{png,webp}', { eager: true, query: '?url', import: 'default' })
    this.ratFrameKeys = []
    for (const [path, url] of Object.entries(ratMods)) {
      const base = path.split('/').pop().replace(/\.[^/.]+$/, '')
      const key = `rat_${base}`
      this.load.image(key, url)
      this.ratFrameKeys.push(key)
    }
    console.log('[DungeonScene] Rat frames discovered:', this.ratFrameKeys)

    // Small Rat RUN sheet (64x64 frames, 2 rows: first row=4 frames, second row=2 frames)
    this.load.spritesheet('rat_run', ratRunURL, { frameWidth: 64, frameHeight: 64 })

    // NEW: slime run sheet 
    this.load.spritesheet('slime_run', slimeRunURL, { frameWidth: 64, frameHeight: 64 })

    // NEW: golem idle sheet 
    this.load.spritesheet('golem_armor_idle', golemArmorIdleURL, { frameWidth: 64, frameHeight: 64 })

    this.load.on('complete', () => {
      const tex = this.textures.get('tiles')
      if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST)
    })
  }

  create() {
    // Create map + tileset (reads spacing/margin from TMJ)
    const map = this.make.tilemap({ key: 'dungeon-level-1' })
    const ts = map.tilesets[0]
    const tileset = map.addTilesetImage(ts.name, 'tiles', ts.tileWidth, ts.tileHeight, ts.margin || 0, ts.spacing || 1)

    // Layers
    const dungeonLayer = map.createLayer('Dungeon', tileset, 0, 0)   // floor (non-collidable)
    const wallLayer    = map.createLayer('Wall', tileset, 0, 0)      // walls
    const cartsLayer   = map.createLayer('Carts', tileset, 0, 0)     // obstacles
    const objectsLayer = map.createLayer('Objects', tileset, 0, 0)   // obstacles

    // Set collisions based on tile property in Tiled
    wallLayer.setCollisionByProperty({ collides: true })
    dungeonLayer.setCollisionByProperty({ collides: false })
    cartsLayer.setCollisionByProperty({ collides: true })
    objectsLayer.setCollisionByProperty({ collides: true })

    // World/camera bounds
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.cameras.main.roundPixels = true

    // Player
    this.player = this.physics.add.sprite(50, 50, 'player', 0).setOrigin(0.5, 0.5)
    this.player.setScale(PLAYER_DISPLAY_SCALE)
    this.player.setCollideWorldBounds(true)
    this.player.body.setSize(8, 8, true)
    this.player.body.setOffset(26, 38)
    this.player.setDepth(10)

    // Player animations (0-based indices)
    if (this.textures.exists('player')) {
      this.anims.create({ key: 'player-idle',   frames: this.anims.generateFrameNumbers('player', { start: 0,  end: 4  }), frameRate: 6,  repeat: -1 })
      this.anims.create({ key: 'player-run',    frames: this.anims.generateFrameNumbers('player', { start: 8,  end: 15 }), frameRate: 10, repeat: -1 })
      this.anims.create({ key: 'player-jump',   frames: this.anims.generateFrameNumbers('player', { start: 16, end: 18 }), frameRate: 10, repeat: 0  })
      this.anims.create({ key: 'player-fall',   frames: this.anims.generateFrameNumbers('player', { start: 24, end: 25 }), frameRate: 8,  repeat: -1 })
      this.anims.create({ key: 'player-attack', frames: this.anims.generateFrameNumbers('player', { start: 32, end: 37 }), frameRate: 12, repeat: 0  })
      this.anims.create({ key: 'player-damage', frames: this.anims.generateFrameNumbers('player', { start: 40, end: 40 }), frameRate: 1,  repeat: 0  })
      this.anims.create({ key: 'player-dead',   frames: this.anims.generateFrameNumbers('player', { start: 48, end: 54 }), frameRate: 8,  repeat: 0  })
      this.anims.create({ key: 'player-block',  frames: this.anims.generateFrameNumbers('player', { start: 32, end: 33 }), frameRate: 6,  repeat: -1 })
      this.player.play('player-idle')
    } else {
      console.error('[DungeonScene] Player texture not found; check src/assets/player or src/assets/characters/player')
    }

    // Colliders: player vs Wall, Objects, and Carts only
    this.physics.add.collider(this.player, wallLayer)
    this.physics.add.collider(this.player, cartsLayer)
    this.physics.add.collider(this.player, objectsLayer)
    
    wallLayer.setCollisionByExclusion([-1]) 
    cartsLayer.setCollisionByExclusion([-1])
    objectsLayer.setCollisionByExclusion([-1])

    // Show the whole map (fixed camera)
    const cam = this.cameras.main
    cam.stopFollow()

    const W = this.scale.width
    const H = this.scale.height
    const z = Math.min(W / map.widthInPixels, H / map.heightInPixels) // contain (whole map visible)
    cam.setZoom(z)
    cam.centerOn(map.widthInPixels / 2, map.heightInPixels / 2)

    // Optional: prevent black bars from looking “black”
    cam.setBackgroundColor('#1a1a2e')

    // Rat: use run sheet
    if (this.textures.exists('rat_run') && !this.anims.exists('rat-walk')) {
      this.anims.create({
        key: 'rat-walk',
        frames: this.anims.generateFrameNumbers('rat_run', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1
      })
    }

    this.monster = this.physics.add.sprite(300, 300, 'rat_run', 0).setOrigin(0.5, 0.5)
    this.monster.setScale(0.85)
    this.monster.setCollideWorldBounds(true)
    this.monster.body.setSize(16, 12, true)
    this.monster.body.setOffset(24, 40)
    this.monster.setDepth(9)

    // Colliders: rat vs obstacle layers
    this.physics.add.collider(this.monster, wallLayer, () => this.handleRatBounce())
    this.physics.add.collider(this.monster, cartsLayer, () => this.handleRatBounce())
    this.physics.add.collider(this.monster, objectsLayer, () => this.handleRatBounce())
    // Optional floor collider:
    // this.physics.add.collider(this.monster, dungeonLayer, () => this.handleRatBounce())

    // Patrol start
    this.patrolDir = -1
    this.monster.setVelocityX(RAT_SPEED * this.patrolDir)
    this.monster.play('rat-walk', true)
    this.monster.setFlipX(RAT_FACES_RIGHT ? (this.patrolDir < 0) : (this.patrolDir > 0))

    // --- Slime animations (re-using the same run sheet style as rat) ---
    if (this.textures.exists('slime_run') && !this.anims.exists('slime-walk')) {
      this.anims.create({
        key: 'slime-walk',
        frames: this.anims.generateFrameNumbers('slime_run', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      })
    }

    // --- Slime spawn (MANUAL LOCATION) ---
    this.slime = this.physics.add.sprite(SLIME_SPAWN_X, SLIME_SPAWN_Y, 'slime_run', 0).setOrigin(0.5, 0.5)
    this.slime.setScale(0.9)
    this.slime.setCollideWorldBounds(true)
    this.slime.setDepth(9)

    // Hitbox (tweak as needed)
    this.slime.body.setSize(16, 12, true)
    this.slime.body.setOffset(24, 40)

    // Start patrolling
    this.slimePatrolDir = 1
    this.slime.setVelocityX(SLIME_SPEED * this.slimePatrolDir)
    this.slime.play('slime-walk', true)

    // Colliders: slime vs obstacle layers (bounce like rat)
    this.physics.add.collider(this.slime, wallLayer, () => this.handleSlimeBounce())
    this.physics.add.collider(this.slime, cartsLayer, () => this.handleSlimeBounce())
    this.physics.add.collider(this.slime, objectsLayer, () => this.handleSlimeBounce())

    // --- Golem animations (idle only; no patrol) ---
    if (this.textures.exists('golem_armor_idle') && !this.anims.exists('golem-idle')) {
      const tex = this.textures.get('golem_armor_idle')
      const last = Math.max(0, (tex?.frameTotal ?? 1) - 1)
      const end = Math.min(3, last)
      this.anims.create({
        key: 'golem-idle',
        frames: this.anims.generateFrameNumbers('golem_armor_idle', { start: 0, end }),
        frameRate: 6,
        repeat: -1
      })
    }

    // --- Golem spawn (stationary boss) ---
    this.golem = this.physics.add.sprite(GOLEM_SPAWN_X, GOLEM_SPAWN_Y, 'golem_armor_idle', 0).setOrigin(0.5, 0.5)
    this.golem.setDepth(50)
    this.golem.setCollideWorldBounds(true)
    this.golem.setImmovable(true)
    this.golem.body.setAllowGravity(false)
    this.golem.body.setSize(18, 14, true)
    this.golem.body.setOffset(23, 38)
    this.golem.setVelocity(0, 0)
    if (this.anims.exists('golem-idle')) this.golem.play('golem-idle', true)

    // Colliders: golem vs obstacles (mostly to keep it from being pushed)
    this.physics.add.collider(this.golem, wallLayer)
    this.physics.add.collider(this.golem, cartsLayer)
    this.physics.add.collider(this.golem, objectsLayer)

    // Battle trigger: player vs slime
    this.physics.add.overlap(this.player, this.slime, () => this.onPlayerSlimeCollision(), null, this)
    
    // NEW: Battle trigger: player vs rat
    this.physics.add.overlap(
      this.player,
      this.monster,
      () => this.onPlayerMonsterCollision(),
      null,
      this
    )

    // NEW: Battle trigger: player vs golem
    this.physics.add.overlap(this.player, this.golem, () => this.onPlayerGolemCollision(), null, this)

    // Input
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D
    })
  }

  // Helper: reverse rat when hitting walls/obstacles
  handleRatBounce() {
    this.patrolDir *= -1
    this.monster.setVelocityX(RAT_SPEED * this.patrolDir)
    this.monster.x += this.patrolDir * 2
    this.monster.setFlipX(RAT_FACES_RIGHT ? (this.patrolDir < 0) : (this.patrolDir > 0))
    if (this.anims.exists('rat-walk')) this.monster.play('rat-walk', true)
  }

  // NEW: bounce helper for slime
  handleSlimeBounce() {
    this.slimePatrolDir *= -1
    this.slime.setVelocityX(SLIME_SPEED * this.slimePatrolDir)
    this.slime.x += this.slimePatrolDir * 2
    if (this.anims.exists('slime-walk')) this.slime.play('slime-walk', true)
  }

  update() {
    if (!this.player || !this.cursors) return
    const speed = 80
    let vx = 0, vy = 0

    if (this.cursors.left.isDown) vx = -speed
    else if (this.cursors.right.isDown) vx = speed
    if (this.cursors.up.isDown) vy = -speed
    else if (this.cursors.down.isDown) vy = speed

    this.player.setVelocity(vx, vy)

    // Update facing based on last non-zero horizontal input
    if (vx < 0) this.lastFacingLeft = true
    else if (vx > 0) this.lastFacingLeft = false

    const moving = vx !== 0 || vy !== 0
    if (moving) this.player.anims.play('player-run', true)
    else this.player.anims.play('player-idle', true)

    // Apply facing for both moving and idle
    // If your base frames face RIGHT, flip when facing left:
    this.player.setFlipX(this.lastFacingLeft)

    // Keep rat facing consistent with current velocity (prevents “moonwalk”)
    if (this.monster) {
      const dir = Math.sign(this.monster.body.velocity.x) || this.patrolDir
      this.monster.setFlipX(RAT_FACES_RIGHT ? (dir < 0) : (dir > 0))

      // If velocity drops to 0 (corner snag), force a reversal
      if (Math.abs(this.monster.body.velocity.x) < 1) {
        this.patrolDir *= -1
        this.monster.setVelocityX(RAT_SPEED * this.patrolDir)
        this.monster.x += this.patrolDir * 2
        this.monster.play('rat-walk', true)
      }
    }

    // Keep slime facing consistent with current velocity
    if (this.slime) {
      const dir = Math.sign(this.slime.body.velocity.x) || this.slimePatrolDir
      this.slime.setFlipX(dir < 0)

      // If velocity drops to 0 (corner snag), force a reversal
      if (Math.abs(this.slime.body.velocity.x) < 1) {
        this.slimePatrolDir *= -1
        this.slime.setVelocityX(SLIME_SPEED * this.slimePatrolDir)
        this.slime.x += this.slimePatrolDir * 2
        this.slime.play('slime-walk', true)
      }
    }
  }

  resolveBattle({ victory }) {
    // Called by React when battle ends

    // Destroy the monster you actually fought
    if (victory) {
      if (this.activeEncounterType === 'rat' && this.monster) {
        this.monster.destroy()
        this.monster = null
      }
      if (this.activeEncounterType === 'slime' && this.slime) {
        this.slime.destroy()
        this.slime = null
      }
      if (this.activeEncounterType === 'golem' && this.golem) {
        this.golem.destroy()
        this.golem = null
      }
    }

    this.activeEncounterType = null

    // Resume gameplay
    this.inBattle = false
    this.battleCooldownUntil = Date.now() + 500
    this.scene.resume()
    this.physics.resume()
  }

  // NEW: slime collision -> triggers MEDIUM difficulty battle
  onPlayerSlimeCollision() {
    if (this.inBattle) return
    if (Date.now() < this.battleCooldownUntil) return
    if (!this.slime) return

    this.inBattle = true
    this.activeEncounterType = 'slime'

    // Freeze everything while modal is open
    this.player.setVelocity(0, 0)
    this.slime.setVelocity(0, 0)

    this.physics.pause()
    this.scene.pause()

    if (this.reactAPI && typeof this.reactAPI.showBattleModal === 'function') {
      this.reactAPI.showBattleModal({
        monsterId: 2,
        monsterType: 'slime',
        name: 'Slime',
        difficulty: 'MEDIUM', 
      })
    }
  }

  onPlayerMonsterCollision() {
    if (this.inBattle) return
    if (Date.now() < this.battleCooldownUntil) return
    if (!this.monster) return

    this.inBattle = true
    this.activeEncounterType = 'rat' 
    
    // Freeze everything while modal is open
    this.player.setVelocity(0, 0)
    this.monster.setVelocity(0, 0)

    this.physics.pause()
    this.scene.pause()

    // Rat => easy questions
    if (this.reactAPI && typeof this.reactAPI.showBattleModal === 'function') {
      this.reactAPI.showBattleModal({
        monsterId: 1,
        monsterType: 'rat',
        name: 'Rat',
        difficulty: 'EASY',
      })
    }
  }

  // NEW: golem collision -> triggers HARD difficulty battle
  onPlayerGolemCollision() {
    if (this.inBattle) return
    if (Date.now() < this.battleCooldownUntil) return
    if (!this.golem) return

    this.inBattle = true
    this.activeEncounterType = 'golem'

    this.player.setVelocity(0, 0)
    this.golem.setVelocity(0, 0)

    this.physics.pause()
    this.scene.pause()

    if (this.reactAPI && typeof this.reactAPI.showBattleModal === 'function') {
      this.reactAPI.showBattleModal({
        monsterId: 3,          
        monsterType: 'golem',
        name: 'Golem',
        difficulty: 'HARD',    
      })
    }
  }
}