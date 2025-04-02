
import * as THREE from 'three';

// Define game state interface
export interface GameState {
  score: number;
  speedFactor: number;
  health: number;
  distanceTraveled: number;
  gameOver: boolean;
  paused: boolean;
  caught: boolean;
  caughtProgress: number;
  timeSurvived: number;
  spawnTimers: {
    lastPoliceSpawnTime: number;
  }
}

// Create default game state
export const createDefaultGameState = (): GameState => {
  return {
    score: 0,
    speedFactor: 1.0,
    health: 100,
    distanceTraveled: 0,
    gameOver: false,
    paused: false,
    caught: false,
    caughtProgress: 0,
    timeSurvived: 0,
    spawnTimers: {
      lastPoliceSpawnTime: 0
    }
  };
};

// Update game state based on car position and time
export const updateGameState = (
  gameState: GameState,
  carPosition: THREE.Vector3,
  deltaTime: number,
  policeContacts: {touching: boolean, duration: number}[]
): GameState => {
  // Copy the current state to avoid direct mutations
  const newState = { ...gameState };
  
  // Update distance traveled (convert to kilometers and round to 2 decimal places)
  newState.distanceTraveled += (Math.abs(carPosition.z) * deltaTime * 0.01);
  newState.distanceTraveled = Math.round(newState.distanceTraveled * 100) / 100;
  
  // Update score based on distance
  newState.score = Math.floor(newState.distanceTraveled * 10);
  
  // Update time survived
  newState.timeSurvived += deltaTime;
  
  // Update caught progress based on police contacts
  let maxContactDuration = 0;
  for (const contact of policeContacts) {
    if (contact.touching && contact.duration > maxContactDuration) {
      maxContactDuration = contact.duration;
    }
  }
  
  // Maximum duration for being caught is 5 seconds
  const maxCaughtTime = 5;
  
  // Update caught progress (0-1 range)
  newState.caughtProgress = Math.min(1, maxContactDuration / maxCaughtTime);
  
  // Determine if player is caught
  newState.caught = newState.caughtProgress >= 1;
  
  // Determine if game is over
  newState.gameOver = newState.caught;
  
  return newState;
};

// Function to determine if it's time to spawn a new police car
export const shouldSpawnPoliceCar = (gameState: GameState, currentTime: number): boolean => {
  // Base time between police car spawns (in seconds)
  const baseSpawnInterval = 30; 
  
  // Reduce spawn interval as game progresses (minimum 10 seconds between spawns)
  const adjustedInterval = Math.max(10, baseSpawnInterval - Math.floor(gameState.timeSurvived / 60));
  
  // Check if enough time has passed since last spawn
  if (currentTime - gameState.spawnTimers.lastPoliceSpawnTime > adjustedInterval) {
    return true;
  }
  
  return false;
};
