
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Import game subsystems
import { initThreeJS } from './ThreeJSInitializer';
import { handleResize, updateCamera } from './CameraSystem';
import { updateGameState, GameState } from './GameStateManager';
import { initializePlayerCar, updatePlayerCar, updateCarWheels, updateCarColor } from './CarController';
import { createPoliceSystem, updatePoliceSystem, updatePoliceLights } from './PoliceSystem';
import { initializeRoadSystem, updateRoadSystem, generateNewRoadObject } from './RoadManager';

// Define TypeScript interfaces
interface KeysPressed {
  [key: string]: boolean;
}

interface GameCanvasProps {
  carColor: number;
  maxSpeedFactor: number;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  carColor, 
  maxSpeedFactor, 
  gameState, 
  setGameState 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const keysPressed = useRef<KeysPressed>({});
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize Three.js engine
    const { scene, camera, renderer } = initThreeJS(mountRef);
    
    // Initialize player car
    const carGroup = initializePlayerCar(scene, carColor);
    let carState = { carSpeed: 0, carRotation: 0 };
    
    // Initialize road system
    const roadSegmentLength = 100;
    const roadLength = 1000; // Define roadLength variable
    const maxRoadObjects = 100;
    const { roadSegments, roadObjects, roadObjectTypes } = initializeRoadSystem(scene);
    
    // Initialize police system
    const policeCars = createPoliceSystem(scene);
    
    // Generate objects periodically
    const objectGenerationInterval = setInterval(() => {
      generateNewRoadObject(scene, roadObjects, roadObjectTypes, carGroup.position, maxRoadObjects);
    }, 500);
    
    // Flash police lights
    let lightFlashTime = 0;
    
    // Handle keyboard controls
    const handleKeyDown = (e: KeyboardEvent): void => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent): void => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Handle window resize
    const resizeHandler = () => handleResize(camera, renderer);
    window.addEventListener('resize', resizeHandler);
    
    // Game clock for time-based animations
    const clock = new THREE.Clock();
    
    // Game loop
    const animate = (): void => {
      const deltaTime = clock.getDelta();
      
      // Skip if game is over
      if (gameState.gameOver) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }
      
      // Update car physics and wheels
      carState = updatePlayerCar(carGroup, keysPressed.current, maxSpeedFactor, carState);
      updateCarWheels(carGroup, carState.carSpeed * 0.5);
      
      // Update police system
      const isColliding = updatePoliceSystem(policeCars, carGroup.position, gameState, deltaTime);
      
      // Flash police lights
      lightFlashTime += deltaTime;
      updatePoliceLights(policeCars, lightFlashTime);
      
      // Update road system
      updateRoadSystem(
        scene, 
        roadSegments, 
        roadObjects, 
        roadObjectTypes,
        carGroup.position,
        roadSegmentLength,
        roadLength / roadSegmentLength,
        maxRoadObjects
      );
      
      // Update camera position
      updateCamera(camera, carGroup.position, carState.carRotation);
      
      // Update game state with collision info
      const newGameState = updateGameState(gameState, deltaTime, isColliding);
      setGameState(newGameState);
      
      // Render scene
      renderer.render(scene, camera);
      
      // Continue animation loop
      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    // Start animation loop
    animate();
    
    // Update car color when it changes
    updateCarColor(carGroup, carColor);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(objectGenerationInterval);
      
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [carColor, maxSpeedFactor, gameState.gameOver]);

  return (
    <div ref={mountRef} className="w-screen h-screen overflow-hidden" />
  );
};

export default GameCanvas;
