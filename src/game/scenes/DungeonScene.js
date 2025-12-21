import Phaser from 'phaser'
import tilesPNG from '../../assets/tilesets/tilemap.png'
import dungeonMapUrl from '../../assets/tilemaps/dungeon_level_1.tmj?url'
import ratRunURL     from '../../assets/characters/enemies/Rat/Rat_Run.png?url'

// Visual scale for the 64x64 frames that contain a 16x16 character.
// 0.25 -> 16px, 0.5 -> 32px, 0.75 -> ~48px, 1 -> 64px
const PLAYER_DISPLAY_SCALE = 1.5;

// If your rat run frames face LEFT by default, set this to false
const RAT_FACES_RIGHT = true;
// Patrol speed for the rat
const RAT_SPEED = 40;

export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super('DungeonScene')

    this.reactAPI = {
      showBattleModal: (payload) => console.log('[DungeonScene] reactAPI.showBattleModal called:', payload)
    }

    this.player = null
    this.monster = null
    this.cursors = null
    this.patrolDir = -1

    this.ratFrameKeys = []

    this.lastFacingLeft = false; // remember last horizontal facing
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
    // Ensure other layers do NOT collide
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
    // idle: 0..4, run: 5..12, jump: 13..15, fall: 16..17,
    // attack: 18..23, damage: 24, dead: 25..31, block: 32..33
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

    // Colliders: player vs Wall only
    this.physics.add.collider(this.player, wallLayer)
    this.physics.add.collider(this.player, cartsLayer)
    this.physics.add.collider(this.player, objectsLayer)
    // Optional floor collider:
    // this.physics.add.collider(this.player, dungeonLayer)
    wallLayer.setCollisionByExclusion([-1]) // ensure all non-empty tiles collide
    cartsLayer.setCollisionByExclusion([-1])
    objectsLayer.setCollisionByExclusion([-1])

    // Follow player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

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

    // Battle trigger
    this.physics.add.overlap(this.player, this.monster, () => this.onPlayerMonsterCollision(), null, this)

    // Input
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D
    })

    // Fit
    const W = this.scale.width
    const H = this.scale.height
    const z = Math.min(W / map.widthInPixels, H / map.heightInPixels)
    this.cameras.main.setZoom(z)
    this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2)
  }

  // Helper: reverse rat when hitting walls/obstacles
  handleRatBounce() {
    this.patrolDir *= -1
    this.monster.setVelocityX(RAT_SPEED * this.patrolDir)
    this.monster.x += this.patrolDir * 2
    this.monster.setFlipX(RAT_FACES_RIGHT ? (this.patrolDir < 0) : (this.patrolDir > 0))
    if (this.anims.exists('rat-walk')) this.monster.play('rat-walk', true)
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
  }

  onPlayerMonsterCollision() {
    console.log('Collision detected. Starting battle.')

    this.physics.pause()
    this.scene.pause()

    if (this.reactAPI && typeof this.reactAPI.showBattleModal === 'function') {
      this.reactAPI.showBattleModal({ monsterId: 1, playerHP: 100 })
    }

    if (this.monster) {
      this.monster.destroy()
      this.monster = null
    }
  }
}