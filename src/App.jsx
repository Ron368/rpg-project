import React, { useEffect, useRef, useState } from 'react';
import { testSupabaseConnection } from './services/supabaseClient';
import GameCanvas from './components/GameCanvas';
import BattleModal from './components/BattleModal';
import { uiTiles } from './utils/uiAssets';
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
    // terminal end (victory/defeat)
    setBattleOpen(false);
    resolveBattleInPhaser(!!result?.victory);
  };

  const handleBattleClose = () => {
    // user dismissed modal (treat as non-victory)
    setBattleOpen(false);
    resolveBattleInPhaser(false);
  };

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
      <div className="ui-hero-panel" style={{ backgroundImage: `url(${uiTiles.panel})` }}>
        <h1 className="ui-hero-title">Syntax Slayer</h1>

        {/* Gameplay first */}
        <div style={{ marginTop: '16px' }}>
          <GameCanvas
            onGameReady={(game) => {
              gameRef.current = game;
            }}
            onEncounter={handleEncounter}
          />
        </div>
      </div>

      {/* Battle modal only when encounter happens */}
      <BattleModal
        isOpen={battleOpen}
        onClose={handleBattleClose}
        onBattleEnd={handleBattleEnd}
        monsterData={{ name: encounter?.name || 'BUG MONSTER' }}
        difficulty={encounter?.difficulty} // <-- new prop we add below
      />
    </div>
  );
}

export default App;
