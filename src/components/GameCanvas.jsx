import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import gameConfig from '../game/config'

const GameCanvas = ({ onEncounter, onGameReady }) => {
  const containerRef = useRef(null)
  const gameRef = useRef(null)

  // Keep latest callbacks without recreating Phaser.Game
  const onEncounterRef = useRef(onEncounter)
  const onGameReadyRef = useRef(onGameReady)

  useEffect(() => {
    onEncounterRef.current = onEncounter
  }, [onEncounter])

  useEffect(() => {
    onGameReadyRef.current = onGameReady
  }, [onGameReady])

  useEffect(() => {
    if (gameRef.current) return

    const config = {
      ...gameConfig,
      parent: containerRef.current,
    }

    const game = new Phaser.Game(config)
    gameRef.current = game
    onGameReadyRef.current?.(game)

    // Attach React callback into the running DungeonScene
    const attach = () => {
      try {
        const scene = game.scene.getScene('DungeonScene')
        if (scene) {
          scene.reactAPI = {
            showBattleModal: (payload) => onEncounterRef.current?.(payload),
          }
          return
        }
      } catch (_) {}
      requestAnimationFrame(attach)
    }
    attach()

    return () => {
      game.destroy(true)
      gameRef.current = null
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