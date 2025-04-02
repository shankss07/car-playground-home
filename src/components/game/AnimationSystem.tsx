
import * as THREE from 'three';
import { GameState } from './GameStateManager';
import { PoliceCar, updatePoliceCar, flashPoliceLights, updatePoliceContact } from './PoliceCar';
import { updateRoadSegments, cleanupRoadObjects } from './RoadSystem';
import { updateCarPhysics } from './Car';
import { updateCamera } from './CameraSystem';
import { shouldSpawnPoliceCar, spawnPoliceCar } from './PoliceSpawner';

interface AnimationSystemProps {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  carGroup: THREE.Group;
  keysPressed: { [key: string]: boolean };
  maxSpeedFactor: number;
  roadSegments: any[];
  roadObjects: any[];
  policeCars: PoliceCar[];
  roadSegmentLength: number;
  numRoadSegments: number;
  gameState: GameState;
  setGameState: (newState: GameState) => void;
  gameTime: { value: number };
}

export const setupAnimationLoop = ({
  scene,
  camera, 
  renderer,
  carGroup,
  keysPressed,
  maxSpeedFactor,
  roadSegments,
  roadObjects,
  policeCars,
  roadSegmentLength,
  numRoadSegments,
  gameState,
  setGameState,
  gameTime
}: AnimationSystemProps): {
  startAnimation: () => void;
  stopAnimation: () => number | null;
  animationFrameId: { current: number | null };
} => {
  // Initialize variables
  let carSpeed = 0;
  let carRotation = 0;
  let lightFlashTime = 0;
  const animationFrameId = { current: null };

  // Game clock for time-based animations
  const clock = new THREE.Clock();
    
  // Animation loop function  
  const animate = (): void => {
    const deltaTime = clock.getDelta();
    gameTime.value += deltaTime;
    
    // If game over, don't update game physics
    if (gameState.gameOver) {
      // Just render the scene
      renderer.render(scene, camera);
      animationFrameId.current = requestAnimationFrame(animate);
      return;
    }
    
    // Update car physics
    const carPhysicsUpdate = updateCarPhysics(
      carGroup, 
      keysPressed,
      maxSpeedFactor,
      carSpeed,
      carRotation
    );
    
    carSpeed = carPhysicsUpdate.carSpeed;
    carRotation = carPhysicsUpdate.carRotation;
    
    // Animate wheels based on speed
    const wheelRotationSpeed = carSpeed * 0.5;
    // Access wheels from carGroup children
    const wheelFL = carGroup.children[2] as THREE.Mesh;
    const wheelFR = carGroup.children[3] as THREE.Mesh;
    const wheelRL = carGroup.children[4] as THREE.Mesh;
    const wheelRR = carGroup.children[5] as THREE.Mesh;
    
    wheelFL.rotation.x += wheelRotationSpeed;
    wheelFR.rotation.x += wheelRotationSpeed;
    wheelRL.rotation.x += wheelRotationSpeed;
    wheelRR.rotation.x += wheelRotationSpeed;
    
    // Update police cars
    policeCars.forEach(police => {
      updatePoliceCar(police, carGroup.position, deltaTime);
      updatePoliceContact(police, carGroup, gameTime.value);
    });
    
    // Flash police lights
    lightFlashTime += deltaTime;
    flashPoliceLights(policeCars, lightFlashTime);
    
    // Update road segments
    updateRoadSegments(roadSegments, carGroup.position.z, roadSegmentLength, numRoadSegments);
    
    // Clean up road objects that are too far behind
    cleanupRoadObjects(roadObjects, scene, carGroup.position.z);
    
    // Update camera position
    updateCamera(camera, carGroup.position, carRotation);
    
    // Check if we should spawn a new police car
    if (shouldSpawnPoliceCar(gameState, gameTime.value)) {
      // Spawn a new police car using our utility function
      spawnPoliceCar(scene, carGroup.position, policeCars);
      
      // Update last spawn time
      setGameState({
        ...gameState,
        spawnTimers: {
          ...gameState.spawnTimers,
          lastPoliceSpawnTime: gameTime.value
        }
      });
    }
    
    // Prepare police contact data for game state update
    const policeContacts = policeCars.map(police => {
      return {
        touching: police.touchingPlayer,
        duration: police.touchStartTime ? gameTime.value - police.touchStartTime : 0
      };
    });
    
    // Update game state using the imported function from GameStateManager
    const newGameState = updateGameState(
      gameState,
      carGroup.position,
      deltaTime,
      policeContacts
    );
    
    // Only update state if something changed
    if (
      newGameState.score !== gameState.score ||
      newGameState.caught !== gameState.caught ||
      newGameState.caughtProgress !== gameState.caughtProgress ||
      newGameState.gameOver !== gameState.gameOver
    ) {
      setGameState(newGameState);
    }
    
    // Render scene
    renderer.render(scene, camera);
    
    // Continue animation loop
    animationFrameId.current = requestAnimationFrame(animate);
  };

  const startAnimation = (): void => {
    if (animationFrameId.current === null) {
      animate();
    }
  };

  const stopAnimation = (): number | null => {
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
      const frameId = animationFrameId.current;
      animationFrameId.current = null;
      return frameId;
    }
    return null;
  };

  return {
    startAnimation,
    stopAnimation,
    animationFrameId
  };
};

export const updateGameState = (gameState: GameState, gameTime: number): GameState => {
  // Any additional game state updates beyond core physics
  return gameState;
};
