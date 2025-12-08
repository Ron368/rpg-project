import React, { useEffect } from 'react';
import { testSupabaseConnection } from './services/supabaseClient';
import BattleModalExample from './components/BattleModalExample';
import { uiTiles } from './utils/uiAssets';
import './App.css';

function App() {
  // Use useEffect to run the test when the app starts
  useEffect(() => {
    console.log('App component mounted');
    testSupabaseConnection();
  }, []);

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
        <h1 className="ui-hero-title">⚔️ Syntax Slayer - Battle System ⚔️</h1>
        <div className="ui-tagline">
          <p className="tagline-main">Code. Clash. Conquer.</p>
          <div className="tagline-words" aria-hidden>
            <span>Slash Bugs</span>
            <span>Earn XP</span>
            <span>Level Up</span>
          </div>
        </div>

        {/* Battle Modal Example (inline to keep single-section layout) */}
        <div className="battle-inline">
          <BattleModalExample />
        </div>
      </div>
    </div>
  );
}

export default App;
