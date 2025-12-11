import Phaser from 'phaser'
import DungeonScene from './scenes/DungeonScene'

// Export a single config object used by GameCanvas to create Phaser.Game
export const gameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  pixelArt: true,
  physics: { default: 'arcade', arcade: { debug: false } },
  render: { pixelArt: true, antialias: false, roundPixels: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [DungeonScene],
}

export default gameConfig