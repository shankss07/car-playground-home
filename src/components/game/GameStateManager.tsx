
import * as THREE from 'three';

// Define game state interface
export interface GameState {
  score: number;
  speedFactor: number;
  health: number;
  distanceTraveled: number;
  gameOver: boolean;
  paused: boolean;
}

// Create default game state
export const createDefaultGameState = (): GameState => {
  return {
    score: 0,
    speedFactor: 1.0,
    health: 100,
    distanceTraveled: 0,
    gameOver: false,
    paused: false
  };
};

// Update game state based on car position and time
export const updateGameState = (
  gameState: GameState,
  carPosition: THREE.Vector3,
  deltaTime: number
): GameState => {
  // Copy the current state to avoid direct mutations
  const newState = { ...gameState };
  
  // Update distance traveled (convert to kilometers and round to 2 decimal places)
  newState.distanceTraveled += (Math.abs(carPosition.z) * deltaTime * 0.01);
  newState.distanceTraveled = Math.round(newState.distanceTraveled * 100) / 100;
  
  // Update score based on distance
  newState.score = Math.floor(newState.distanceTraveled * 10);
  
  return newState;
};
