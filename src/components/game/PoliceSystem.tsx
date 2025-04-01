
import * as THREE from 'three';
import { PoliceCar, createPoliceCar, updatePoliceCar, flashPoliceLights, resetPoliceCar } from './PoliceCar';
import { GameState } from './GameEngine';

interface PoliceSystemProps {
  scene: THREE.Scene;
  playerPosition: THREE.Vector3;
  gameState: GameState;
  deltaTime: number;
}

export const createPoliceSystem = (scene: THREE.Scene): PoliceCar[] => {
  // Maximum number of police cars
  const maxPoliceCars = 10;
  const policeCars: PoliceCar[] = [];
  
  // Create initial police cars
  for (let i = 0; i < 3; i++) {
    const spawnDistance = 50 + i * 10;
    const spawnAngle = Math.PI * 2 * (i / 3);
    const x = Math.sin(spawnAngle) * spawnDistance;
    const z = Math.cos(spawnAngle) * spawnDistance;
    
    const police = createPoliceCar(x, z);
    policeCars.push(police);
    scene.add(police.mesh);
  }
  
  // Set remaining police cars as inactive initially
  for (let i = 3; i < maxPoliceCars; i++) {
    const police = createPoliceCar(0, 0);
    police.active = false;
    police.mesh.visible = false;
    policeCars.push(police);
    scene.add(police.mesh);
  }
  
  return policeCars;
};

export const updatePoliceSystem = (
  policeCars: PoliceCar[], 
  playerPosition: THREE.Vector3, 
  gameState: GameState,
  deltaTime: number
): boolean => {
  // Activate/deactivate police cars based on current difficulty
  const activePoliceCarsNeeded = gameState.policeCarsCount;
  
  let activePoliceCars = 0;
  for (const police of policeCars) {
    if (activePoliceCars < activePoliceCarsNeeded) {
      if (!police.active) {
        // Activate this police car
        resetPoliceCar(police, playerPosition);
        police.mesh.visible = true;
      }
      activePoliceCars++;
    } else if (police.active) {
      // Deactivate excess police cars
      police.active = false;
      police.mesh.visible = false;
    }
  }
  
  // Update police cars and check for collisions
  let isColliding = false;
  for (let i = 0; i < policeCars.length; i++) {
    const police = policeCars[i];
    if (!police.active) continue;
    
    // Update police car AI with current difficulty
    updatePoliceCar(police, playerPosition, deltaTime, gameState.difficulty);
    
    // Check for collision with player
    const dx = playerPosition.x - police.mesh.position.x;
    const dz = playerPosition.z - police.mesh.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < 3.0) { // Collision distance
      isColliding = true;
      break; // One collision is enough to start the timer
    }
  }
  
  return isColliding;
};

export const updatePoliceLights = (
  policeCars: PoliceCar[],
  lightFlashTime: number
): void => {
  flashPoliceLights(policeCars, lightFlashTime);
};
