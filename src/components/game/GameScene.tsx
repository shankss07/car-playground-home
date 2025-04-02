
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Import game utilities
import { createPlayerCar } from './Car';
import { PoliceCar, createPoliceCar } from './PoliceCar';
import { createRoadSegment, createRoadObjectTypes } from './RoadSystem';
import { initThreeJS, handleResize } from './GameEngine';
import { GameState, updateGameState } from './GameStateManager';
import { shouldSpawnPoliceCar, spawnPoliceCar } from './PoliceSpawner';
import { setupAnimationLoop } from './AnimationSystem';
import { useKeyboardController, KeysPressed } from './KeyboardController';
import { setupRoadObjectGeneration, RoadObject } from './RoadObjectsManager';

interface GameSceneProps {
  carColor: number;
  maxSpeedFactor: number;
  gameState: GameState;
  updateGameState: (newState: GameState) => void;
  gameTime: { value: number };
}

interface RoadSegment {
  road: THREE.Mesh;
  laneMarking: THREE.Mesh;
  roadsideLeft: THREE.Mesh;
  roadsideRight: THREE.Mesh;
  zPosition: number;
}

const GameScene: React.FC<GameSceneProps> = ({ 
  carColor, 
  maxSpeedFactor, 
  gameState,
  updateGameState: setGameState,
  gameTime
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const keysPressed = useRef<KeysPressed>({});
  const animationFrameId = useRef<number | null>(null);
  const carPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  
  // Set up keyboard controller
  useKeyboardController({
    keysPressed,
    gameState,
    updateGameState: setGameState
  });

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize Three.js engine
    const { scene, camera, renderer } = initThreeJS(mountRef);
    
    // Game objects and variables
    const carGroup = createPlayerCar(carColor);
    carPositionRef.current = carGroup.position;
    
    scene.add(carGroup);

    // Game road system setup
    const roadWidth = 20;
    const roadLength = 1000;
    const roadSegments: RoadSegment[] = [];
    const roadSegmentLength = 100;
    const numRoadSegments = roadLength / roadSegmentLength;
    
    // Create initial road segments
    for (let i = 0; i < numRoadSegments; i++) {
      const zPosition = -i * roadSegmentLength;
      const segment = createRoadSegment(zPosition);
      roadSegments.push(segment);
      scene.add(segment.road, segment.laneMarking, segment.roadsideLeft, segment.roadsideRight);
    }
    
    // Road objects system
    const roadObjects: RoadObject[] = [];
    const maxRoadObjects = 100; // Maximum number of objects on the road at any time
    const roadObjectTypes = createRoadObjectTypes();
    
    // Set up road object generation
    const roadObjectManager = setupRoadObjectGeneration(
      scene, 
      roadObjects,
      roadObjectTypes,
      carPositionRef,
      maxRoadObjects
    );
    
    // Create police cars
    const policeCars: PoliceCar[] = [];
    
    // Create initial police cars at different positions
    policeCars.push(createPoliceCar(-5, -50));
    policeCars.push(createPoliceCar(5, -70));
    
    // Add police cars to scene
    policeCars.forEach(police => scene.add(police.mesh));
    
    // Handle window resize
    const resizeHandler = () => handleResize(camera, renderer);
    window.addEventListener('resize', resizeHandler);
    
    // Set up and start animation loop
    const animation = setupAnimationLoop({
      scene,
      camera,
      renderer,
      carGroup,
      keysPressed: keysPressed.current,
      maxSpeedFactor,
      roadSegments,
      roadObjects,
      policeCars,
      roadSegmentLength,
      numRoadSegments,
      gameState,
      setGameState,
      gameTime
    });
    
    animationFrameId.current = animation.animationFrameId.current;
    animation.startAnimation();
    
    // Update car material when color changes
    const existingCarBody = carGroup.children[0] as THREE.Mesh;
    if (existingCarBody && existingCarBody.material) {
      (existingCarBody.material as THREE.MeshStandardMaterial).color.set(carColor);
    }
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', resizeHandler);
      
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      // Clean up road object generation
      roadObjectManager.cleanup();
      
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [carColor, maxSpeedFactor, gameState, setGameState, gameTime]);

  return <div ref={mountRef} className="w-screen h-screen overflow-hidden"></div>;
};

export default GameScene;
