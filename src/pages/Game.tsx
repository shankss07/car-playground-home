
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Import components
import GameSettings from '../components/game/GameSettings';
import StartScreen from '../components/game/StartScreen';

// Import game utilities
import { createPlayerCar, updateCarPhysics } from '../components/game/Car';
import { 
  PoliceCar, 
  createPoliceCar, 
  updatePoliceCar, 
  flashPoliceLights, 
  updatePoliceContact,
  isPlayerCaught
} from '../components/game/PoliceCar';
import { 
  createRoadSegment, 
  createRoadObjectTypes,
  updateRoadSegments,
  generateRoadObject,
  cleanupRoadObjects 
} from '../components/game/RoadSystem';
import { initThreeJS, handleResize, updateCamera } from '../components/game/GameEngine';
import { checkVehicleCollision } from '../components/game/CollisionSystem';
import {
  createDefaultGameState,
  updateGameState,
  shouldSpawnPoliceCar,
  GameState
} from '../components/game/GameStateManager';

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
  const [gameState, setGameState] = useState<GameState>(createDefaultGameState());
  
  // Start the game
  const startGame = () => {
    setGameStarted(true);
    setGameState(createDefaultGameState());
  };

  // Restart the game
  const restartGame = () => {
    setGameState(createDefaultGameState());
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
    
    // Create initial police cars at different positions
    policeCars.push(createPoliceCar(-5, -50));
    policeCars.push(createPoliceCar(5, -70));
    
    // Add police cars to scene
    policeCars.forEach(police => scene.add(police.mesh));
    
    // Flash police lights
    let lightFlashTime = 0;
    
    // Game time tracking
    const gameTime = { value: 0 };

    // Handle keyboard controls
    const handleKeyDown = (e: KeyboardEvent): void => {
      keysPressed.current[e.key.toLowerCase()] = true;
      
      // Restart game with 'r' key if game over
      if (e.key.toLowerCase() === 'r' && gameState.gameOver) {
        restartGame();
      }
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
        // Spawn a new police car behind the player
        const spawnDistance = 100;
        const spawnAngle = Math.random() * Math.PI * 2; // Random angle
        const spawnX = carGroup.position.x + Math.sin(spawnAngle) * spawnDistance;
        const spawnZ = carGroup.position.z + Math.cos(spawnAngle) * spawnDistance;
        
        const newPoliceCar = createPoliceCar(spawnX, spawnZ);
        policeCars.push(newPoliceCar);
        scene.add(newPoliceCar.mesh);
        
        // Update last spawn time
        setGameState(prevState => ({
          ...prevState,
          spawnTimers: {
            ...prevState.spawnTimers,
            lastPoliceSpawnTime: gameTime.value
          }
        }));
      }
      
      // Prepare police contact data for game state update
      const policeContacts = policeCars.map(police => {
        return {
          touching: police.touchingPlayer,
          duration: police.touchStartTime ? gameTime.value - police.touchStartTime : 0
        };
      });
      
      // Update game state
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
  }, [carColor, maxSpeedFactor, gameStarted, gameState.gameOver]); // Added gameOver to dependency array

  // Create a UI to show the player's caught progress and game state
  const renderGameStateUI = () => {
    if (!gameStarted) return null;
    
    return (
      <div className="fixed inset-x-0 top-0 p-4 z-10">
        <div className="bg-black/50 text-white p-2 rounded mb-2">
          <p>Score: {gameState.score}</p>
          <p>Distance: {gameState.distanceTraveled.toFixed(2)} km</p>
          <p>Time: {Math.floor(gameState.timeSurvived)} seconds</p>
        </div>
        
        {/* Show caught progress when being caught */}
        {gameState.caughtProgress > 0 && !gameState.gameOver && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-red-600 h-2.5 rounded-full" 
              style={{ width: `${gameState.caughtProgress * 100}%` }}
            ></div>
          </div>
        )}
        
        {/* Game over screen */}
        {gameState.gameOver && (
          <div className="fixed inset-0 flex items-center justify-center z-20 bg-black/70">
            <div className="bg-white p-8 rounded shadow-lg text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">BUSTED!</h2>
              <p className="mb-4">You were caught by the police!</p>
              <p className="mb-2">Final Score: {gameState.score}</p>
              <p className="mb-2">Distance Traveled: {gameState.distanceTraveled.toFixed(2)} km</p>
              <p className="mb-4">Time Survived: {Math.floor(gameState.timeSurvived)} seconds</p>
              <button 
                onClick={restartGame} 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Try Again
              </button>
              <p className="mt-4 text-sm text-gray-500">Press 'R' to restart</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-racing-dark">
      {!gameStarted ? (
        <StartScreen onStartGame={startGame} />
      ) : (
        <div className="relative w-screen h-screen overflow-hidden">
          <div ref={mountRef} className="w-screen h-screen overflow-hidden"></div>
          {renderGameStateUI()}
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
