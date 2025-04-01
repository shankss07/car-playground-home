
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Import components
import GameSettings from '../components/game/GameSettings';
import StartScreen from '../components/game/StartScreen';
import GameHUD from '../components/game/GameHUD';

// Import game utilities
import { createPlayerCar, updateCarPhysics } from '../components/game/Car';
import { 
  PoliceCar, 
  createPoliceCar, 
  updatePoliceCar, 
  flashPoliceLights,
  spawnPoliceCar,
  resetPoliceCar
} from '../components/game/PoliceCar';
import { 
  createRoadSegment, 
  createRoadObjectTypes,
  updateRoadSegments,
  generateRoadObject,
  cleanupRoadObjects 
} from '../components/game/RoadSystem';
import { 
  initThreeJS, 
  handleResize, 
  updateCamera, 
  checkCarCollision,
  updateGameState,
  initialGameState,
  GameState
} from '../components/game/GameEngine';

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
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  
  // Start the game
  const startGame = () => {
    setGameStarted(true);
    setGameState(initialGameState);
  };

  // Restart game after game over
  const restartGame = () => {
    setGameState(initialGameState);
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
    
    // Create police cars pool
    const maxPoliceCars = 10; // Maximum number of police cars
    const policeCars: PoliceCar[] = [];
    
    // Create initial police cars
    for (let i = 0; i < 3; i++) {
      const spawnDistance = 50 + i * 10;
      const spawnAngle = Math.PI * 2 * (i / 3);
      const x = carGroup.position.x + Math.sin(spawnAngle) * spawnDistance;
      const z = carGroup.position.z + Math.cos(spawnAngle) * spawnDistance;
      
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
    let isColliding = false;
    
    // Game loop
    const animate = (): void => {
      const deltaTime = clock.getDelta();
      
      // Skip if game is over
      if (gameState.gameOver) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }
      
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
      
      // Activate/deactivate police cars based on current difficulty
      const activePoliceCarsNeeded = gameState.policeCarsCount;
      
      let activePoliceCars = 0;
      for (const police of policeCars) {
        if (activePoliceCars < activePoliceCarsNeeded) {
          if (!police.active) {
            // Activate this police car
            resetPoliceCar(police, carGroup.position);
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
      isColliding = false;
      for (let i = 0; i < policeCars.length; i++) {
        const police = policeCars[i];
        if (!police.active) continue;
        
        // Update police car AI with current difficulty
        updatePoliceCar(police, carGroup.position, deltaTime, gameState.difficulty);
        
        // Check for collision with player
        if (checkCarCollision(carGroup.position, police.mesh.position)) {
          isColliding = true;
          break; // One collision is enough to start the timer
        }
      }
      
      // Flash police lights
      lightFlashTime += deltaTime;
      flashPoliceLights(policeCars, lightFlashTime);
      
      // Update road segments
      updateRoadSegments(roadSegments, carGroup.position.z, roadSegmentLength, numRoadSegments);
      
      // Clean up road objects that are too far behind
      cleanupRoadObjects(roadObjects, scene, carGroup.position.z);
      
      // Update camera position
      updateCamera(camera, carGroup.position, carRotation);
      
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
  }, [carColor, maxSpeedFactor, gameStarted, gameState.gameOver]); // Re-run effect when car color or speed factor changes

  return (
    <div className="w-screen h-screen overflow-hidden bg-racing-dark">
      {!gameStarted ? (
        <StartScreen onStartGame={startGame} />
      ) : (
        <div className="relative w-screen h-screen overflow-hidden">
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
          <GameHUD 
            gameState={gameState}
            restartGame={restartGame}
          />
        </div>
      )}
    </div>
  );
};

export default Game;
