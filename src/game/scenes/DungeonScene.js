import Phaser from 'phaser'
import tilesPNG from '../../assets/tilesets/tilemap.png'
import dungeonMapUrl from '../../assets/tilemaps/dungeon_level_1.tmj?url'

export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super('DungeonScene');
  }

  preload() {
    console.log('[DungeonScene] Preload started');
    this.load.image('tiles', tilesPNG);
    this.load.tilemapTiledJSON('dungeon-level-1', dungeonMapUrl);
    this.load.on('complete', () => {
      // Force nearest filtering to prevent bleeding
      const tex = this.textures.get('tiles');
      if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
      console.log('[DungeonScene] Preload complete: tiles + dungeon-level-1 loaded');
    });
  }

  create() {
    const map = this.make.tilemap({ key: 'dungeon-level-1' });
    const ts = map.tilesets[0];
    const tileset = map.addTilesetImage(ts.name, 'tiles', ts.tileWidth, ts.tileHeight, ts.margin || 0, ts.spacing || 1);
    const layer = map.createLayer('Dungeon', tileset, 0, 0);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    const W = this.scale.width;
    const H = this.scale.height;
    const z = Math.min(W / map.widthInPixels, H / map.heightInPixels); // z = min(W/w, H/h)
    this.cameras.main.setZoom(z);
    this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
    this.cameras.main.roundPixels = true;

    console.log('[DungeonScene] Fit zoom:', z);
  }
}