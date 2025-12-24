import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import BattleScene from '../game/scenes/BattleScene'

/**
 * Mounts a small Phaser "battle stage" inside the BattleModal header.
 * Exposes an imperative API via onReady(api).
 */
export default function BattleStage({ onReady, monsterType = 'rat' }) {
  const hostRef = useRef(null)
  const gameRef = useRef(null)
  const sceneRef = useRef(null)

  // keep latest callback without re-creating the Phaser game
  const onReadyRef = useRef(onReady)
  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    if (!hostRef.current || gameRef.current) return

    const config = {
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: 520,
      height: 140,
      transparent: true,
      pixelArt: true,
      render: { pixelArt: true, antialias: false, roundPixels: true },
      physics: { default: 'arcade', arcade: { debug: false } },
      scene: [BattleScene],
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    const attach = () => {
      const scene = game.scene.getScene('BattleScene')
      if (scene) {
        sceneRef.current = scene

        // Ensure correct monster immediately
        if (typeof scene.setMonsterType === 'function') {
          scene.setMonsterType(monsterType)
        }

        const api = {
          setMonsterType: (t) => scene.setMonsterType?.(t),

          // NEW: golem armor helpers
          setGolemArmored: (v) => scene.setGolemArmored?.(v),
          playMonsterUpgrade: () => scene.playMonsterUpgrade?.(),
          playMonsterArmorBreak: () => scene.playMonsterArmorBreak?.(),

          playPlayerAttack: () => scene.playPlayerAttack(),
          playMonsterAttack: () => scene.playMonsterAttack(),
          playPlayerHit: () => scene.playPlayerHit(),
          playMonsterHit: () => scene.playMonsterHit(),
          playPlayerDeath: () => scene.playPlayerDeath(),
          playMonsterDeath: () => scene.playMonsterDeath(),
        }

        onReadyRef.current?.(api)
        return
      }
      requestAnimationFrame(attach)
    }
    attach()

    return () => {
      game.destroy(true)
      gameRef.current = null
      sceneRef.current = null
    }
  }, []) 

  // React to monsterType changes while the modal is open
  useEffect(() => {
    sceneRef.current?.setMonsterType?.(monsterType)
  }, [monsterType])

  return <div ref={hostRef} style={{ width: '520px', maxWidth: '100%', height: '140px' }} />
}