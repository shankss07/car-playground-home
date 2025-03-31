
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';

// Define TypeScript interfaces
interface ColorOption {
  name: string;
  hex: number;
}

interface KeysPressed {
  [key: string]: boolean;
}

const Game: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const keysPressed = useRef<KeysPressed>({});
  const animationFrameId = useRef<number | null>(null);
  const [carColor, setCarColor] = useState<number>(0xff0000); // Default red
  const [maxSpeedFactor, setMaxSpeedFactor] = useState<number>(1); // Default speed multiplier
  const [showSettings, setShowSettings] = useState<boolean>(true);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Available car colors with names
  const colorOptions: ColorOption[] = [
    { name: "Red", hex: 0xff0000 },
    { name: "Blue", hex: 0x0000ff },
    { name: "Green", hex: 0x00ff00 },
    { name: "Yellow", hex: 0xffff00 },
    { name: "Purple", hex: 0x800080 },
    { name: "Orange", hex: 0xffa500 },
    { name: "Black", hex: 0x000000 },
    { name: "White", hex: 0xffffff }
  ];
  
  // Start the game
  const startGame = () => {
    setGameStarted(true);
  };

  useEffect(() => {
    if (!mountRef.current || !gameStarted) return;

    // Three.js initialization
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87CEEB); // Sky blue background
    renderer.shadowMap.enabled = true;
    
    // Add renderer to DOM
    mountRef.current.appendChild(renderer.domElement);
    
    // Handle window resize
    const handleResize = (): void => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    
    // Game objects and variables
    const carGroup = new THREE.Group();
    let carSpeed = 0;
    let carRotation = 0;
    
    // Car physics parameters
    const BASE_MAX_SPEED = 0.5;
    const MAX_SPEED = BASE_MAX_SPEED * maxSpeedFactor;
    const ACCELERATION = 0.01 * maxSpeedFactor;
    const DECELERATION = 0.005;
    const ROTATION_SPEED = 0.05;
    
    // Create car body
    const carBodyGeometry = new THREE.BoxGeometry(2, 1, 4);
    const carBodyMaterial = new THREE.MeshStandardMaterial({ color: carColor });
    const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
    carBody.position.y = 0.5;
    carBody.castShadow = true;
    carGroup.add(carBody);
    
    // Create car cabin
    const cabinGeometry = new THREE.BoxGeometry(1.5, 0.8, 2);
    const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.y = 1.4;
    cabin.position.z = -0.5;
    cabin.castShadow = true;
    carGroup.add(cabin);
    
    // Create wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32);
    wheelGeometry.rotateX(Math.PI / 2); // Rotate to align with car direction
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    // Front-left wheel
    const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFL.position.set(-1.2, 0.5, -1.2);
    wheelFL.castShadow = true;
    carGroup.add(wheelFL);
    
    // Front-right wheel
    const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFR.position.set(1.2, 0.5, -1.2);
    wheelFR.castShadow = true;
    carGroup.add(wheelFR);
    
    // Rear-left wheel
    const wheelRL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRL.position.set(-1.2, 0.5, 1.2);
    wheelRL.castShadow = true;
    carGroup.add(wheelRL);
    
    // Rear-right wheel
    const wheelRR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRR.position.set(1.2, 0.5, 1.2);
    wheelRR.castShadow = true;
    carGroup.add(wheelRR);
    
    // Add car to scene
    carGroup.position.set(0, 0, 0);
    scene.add(carGroup);
    
    // Create ground (infinite grid)
    const gridSize = 1000;
    const gridDivisions = 100;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x888888);
    scene.add(gridHelper);
    
    // Create ground plane for shadows
    const groundGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a7f1e, 
      side: THREE.DoubleSide,
      roughness: 0.8 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = -0.01; // Slightly below the grid
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Position camera for 3rd person view
    camera.position.set(0, 5, 10);
    camera.lookAt(carGroup.position);
    
    // Add some environment objects - trees, rocks, etc.
    function createTree(x: number, z: number): void {
      const treeGroup = new THREE.Group();
      
      // Tree trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
      const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 2;
      trunk.castShadow = true;
      treeGroup.add(trunk);
      
      // Tree foliage
      const foliageGeometry = new THREE.ConeGeometry(3, 6, 8);
      const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x006400 });
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.y = 6;
      foliage.castShadow = true;
      treeGroup.add(foliage);
      
      treeGroup.position.set(x, 0, z);
      scene.add(treeGroup);
    }
    
    // Create some random trees
    for (let i = 0; i < 50; i++) {
      const x = (Math.random() - 0.5) * gridSize * 0.8;
      const z = (Math.random() - 0.5) * gridSize * 0.8;
      // Don't place trees too close to start position
      if (Math.sqrt(x * x + z * z) > 20) {
        createTree(x, z);
      }
    }
    
    // Handle keyboard controls
    const handleKeyDown = (e: KeyboardEvent): void => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent): void => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Game loop
    const animate = (): void => {
      // Handle car acceleration/deceleration
      if (keysPressed.current['w']) {
        carSpeed = Math.min(MAX_SPEED, carSpeed + ACCELERATION);
      } else if (keysPressed.current['s']) {
        carSpeed = Math.max(-MAX_SPEED * 0.5, carSpeed - ACCELERATION);
      } else {
        // Apply deceleration when no keys pressed
        if (carSpeed > 0) {
          carSpeed = Math.max(0, carSpeed - DECELERATION);
        } else if (carSpeed < 0) {
          carSpeed = Math.min(0, carSpeed + DECELERATION);
        }
      }
      
      // Handle car rotation (only when moving)
      if (Math.abs(carSpeed) > 0.01) {
        if (keysPressed.current['a']) {
          carRotation += ROTATION_SPEED * (carSpeed > 0 ? 1 : -1);
        }
        if (keysPressed.current['d']) {
          carRotation -= ROTATION_SPEED * (carSpeed > 0 ? 1 : -1);
        }
      }
      
      // Apply rotation to car model
      carGroup.rotation.y = carRotation;
      
      // Move car forward based on speed and rotation
      carGroup.position.x += Math.sin(carRotation) * carSpeed;
      carGroup.position.z += Math.cos(carRotation) * carSpeed;
      
      // Animate wheels based on speed
      const wheelRotationSpeed = carSpeed * 0.5;
      wheelFL.rotation.x += wheelRotationSpeed;
      wheelFR.rotation.x += wheelRotationSpeed;
      wheelRL.rotation.x += wheelRotationSpeed;
      wheelRR.rotation.x += wheelRotationSpeed;
      
      // Update camera position for 3rd person view
      const cameraDistance = 10;
      const cameraHeight = 5;
      const cameraLagFactor = 0.1; // How quickly camera follows car
      
      // Calculate ideal camera position
      const idealCameraX = carGroup.position.x - Math.sin(carRotation) * cameraDistance;
      const idealCameraZ = carGroup.position.z - Math.cos(carRotation) * cameraDistance;
      
      // Smooth camera movement
      camera.position.x += (idealCameraX - camera.position.x) * cameraLagFactor;
      camera.position.z += (idealCameraZ - camera.position.z) * cameraLagFactor;
      camera.position.y = cameraHeight;
      
      // Make camera look at car
      camera.lookAt(
        carGroup.position.x,
        carGroup.position.y + 1.5, // Look at car roof
        carGroup.position.z
      );
      
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
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
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
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-5xl font-bold mb-6 text-white">READY TO RACE?</h1>
          <button 
            className="px-10 py-5 text-2xl font-bold bg-racing-red hover:bg-red-700 text-white rounded-full transition-all duration-200 transform hover:scale-105"
            onClick={startGame}
          >
            START ENGINE
          </button>
          <p className="mt-8 text-racing-silver">Use W, A, S, D keys to drive the car</p>
          <Link to="/" className="mt-8 text-sm text-racing-silver hover:text-white underline">
            Back to Home
          </Link>
        </div>
      ) : (
        <div ref={mountRef} className="w-screen h-screen overflow-hidden">
          {/* Instructions overlay */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow z-10">
            <h2 className="font-bold text-lg">Car Controls</h2>
            <ul className="text-sm">
              <li><strong>W</strong> - Accelerate</li>
              <li><strong>S</strong> - Brake/Reverse</li>
              <li><strong>A</strong> - Turn Left</li>
              <li><strong>D</strong> - Turn Right</li>
            </ul>
            <button 
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? "Hide Settings" : "Show Settings"}
            </button>
            <Link to="/" className="mt-2 ml-2 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm inline-block">
              Exit Game
            </Link>
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded shadow z-10 w-64">
              <h2 className="font-bold text-lg mb-2">Car Settings</h2>
              
              {/* Car color selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Car Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <div 
                      key={color.name}
                      className={`w-full h-8 rounded cursor-pointer border-2 ${carColor === color.hex ? 'border-blue-500' : 'border-gray-300'}`}
                      style={{ backgroundColor: '#' + color.hex.toString(16).padStart(6, '0') }}
                      onClick={() => setCarColor(color.hex)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              {/* Speed factor slider */}
              <div>
                <label className="block text-sm font-medium mb-1">Speed: {maxSpeedFactor.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={maxSpeedFactor}
                  onChange={(e) => setMaxSpeedFactor(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Game;
