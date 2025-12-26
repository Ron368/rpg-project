import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import gameConfig from '../game/config'

const GameCanvas = ({ onEncounter, onGameReady, onLoadingProgress, onSceneReady }) => {
  const containerRef = useRef(null)
  const gameRef = useRef(null)

  const onEncounterRef = useRef(onEncounter)
  const onGameReadyRef = useRef(onGameReady)
  const onLoadingProgressRef = useRef(onLoadingProgress)
  const onSceneReadyRef = useRef(onSceneReady)

  useEffect(() => { onEncounterRef.current = onEncounter }, [onEncounter])
  useEffect(() => { onGameReadyRef.current = onGameReady }, [onGameReady])
  useEffect(() => { onLoadingProgressRef.current = onLoadingProgress }, [onLoadingProgress])
  useEffect(() => { onSceneReadyRef.current = onSceneReady }, [onSceneReady])

  useEffect(() => {
    if (gameRef.current) return

    const config = { ...gameConfig, parent: containerRef.current }
    const game = new Phaser.Game(config)
    gameRef.current = game
    onGameReadyRef.current?.(game)

    const attach = () => {
      try {
        const scene = game.scene.getScene('DungeonScene')
        if (scene) {
          scene.reactAPI = {
            showBattleModal: (payload) => onEncounterRef.current?.(payload),
            onLoadingProgress: (v) => onLoadingProgressRef.current?.(v),
            onSceneReady: () => onSceneReadyRef.current?.(),
          }

          // sync any already-known state (in case attach happens after preload/create)
          if (typeof scene.loadingProgress === 'number') {
            onLoadingProgressRef.current?.(scene.loadingProgress)
          }
          if (scene._created) {
            onSceneReadyRef.current?.()
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