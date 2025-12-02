import React, { useEffect } from 'react';
import { testSupabaseConnection } from './services/supabaseClient'; // Import the function

function App() {
  // Use useEffect to run the test when the app starts
  useEffect(() => {
    testSupabaseConnection();
  }, []); // The empty array ensures it only runs once

  return (
    <div className="game-container">
      {/* Your Phaser game canvas will go here */}
      <h1>Bug Battle Game Loading... (Check Console for DB Status)</h1>
    </div>
  );
}

export default App;