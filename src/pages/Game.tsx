
import React, { useState, useRef } from 'react';
import * as THREE from 'three';

// Import components
import GameScene from '../components/game/GameScene';
import GameUI from '../components/game/GameUI';
import StartScreen from '../components/game/StartScreen';
import { createDefaultGameState, GameState } from '../components/game/GameStateManager';

const Game: React.FC = () => {
  const [carColor, setCarColor] = useState<number>(0xff0000); // Default red
  const [maxSpeedFactor, setMaxSpeedFactor] = useState<number>(1); // Default speed multiplier
  const [showSettings, setShowSettings] = useState<boolean>(true);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState>(createDefaultGameState());
  
  // Game time tracking (shared between components)
  const gameTime = useRef({ value: 0 }).current;

  // Start the game
  const startGame = () => {
    setGameStarted(true);
    setGameState(createDefaultGameState());
  };

  // Restart the game
  const restartGame = () => {
    setGameState(createDefaultGameState());
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-racing-dark">
      {!gameStarted ? (
        <StartScreen onStartGame={startGame} />
      ) : (
        <div className="relative w-screen h-screen overflow-hidden">
          <GameScene 
            carColor={carColor}
            maxSpeedFactor={maxSpeedFactor}
            gameState={gameState}
            updateGameState={setGameState}
            gameTime={gameTime}
          />
          <GameUI 
            gameState={gameState}
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            carColor={carColor}
            setCarColor={setCarColor}
            maxSpeedFactor={maxSpeedFactor}
            setMaxSpeedFactor={setMaxSpeedFactor}
            restartGame={restartGame}
          />
        </div>
      )}
    </div>
  );
};

export default Game;
