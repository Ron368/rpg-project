import React, { useState, useEffect } from 'react';
import BattleModal from './BattleModal';
import { uiTiles } from '../utils/uiAssets';
import './BattleModal.css';

/**
 * Example component demonstrating how to use the BattleModal
 * This can be integrated into your game when a player encounters a monster
 */
const BattleModalExample = () => {
  const [isBattleOpen, setIsBattleOpen] = useState(false);
  const [battleResult, setBattleResult] = useState(null);

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('BattleModalExample component mounted');
  }, []);

  // Example monster data
  const monsterData = {
    name: 'Syntax Error Bug',
    type: 'bug',
    level: 1
  };

  // Handle battle end callback
  const handleBattleEnd = (result) => {
    console.log('Battle ended:', result);
    setBattleResult(result);
    setIsBattleOpen(false);
  };

  // Handle modal close
  const handleClose = () => {
    setIsBattleOpen(false);
  };

  return (
    <>
      <h2 style={{ color: '#00d4ff', marginBottom: '1rem' }}>⚔️ Battle Modal Example ⚔️</h2>
      <p style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>Click the button below to start a battle!</p>

      <button
        onClick={() => {
          console.log('Start Battle button clicked');
          setIsBattleOpen(true);
        }}
        style={{
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          backgroundColor: 'rgba(0, 212, 255, 0.3)',
          backgroundImage: `url(${uiTiles.button})`,
          backgroundSize: '32px 32px',
          backgroundRepeat: 'repeat',
          backgroundBlendMode: 'overlay',
          color: '#00d4ff',
          border: '3px solid #00d4ff',
          borderRadius: '0',
          cursor: 'pointer',
          fontWeight: 'bold',
          marginTop: '1rem',
          boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5), 0 4px 6px rgba(0, 0, 0, 0.3)',
          textShadow: '2px 2px 0px rgba(0, 0, 0, 0.8)',
          imageRendering: 'pixelated',
          fontFamily: "'Courier New', 'Monaco', monospace",
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = 'rgba(0, 212, 255, 0.5)';
          e.target.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'rgba(0, 212, 255, 0.3)';
          e.target.style.transform = 'translateY(0)';
        }}
      >
        Start Battle
      </button>

      {/* Battle Modal */}
      <BattleModal
        isOpen={isBattleOpen}
        onClose={handleClose}
        onBattleEnd={handleBattleEnd}
        monsterData={monsterData}
      />

      {/* Display battle result */}
      {battleResult && (
        <div className={`battle-result ${battleResult.victory ? 'victory' : 'defeat'}`}>
          <h3>{battleResult.victory ? '🎉 Victory!' : '💀 Defeat!'}</h3>
          <div className="result-line">Critical Hit: <span className="result-small">{battleResult.isCriticalHit ? 'Yes' : 'No'}</span></div>
          <div className="result-line">Wrong Answers: <span className="result-small">{battleResult.incorrectAttempts}</span></div>
          <div className="result-line">Time Remaining: <span className="result-small">{battleResult.timeRemaining}s</span></div>
          <div className="result-line">Player Health: <span className="result-small">{battleResult.playerHealth}%</span></div>
          <div className="result-line">Monster Health: <span className="result-small">{battleResult.monsterHealth}%</span></div>
        </div>
      )}
    </>
  );
};

export default BattleModalExample;
