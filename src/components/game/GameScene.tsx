
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Import game utilities
import { createPlayerCar, updateCarPhysics } from './Car';
import { 
  PoliceCar, 
  createPoliceCar, 
  updatePoliceCar, 
  flashPoliceLights, 
  updatePoliceContact
} from './PoliceCar';
import { 
  createRoadSegment, 
  createRoadObjectTypes,
  updateRoadSegments,
  generateRoadObject,
  cleanupRoadObjects 
} from './RoadSystem';
import { initThreeJS, handleResize } from './GameEngine';
import { GameState } from './GameStateManager';

interface GameSceneProps {
  carColor: number;
  maxSpeedFactor: number;
  gameState: GameState;
  updateGameState: (newState: GameState) => void;
  gameTime: { value: number };
}

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

const GameScene: React.FC<GameSceneProps> = ({ 
  carColor, 
  maxSpeedFactor, 
  gameState,
  updateGameState,
  gameTime
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const keysPressed = useRef<KeysPressed>({});
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

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

    // Handle keyboard controls
    const handleKeyDown = (e: KeyboardEvent): void => {
      keysPressed.current[e.key.toLowerCase()] = true;
      
      // Restart game with 'r' key if game over
      if (e.key.toLowerCase() === 'r' && gameState.gameOver) {
        updateGameState({
          ...gameState,
          gameOver: false,
          score: 0,
          speedFactor: 1.0,
          health: 100,
          distanceTraveled: 0,
          paused: false,
          caught: false,
          caughtProgress: 0,
          timeSurvived: 0,
          spawnTimers: {
            lastPoliceSpawnTime: 0
          }
        });
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
      // Assuming updateCamera function is imported from CameraSystem
      const updateCamera = (
        camera: THREE.PerspectiveCamera, 
        carPosition: THREE.Vector3, 
        carRotation: number
      ): void => {
        const cameraDistance = 10;
        const cameraHeight = 5;
        const cameraLagFactor = 0.1; // How quickly camera follows car
        
        // Calculate ideal camera position
        const idealCameraX = carPosition.x - Math.sin(carRotation) * cameraDistance;
        const idealCameraZ = carPosition.z - Math.cos(carRotation) * cameraDistance;
        
        // Smooth camera movement
        camera.position.x += (idealCameraX - camera.position.x) * cameraLagFactor;
        camera.position.z += (idealCameraZ - camera.position.z) * cameraLagFactor;
        camera.position.y = cameraHeight;
        
        // Make camera look at car
        camera.lookAt(
          carPosition.x,
          carPosition.y + 1.5, // Look at car roof
          carPosition.z
        );
      };
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
        updateGameState({
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
      
      // Import the necessary functions from GameStateManager
      const updateGameStateFromManager = (
        gameState: GameState,
        carPosition: THREE.Vector3,
        deltaTime: number,
        policeContacts: { touching: boolean, duration: number }[]
      ): GameState => {
        // Copy the current state to avoid direct mutations
        const newState = { ...gameState };
        
        // Update distance traveled (convert to kilometers and round to 2 decimal places)
        newState.distanceTraveled += (Math.abs(carPosition.z) * deltaTime * 0.01);
        newState.distanceTraveled = Math.round(newState.distanceTraveled * 100) / 100;
        
        // Update score based on distance
        newState.score = Math.floor(newState.distanceTraveled * 10);
        
        // Update time survived
        newState.timeSurvived += deltaTime;
        
        // Update caught progress based on police contacts
        let maxContactDuration = 0;
        for (const contact of policeContacts) {
          if (contact.touching && contact.duration > maxContactDuration) {
            maxContactDuration = contact.duration;
          }
        }
        
        // Maximum duration for being caught is 5 seconds
        const maxCaughtTime = 5;
        
        // Update caught progress (0-1 range)
        newState.caughtProgress = Math.min(1, maxContactDuration / maxCaughtTime);
        
        // Determine if player is caught
        newState.caught = newState.caughtProgress >= 1;
        
        // Determine if game is over
        newState.gameOver = newState.caught;
        
        return newState;
      };

      const shouldSpawnPoliceCar = (gameState: GameState, currentTime: number): boolean => {
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
      
      // Update game state
      const newGameState = updateGameStateFromManager(
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
        updateGameState(newGameState);
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
  }, [carColor, maxSpeedFactor, gameState, updateGameState, gameTime]);

  return <div ref={mountRef} className="w-screen h-screen overflow-hidden"></div>;
};

export default GameScene;
