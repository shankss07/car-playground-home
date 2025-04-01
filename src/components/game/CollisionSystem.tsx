
import * as THREE from 'three';
import { GameState } from './GameStateManager';

// Check collision between player car and police cars
export const checkCarCollision = (
  playerPosition: THREE.Vector3,
  policePosition: THREE.Vector3,
  collisionDistance: number = 3.0 // Adjust based on car size
): boolean => {
  // Calculate distance between player and police car
  const dx = playerPosition.x - policePosition.x;
  const dz = playerPosition.z - policePosition.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  
  // Return true if collision detected
  return distance < collisionDistance;
};

// Track collision duration with a specific police car
export const updateCollisionTimer = (
  isColliding: boolean,
  collisionStartTime: number | null,
  currentTime: number
): {
  collisionStartTime: number | null;
  collisionDuration: number;
} => {
  let updatedStartTime = collisionStartTime;
  let duration = 0;
  
  if (isColliding) {
    if (collisionStartTime === null) {
      // Collision just started
      updatedStartTime = currentTime;
    } else {
      // Calculate how long collision has been happening
      duration = currentTime - collisionStartTime;
    }
  } else {
    // No collision, reset timer
    updatedStartTime = null;
  }
  
  return {
    collisionStartTime: updatedStartTime,
    collisionDuration: duration
  };
};
