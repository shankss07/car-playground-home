
import * as THREE from 'three';
import { PoliceCar, createPoliceCar } from './PoliceCar';
import { GameState } from './GameStateManager';

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

// Function to spawn a new police car
export const spawnPoliceCar = (
  scene: THREE.Scene,
  playerPosition: THREE.Vector3,
  policeCars: PoliceCar[],
  spawnDistance: number = 100
): PoliceCar => {
  // Spawn a new police car behind the player at a random angle
  const spawnAngle = Math.random() * Math.PI * 2; // Random angle
  const spawnX = playerPosition.x + Math.sin(spawnAngle) * spawnDistance;
  const spawnZ = playerPosition.z + Math.cos(spawnAngle) * spawnDistance;
  
  const newPoliceCar = createPoliceCar(spawnX, spawnZ);
  policeCars.push(newPoliceCar);
  scene.add(newPoliceCar.mesh);
  
  return newPoliceCar;
};
