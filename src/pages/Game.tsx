
import React, { useState } from 'react';
import GameSettings from '../components/game/GameSettings';
import StartScreen from '../components/game/StartScreen';
import GameHUD from '../components/game/GameHUD';
import GameCanvas from '../components/game/GameCanvas';
import { initialGameState } from '../components/game/GameStateManager';
import { GameState } from '../components/game/GameStateManager';

const Game: React.FC = () => {
  const [carColor, setCarColor] = useState<number>(0xff0000); // Default red
  const [maxSpeedFactor, setMaxSpeedFactor] = useState<number>(1); // Default speed multiplier
  const [showSettings, setShowSettings] = useState<boolean>(true);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  
  // Start the game
  const startGame = () => {
    setGameStarted(true);
    setGameState(initialGameState);
  };

  // Restart game after game over
  const restartGame = () => {
    setGameState(initialGameState);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-racing-dark">
      {!gameStarted ? (
        <StartScreen onStartGame={startGame} />
      ) : (
        <div className="relative w-screen h-screen overflow-hidden">
          <GameCanvas
            carColor={carColor}
            maxSpeedFactor={maxSpeedFactor}
            gameState={gameState}
            setGameState={setGameState}
          />
          <GameSettings
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            carColor={carColor}
            setCarColor={setCarColor}
            maxSpeedFactor={maxSpeedFactor}
            setMaxSpeedFactor={setMaxSpeedFactor}
          />
          <GameHUD 
            gameState={gameState}
            restartGame={restartGame}
          />
        </div>
      )}
    </div>
  );
};

export default Game;
