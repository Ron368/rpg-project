import React, { useEffect, useRef, useState } from 'react';
import { testSupabaseConnection } from './services/supabaseClient';
import GameCanvas from './components/GameCanvas';
import BattleModal from './components/BattleModal';
import { uiTiles } from './utils/uiAssets';
import { audioManager } from './services/audioManager';
import LoadingScreen3D from './components/LoadingScreen3D';
import './App.css';

function App() {
  // Use useEffect to run the test when the app starts
  useEffect(() => {
    console.log('App component mounted');
    testSupabaseConnection();
  }, []);

  const gameRef = useRef(null);

  const [battleOpen, setBattleOpen] = useState(false);
  const [encounter, setEncounter] = useState(null); // { monsterType, difficulty, monsterId, name }
  const lastBattleResultRef = useRef(null);
  const MIN_LOADING_MS = 2500;
  const bootStartRef = useRef(performance.now());
  const rafRef = useRef(null);

  const [loadingProgress, setLoadingProgress] = useState(0); // real Phaser progress (0..1)
  const [displayProgress, setDisplayProgress] = useState(0); // what we show on the 3D UI (0..1)
  const [phaserSceneReady, setPhaserSceneReady] = useState(false);
  const [minDelayDone, setMinDelayDone] = useState(false);

  const handleEncounter = (payload) => {
    // payload comes from Phaser (DungeonScene)
    setEncounter(payload);
    setBattleOpen(true);
  };

  const resolveBattleInPhaser = (victory) => {
    const game = gameRef.current;
    if (!game) return;
    const scene = game.scene.getScene('DungeonScene');
    if (scene && typeof scene.resolveBattle === 'function') {
      scene.resolveBattle({ victory });
    }
  };

  const handleBattleEnd = (result) => {
    // Store outcome; resume overworld when user closes the modal
    lastBattleResultRef.current = result;
  };

  const handleBattleClose = () => {
    const victory = !!lastBattleResultRef.current?.victory;

    setBattleOpen(false);
    resolveBattleInPhaser(victory);

    lastBattleResultRef.current = null;
    setEncounter(null);
  };

  // Minimum delay timer
  useEffect(() => {
    bootStartRef.current = performance.now();
    setMinDelayDone(false);

    const t = setTimeout(() => setMinDelayDone(true), MIN_LOADING_MS);
    return () => clearTimeout(t);
  }, []);

  // Animate displayProgress up to 100% over MIN_LOADING_MS,
  // but never exceed the real Phaser progress.
  useEffect(() => {
    const tick = () => {
      const elapsed = performance.now() - bootStartRef.current;
      const timeFrac = Math.max(0, Math.min(1, elapsed / MIN_LOADING_MS));
      const next = Math.min(loadingProgress, timeFrac);
      setDisplayProgress(next);

      if (timeFrac < 1 || next < loadingProgress) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [loadingProgress]);

  const sceneReady = phaserSceneReady && minDelayDone;

  // If a battle opens very fast, don't let the loading overlay block clicks
  const showLoading = !sceneReady && !battleOpen;

  useEffect(() => {
    const unlock = () => {
      audioManager.unlock();
      audioManager.playOverworldBgm();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    if (battleOpen) {
      const type = encounter?.type || encounter?.monsterType; // supports either shape
      if (type === 'golem') audioManager.playGolemBossBgm();
      else audioManager.playBattleBgm();
    } else {
      audioManager.playOverworldBgm();
    }
  }, [battleOpen, encounter]);

  return (
    <div
      className="game-container"
      style={{
        minHeight: '100vh',
        backgroundColor: '#1a1a2e',
        backgroundImage: `url(${uiTiles.backgroundPattern1})`,
        backgroundSize: '64px 64px',
        backgroundRepeat: 'repeat',
        backgroundBlendMode: 'overlay',
        padding: '8px',
        color: 'white',
        imageRendering: 'pixelated',
      }}
    >
      <LoadingScreen3D visible={showLoading} progress={displayProgress} />

      <div className="ui-hero-panel" style={{ backgroundImage: `url(${uiTiles.panel})` }}>
        <h1 className="ui-hero-title">Syntax Slayer</h1>

        <div style={{ marginTop: '16px' }}>
          <GameCanvas
            onGameReady={(game) => {
              gameRef.current = game;
            }}
            onLoadingProgress={(v) => setLoadingProgress(v)}
            onSceneReady={() => setPhaserSceneReady(true)}
            onEncounter={handleEncounter}
          />
        </div>

        {/* Battle modal only when encounter happens */}
        <BattleModal
          isOpen={battleOpen}
          onClose={handleBattleClose}
          onBattleEnd={handleBattleEnd}
          monsterData={{
            name: encounter?.name || 'BUG MONSTER',
            type: encounter?.monsterType || 'rat',
          }}
          difficulty={encounter?.difficulty}
        />
      </div>
    </div>
  );
}

export default App;
