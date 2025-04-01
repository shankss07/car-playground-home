
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Import components
import GameSettings from '../components/game/GameSettings';
import StartScreen from '../components/game/StartScreen';

// Import game utilities
import { createPlayerCar, updateCarPhysics } from '../components/game/Car';
import { PoliceCar, createPoliceCar, updatePoliceCar, flashPoliceLights } from '../components/game/PoliceCar';
import { 
  createRoadSegment, 
  createRoadObjectTypes,
  updateRoadSegments,
  generateRoadObject,
  cleanupRoadObjects 
} from '../components/game/RoadSystem';
import { initThreeJS, handleResize, updateCamera } from '../components/game/GameEngine';

// Define TypeScript interfaces
interface KeysPressed {
  [key: string]: boolean;
}

interface RoadSegment {
  road: THREE.Mesh;
  laneMarking: THREE.Mesh;
  roadsideLeft: THREE.Mesh;
  roadsideRight: THREE.Mesh;
  zPosition: number;
}

interface RoadObject {
  mesh: THREE.Group | THREE.Mesh;
  type: string;
  collisionRadius: number;
}

const Game: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const keysPressed = useRef<KeysPressed>({});
  const animationFrameId = useRef<number | null>(null);
  const [carColor, setCarColor] = useState<number>(0xff0000); // Default red
  const [maxSpeedFactor, setMaxSpeedFactor] = useState<number>(1); // Default speed multiplier
  const [showSettings, setShowSettings] = useState<boolean>(true);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  
  // Start the game
  const startGame = () => {
    setGameStarted(true);
  };

  useEffect(() => {
    if (!mountRef.current || !gameStarted) return;

    // Initialize Three.js engine
    const { scene, camera, renderer } = initThreeJS(mountRef);
    
    // Game objects and variables
    const carGroup = createPlayerCar(carColor);
    let carSpeed = 0;
    let carRotation = 0;
    
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
    
    // Generate objects periodically
    const objectGenerationInterval = setInterval(() => {
      const roadObject = generateRoadObject(roadObjects, roadObjectTypes, carGroup.position, maxRoadObjects);
      if (roadObject) {
        roadObjects.push(roadObject);
        scene.add(roadObject.mesh);
      }
    }, 500);
    
    // Create police cars
    const policeCars: PoliceCar[] = [];
    
    // Create 3 police cars at different positions
    policeCars.push(createPoliceCar(-5, -50));
    policeCars.push(createPoliceCar(5, -70));
    policeCars.push(createPoliceCar(0, -90));
    
    // Add police cars to scene
    policeCars.forEach(police => scene.add(police.mesh));
    
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
      
      // Update car physics
      const carPhysicsUpdate = updateCarPhysics(
        carGroup, 
        keysPressed.current,
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
      
      // Render scene
      renderer.render(scene, camera);
      
      // Continue animation loop
      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    // Start animation loop
    animate();
    
    // Update car material when color changes
    const existingCarBody = carGroup.children[0] as THREE.Mesh;
    if (existingCarBody && existingCarBody.material) {
      (existingCarBody.material as THREE.MeshStandardMaterial).color.set(carColor);
    }
    
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
  }, [carColor, maxSpeedFactor, gameStarted]); // Re-run effect when car color or speed factor changes

  return (
    <div className="w-screen h-screen overflow-hidden bg-racing-dark">
      {!gameStarted ? (
        <StartScreen onStartGame={startGame} />
      ) : (
        <div ref={mountRef} className="w-screen h-screen overflow-hidden">
          <GameSettings
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            carColor={carColor}
            setCarColor={setCarColor}
            maxSpeedFactor={maxSpeedFactor}
            setMaxSpeedFactor={setMaxSpeedFactor}
          />
        </div>
      )}
    </div>
  );
};

export default Game;
