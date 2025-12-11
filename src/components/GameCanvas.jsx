import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import gameConfig from '../game/config'

const GameCanvas = () => {
  const containerRef = useRef(null)

  useEffect(() => {
    // Attach Phaser to the container div
    const config = {
      ...gameConfig,
      parent: containerRef.current, // tells Phaser where to inject the canvas
    }

    const game = new Phaser.Game(config)

    return () => {
      game.destroy(true)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', maxWidth: '900px', height: '70vh', margin: '0 auto' }}
    />
  )
}

export default GameCanvas