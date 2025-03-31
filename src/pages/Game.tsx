// src/pages/Game.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/AuthService';
import { 
  useMultiplayerStore, 
  OnlinePlayer,
  PlayerPosition, 
  ChatMessage 
} from '../services/MultiplayerService';
import { 
  Users,
  MessageSquare,
  X,
  LogOut,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import LoginModal from '../components/LoginModal';

// Define TypeScript interfaces
interface ColorOption {
  name: string;
  hex: number;
}

interface KeysPressed {
  [key: string]: boolean;
}

// Map to store other players' 3D objects
const playerMeshes = new Map<string, THREE.Group>();

const Game: React.FC = () => {
  const navigate = useNavigate();
  const mountRef = useRef<HTMLDivElement>(null);
  const keysPressed = useRef<KeysPressed>({});
  const animationFrameId = useRef<number | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const frameTimeRef = useRef<number>(Date.now());
  const lastPositionUpdateRef = useRef<number>(Date.now());
  
  const [carColor, setCarColor] = useState<number>(0xff0000); // Default red
  const [maxSpeedFactor, setMaxSpeedFactor] = useState<number>(1); // Default speed multiplier
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string>('');
  
  // Auth and multiplayer state
  const { user, isAuthenticated } = useAuthStore();
  const { 
    currentRoom, 
    onlinePlayers, 
    chatMessages, 
    updatePlayerPosition, 
    sendChatMessage,
    leaveRoom,
    disconnectFromMultiplayer
  } = useMultiplayerStore();

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
  
  // Check if the user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
    } else if (user) {
      // Update car color from user preferences
      if (user.carColor) {
        setCarColor(user.carColor);
      }
    }
  }, [isAuthenticated, user]);
  
  // If the user is not in a room, redirect to lobby
  useEffect(() => {
    if (isAuthenticated && !currentRoom) {
      navigate('/lobby');
    }
  }, [isAuthenticated, currentRoom, navigate]);
  
  // Start the game
  const startGame = () => {
    setGameStarted(true);
  };

  const handleSendChatMessage = () => {
    if (user && chatMessage.trim() !== '') {
      sendChatMessage(user, chatMessage);
      setChatMessage('');
    }
  };

  const handleExitGame = () => {
    if (leaveRoom) {
      leaveRoom();
    }
    navigate('/lobby');
  };

  useEffect(() => {
    if (!mountRef.current || !gameStarted || !user) return;

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
    carGroupRef.current = carGroup;
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
    
    // Add player name floating above car
    const createNameTag = (name: string, color: string = '#ffffff') => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;
      
      if (context) {
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = 'bold 30px Arial';
        context.textAlign = 'center';
        context.fillStyle = color;
        context.fillText(name, canvas.width / 2, canvas.height / 2 + 10);
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(0, 3, 0);
      sprite.scale.set(5, 1.5, 1);
      
      return sprite;
    };

    // Add name tag for current player
    if (user) {
      const nameTag = createNameTag(user.displayName);
      carGroup.add(nameTag);
    }
    
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
    
    // Helper function to create cars for other players
    const createPlayerCar = (player: OnlinePlayer): THREE.Group => {
      const playerCarGroup = new THREE.Group();
      
      // Car body
      const playerCarColor = player.carColor || 0x0000ff; // Default blue for other players
      const playerBodyGeometry = new THREE.BoxGeometry(2, 1, 4);
      const playerBodyMaterial = new THREE.MeshStandardMaterial({ color: playerCarColor });
      const playerBody = new THREE.Mesh(playerBodyGeometry, playerBodyMaterial);
      playerBody.position.y = 0.5;
      playerBody.castShadow = true;
      playerCarGroup.add(playerBody);
      
      // Car cabin
      const playerCabinGeometry = new THREE.BoxGeometry(1.5, 0.8, 2);
      const playerCabinMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      const playerCabin = new THREE.Mesh(playerCabinGeometry, playerCabinMaterial);
      playerCabin.position.y = 1.4;
      playerCabin.position.z = -0.5;
      playerCabin.castShadow = true;
      playerCarGroup.add(playerCabin);
      
      // Wheels (simplified for other players)
      const playerWheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
      playerWheelGeometry.rotateX(Math.PI / 2);
      const playerWheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      
      // Add 4 wheels
      const wheelPositions = [
        [-1.2, 0.5, -1.2], [1.2, 0.5, -1.2],
        [-1.2, 0.5, 1.2], [1.2, 0.5, 1.2]
      ];
      
      for (const [x, y, z] of wheelPositions) {
        const wheel = new THREE.Mesh(playerWheelGeometry, playerWheelMaterial);
        wheel.position.set(x, y, z);
        wheel.castShadow = true;
        playerCarGroup.add(wheel);
      }
      
      // Add player name tag
      const nameTag = createNameTag(player.displayName, player.avatarColor || '#ffffff');
      playerCarGroup.add(nameTag);
      
      // Set initial position
      if (player.position) {
        playerCarGroup.position.set(
          player.position.x,
          player.position.y || 0,
          player.position.z
        );
        playerCarGroup.rotation.y = player.position.rotationY || 0;
      }
      
      // Add to scene
      scene.add(playerCarGroup);
      
      return playerCarGroup;
    };
    
    // Update or create meshes for other players
    const updateOtherPlayers = () => {
      // First filter out the current player
      const otherPlayers = onlinePlayers.filter(player => player.id !== user.id);
      
      // Remove players that have left
      playerMeshes.forEach((mesh, playerId) => {
        if (!otherPlayers.some(player => player.id === playerId)) {
          scene.remove(mesh);
          playerMeshes.delete(playerId);
        }
      });
      
      // Update or create meshes for current players
      otherPlayers.forEach(player => {
        if (playerMeshes.has(player.id)) {
          // Update existing player mesh
          const mesh = playerMeshes.get(player.id)!;
          if (player.position) {
            mesh.position.x = player.position.x;
            mesh.position.y = player.position.y || 0;
            mesh.position.z = player.position.z;
            mesh.rotation.y = player.position.rotationY || 0;
          }
        } else {
          // Create new player mesh
          const newMesh = createPlayerCar(player);
          playerMeshes.set(player.id, newMesh);
        }
      });
    };
    
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
      const currentTime = Date.now();
      const deltaTime = (currentTime - frameTimeRef.current) / 1000; // seconds
      frameTimeRef.current = currentTime;

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
      
      // Update other players
      updateOtherPlayers();
      
      // Send position updates to multiplayer service (throttled to every 100ms)
      if (currentTime - lastPositionUpdateRef.current > 100) {
        lastPositionUpdateRef.current = currentTime;
        
        if (user && updatePlayerPosition) {
          const position: PlayerPosition = {
            x: carGroup.position.x,
            y: carGroup.position.y,
            z: carGroup.position.z,
            rotationY: carRotation,
            speed: carSpeed,
            timestamp: currentTime
          };
          
          updatePlayerPosition(user, position);
        }
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
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Clear player meshes
      playerMeshes.forEach((mesh) => {
        scene.remove(mesh);
      });
      playerMeshes.clear();
    };
  }, [carColor, maxSpeedFactor, gameStarted, user, onlinePlayers, updatePlayerPosition]); // Re-run effect when car color or speed factor changes

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (leaveRoom) {
        leaveRoom();
      }
    };
  }, [leaveRoom]);

  // Format timestamp to readable time
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-racing-dark">
      {/* Login modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      
      {!gameStarted ? (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-5xl font-bold mb-6 text-white">MULTIPLAYER RACE</h1>
          {currentRoom && (
            <div className="mb-8 text-racing-silver text-xl">
              Room: {currentRoom.name}
            </div>
          )}
          
          <button 
            className="px-10 py-5 text-2xl font-bold bg-racing-red hover:bg-red-700 text-white rounded-full transition-all duration-200 transform hover:scale-105"
            onClick={startGame}
          >
            START ENGINE
          </button>
          
          <p className="mt-8 text-racing-silver">Use W, A, S, D keys to drive the car</p>
          <p className="mt-2 text-racing-silver">{onlinePlayers.length} players in this room</p>
          
          <Button 
            variant="outline" 
            className="mt-6"
            onClick={handleExitGame}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lobby
          </Button>
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
            <div className="flex gap-2 mt-3">
              <Button 
                onClick={() => setShowSettings(!showSettings)} 
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                {showSettings ? "Hide Settings" : "Settings"}
              </Button>
              
              <Button 
                onClick={handleExitGame} 
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Exit
              </Button>
            </div>
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded shadow z-10 w-64">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-lg">Car Settings</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0" 
                  onClick={() => setShowSettings(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
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

          {/* Players and chat sidebar trigger */}
          <div className="absolute bottom-4 right-4 flex gap-2 z-20">
            <Button
              onClick={() => setShowSidebar(true)}
              className="bg-racing-red text-white hover:bg-red-700"
            >
              <Users className="mr-2 h-4 w-4" />
              Players ({onlinePlayers.length})
            </Button>
          </div>

          {/* Sidebar for Players & Chat */}
          <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
            <SheetContent className="w-80 sm:w-96 p-0">
              <Tabs defaultValue="players" className="h-full flex flex-col">
                <SheetHeader className="px-4 pt-4 pb-0">
                  <SheetTitle>Multiplayer</SheetTitle>
                </SheetHeader>
                
                <TabsList className="mx-4 my-2">
                  <TabsTrigger value="players" className="flex-1">
                    <Users className="mr-2 h-4 w-4" />
                    Players ({onlinePlayers.length})
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex-1">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Chat
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="players" className="flex-1 flex flex-col px-4">
                  <ScrollArea className="flex-1 pr-4">
                    {onlinePlayers.map((player) => (
                      <div key={player.id} className="mb-3 flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarFallback style={{ backgroundColor: player.avatarColor || '#6366f1' }}>
                            {player.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {player.displayName}
                            {player.id === user?.id && (
                              <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {onlinePlayers.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No other players yet. Invite your friends to join!
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="chat" className="flex-1 flex flex-col px-4">
                  <ScrollArea className="flex-1 pr-4 mb-4">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No messages yet. Say hello to other racers!
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div key={msg.id} className="mb-4">
                          <div className="flex items-start">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback style={{ 
                                backgroundColor: onlinePlayers.find(p => p.id === msg.senderId)?.avatarColor || '#6366f1' 
                              }}>
                                {msg.senderName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm">
                                  {msg.senderName}
                                  {msg.senderId === user?.id && (
                                    <Badge variant="outline" className="ml-1 text-xs">You</Badge>
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(msg.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm mt-1">{msg.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                  
                  <div className="flex gap-2 pb-4">
                    <Input 
                      placeholder="Type your message..." 
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                    />
                    <Button onClick={handleSendChatMessage}>Send</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
};

export default Game;