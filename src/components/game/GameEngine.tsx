
import * as THREE from 'three';
import { setupLighting } from './LightingSystem';
import { setupCamera, updateCamera, handleResize } from './CameraSystem';
import { checkCarCollision, updateCollisionTimer } from './CollisionSystem';
import { initThreeJS } from './ThreeJSInitializer';
import { GameState, initialGameState, updateGameState } from './GameStateManager';

// Re-export everything for backward compatibility
export { 
  setupLighting,
  setupCamera, 
  updateCamera,
  handleResize,
  checkCarCollision,
  updateCollisionTimer,
  initThreeJS,
  // Types
  GameState,
  initialGameState,
  updateGameState
};
