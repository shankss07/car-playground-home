
import React from 'react';
import { GameState } from './GameStateManager';
import GameSettings from './GameSettings';

interface GameUIProps {
  gameState: GameState;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  carColor: number;
  setCarColor: (color: number) => void;
  maxSpeedFactor: number;
  setMaxSpeedFactor: (factor: number) => void;
  restartGame: () => void;
}

const GameUI: React.FC<GameUIProps> = ({
  gameState,
  showSettings,
  setShowSettings,
  carColor,
  setCarColor,
  maxSpeedFactor,
  setMaxSpeedFactor,
  restartGame
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Game stats UI */}
      <div className="fixed inset-x-0 top-0 p-4 z-10 pointer-events-auto">
        <div className="bg-black/50 text-white p-2 rounded mb-2">
          <p>Score: {gameState.score}</p>
          <p>Distance: {gameState.distanceTraveled.toFixed(2)} km</p>
          <p>Time: {Math.floor(gameState.timeSurvived)} seconds</p>
        </div>
        
        {/* Show caught progress when being caught */}
        {gameState.caughtProgress > 0 && !gameState.gameOver && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-red-600 h-2.5 rounded-full" 
              style={{ width: `${gameState.caughtProgress * 100}%` }}
            ></div>
          </div>
        )}
        
        {/* Game over screen */}
        {gameState.gameOver && (
          <div className="fixed inset-0 flex items-center justify-center z-20 bg-black/70 pointer-events-auto">
            <div className="bg-white p-8 rounded shadow-lg text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">BUSTED!</h2>
              <p className="mb-4">You were caught by the police!</p>
              <p className="mb-2">Final Score: {gameState.score}</p>
              <p className="mb-2">Distance Traveled: {gameState.distanceTraveled.toFixed(2)} km</p>
              <p className="mb-4">Time Survived: {Math.floor(gameState.timeSurvived)} seconds</p>
              <button 
                onClick={restartGame} 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Try Again
              </button>
              <p className="mt-4 text-sm text-gray-500">Press 'R' to restart</p>
            </div>
          </div>
        )}
      </div>

      {/* Settings panel */}
      <div className="pointer-events-auto">
        <GameSettings
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          carColor={carColor}
          setCarColor={setCarColor}
          maxSpeedFactor={maxSpeedFactor}
          setMaxSpeedFactor={setMaxSpeedFactor}
        />
      </div>
    </div>
  );
};

export default GameUI;
