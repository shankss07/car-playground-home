
import React, { useEffect, useRef } from 'react';
import { GameState } from './GameStateManager';

export interface KeysPressed {
  [key: string]: boolean;
}

interface KeyboardControllerProps {
  keysPressed: React.MutableRefObject<KeysPressed>;
  gameState: GameState;
  updateGameState: (newState: GameState) => void;
}

export const useKeyboardController = ({
  keysPressed,
  gameState,
  updateGameState
}: KeyboardControllerProps): void => {
  
  useEffect(() => {
    // Handle keyboard controls
    const handleKeyDown = (e: KeyboardEvent): void => {
      keysPressed.current[e.key.toLowerCase()] = true;
      
      // Restart game with 'r' key if game over
      if (e.key.toLowerCase() === 'r' && gameState.gameOver) {
        updateGameState({
          ...gameState,
          gameOver: false,
          score: 0,
          speedFactor: 1.0,
          health: 100,
          distanceTraveled: 0,
          paused: false,
          caught: false,
          caughtProgress: 0,
          timeSurvived: 0,
          spawnTimers: {
            lastPoliceSpawnTime: 0
          }
        });
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent): void => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keysPressed, gameState, updateGameState]);
};
