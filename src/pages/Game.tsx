import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  ArrowLeft, 
  User, 
  MessageCircle, 
  Settings, 
  X 
} from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import * as MultiplayerService from '@/services/multiplayer';
import { MultiplayerPlayer, MultiplayerRoom, MULTIPLAYER_EVENTS } from '@/services/multiplayer';

// Define TypeScript interfaces
interface ColorOption {
  name: string;
  hex: number;
}

interface KeysPressed {
  [key: string]: boolean;
}

interface GameProps {}

const Game: React.FC<GameProps> = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const keysPressed = useRef<KeysPressed>({});
  const animationFrameId = useRef<number | null>(null);
  const carGroup = useRef<THREE.Group | null>(null);
  const otherPlayerModels = useRef<{[playerId: string]: THREE.Group}>({});
  const scene = useRef<THREE.Scene | null>(null);
  const simulationInterval = useRef<NodeJS.Timeout | null>(null);
  
  const [carColor, setCarColor] = useState<number>(0xff0000); // Default red
  const [maxSpeedFactor, setMaxSpeedFactor] = useState<number>(1); // Default speed multiplier
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showPlayers, setShowPlayers] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [isMultiplayer, setIsMultiplayer] = useState<boolean>(false);
  const [roomCode, setRoomCode] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [playerName, setPlayerName] = useState<string>('Player');
  const [playerId, setPlayerId] = useState<string>('');
  const [players, setPlayers] = useState<MultiplayerPlayer[]>([]);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<{sender: string, message: string, timestamp: Date}[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();

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
  
  // Parse URL parameters for multiplayer mode
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get('mode');
    const room = searchParams.get('room');
    const hostParam = searchParams.get('host');
    const name = searchParams.get('name');
    
    if (mode === 'multiplayer' && room) {
      setIsMultiplayer(true);
      setRoomCode(room);
      setIsHost(hostParam === 'true');
      
      if (name) {
        setPlayerName(decodeURIComponent(name));
      }
      
      // Join or create the multiplayer room
      try {
        let joinedRoom: MultiplayerRoom;
        let localPlayerId: string;
        
        if (hostParam === 'true') {
          // Create room as host
          joinedRoom = MultiplayerService.createRoom(room, playerName, carColor);
          localPlayerId = joinedRoom.players[0].id;
        } else {
          // Join existing room
          [joinedRoom, localPlayerId] = MultiplayerService.joinRoom(room, playerName, carColor);
        }
        
        setPlayerId(localPlayerId);
        setPlayers(joinedRoom.players);
        
        // Add welcome message to chat
        const welcomeMessage = {
          sender: 'System',
          message: `Welcome to room ${room}! ${playerName} has joined the race.`,
          timestamp: new Date()
        };
        setChatMessages([welcomeMessage]);
        
        // Show toast notification
        toast({
          title: isHost ? "Room created!" : "Joined room!",
          description: `You've ${isHost ? 'created' : 'joined'} room ${room}`,
        });
      } catch (error) {
        console.error('Error joining multiplayer room:', error);
        toast({
          title: "Error joining room",
          description: `Could not join room ${room}. Please try again.`,
          variant: "destructive"
        });
        
        // Navigate back to multiplayer lobby
        navigate('/multiplayer');
      }
    }
  }, [location.search, navigate, carColor, playerName]);
  
  // Subscribe to multiplayer events
  useEffect(() => {
    if (!isMultiplayer) return;
    
    // Player joined event
    const unsubscribePlayerJoined = MultiplayerService.subscribe(
      MULTIPLAYER_EVENTS.PLAYER_JOINED,
      (data: { room: MultiplayerRoom, player: MultiplayerPlayer }) => {
        if (data.room.roomCode === roomCode) {
          setPlayers(data.room.players);
          
          // Add chat message
          const joinMessage = {
            sender: 'System',
            message: `${data.player.name} has joined the race!`,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, joinMessage]);
          
          // Show toast notification
          toast({
            title: "New player joined",
            description: `${data.player.name} has joined the race!`,
          });
        }
      }
    );
    
    // Player left event
    const unsubscribePlayerLeft = MultiplayerService.subscribe(
      MULTIPLAYER_EVENTS.PLAYER_LEFT,
      (data: { room: MultiplayerRoom, playerId: string }) => {
        if (data.room.roomCode === roomCode) {
          setPlayers(data.room.players);
          
          // Find the player who left
          const leftPlayer = players.find(p => p.id === data.playerId);
          if (leftPlayer) {
            // Add chat message
            const leftMessage = {
              sender: 'System',
              message: `${leftPlayer.name} has left the race.`,
              timestamp: new Date()
            };
            setChatMessages(prev => [...prev, leftMessage]);
            
            // Show toast notification
            toast({
              title: "Player left",
              description: `${leftPlayer.name} has left the race.`,
            });
            
            // Remove the player's model from the scene
            if (scene.current && otherPlayerModels.current[data.playerId]) {
              scene.current.remove(otherPlayerModels.current[data.playerId]);
              delete otherPlayerModels.current[data.playerId];
            }
          }
        }
      }
    );
    
    // Host changed event
    const unsubscribeHostChanged = MultiplayerService.subscribe(
      MULTIPLAYER_EVENTS.HOST_CHANGED,
      (data: { room: MultiplayerRoom, newHost: MultiplayerPlayer }) => {
        if (data.room.roomCode === roomCode) {
          setPlayers(data.room.players);
          
          // Check if the current player is the new host
          if (data.newHost.id === playerId) {
            setIsHost(true);
            
            // Show toast notification
            toast({
              title: "You are now the host",
              description: "You are now the host of this room.",
            });
          }
          
          // Add chat message
          const hostChangedMessage = {
            sender: 'System',
            message: `${data.newHost.name} is now the host.`,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, hostChangedMessage]);
        }
      }
    );
    
    // Player position updated event
    const unsubscribePositionUpdated = MultiplayerService.subscribe(
      MULTIPLAYER_EVENTS.PLAYER_POSITION_UPDATED,
      (data: { room: MultiplayerRoom, player: MultiplayerPlayer }) => {
        if (data.room.roomCode === roomCode && data.player.id !== playerId) {
          // Update the player in the players array
          setPlayers(prev => 
            prev.map(p => p.id === data.player.id ? { ...p, ...data.player } : p)
          );
          
          // Update the player's model position in the scene
          if (scene.current && data.player.position && data.player.rotation !== undefined) {
            // If the player model doesn't exist, create it
            if (!otherPlayerModels.current[data.player.id]) {
              const playerModel = createCarModel(data.player.carColor);
              scene.current.add(playerModel);
              otherPlayerModels.current[data.player.id] = playerModel;
            }
            
            // Update the player model position and rotation
            const playerModel = otherPlayerModels.current[data.player.id];
            playerModel.position.set(
              data.player.position.x, 
              data.player.position.y, 
              data.player.position.z
            );
            playerModel.rotation.y = data.player.rotation;
          }
        }
      }
    );
    
    // Cleanup function to unsubscribe from all events
    return () => {
      unsubscribePlayerJoined();
      unsubscribePlayerLeft();
      unsubscribeHostChanged();
      unsubscribePositionUpdated();
      
      // Clean up the simulation interval
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
      
      // Leave the room when component unmounts
      if (roomCode && playerId) {
        MultiplayerService.leaveRoom(roomCode, playerId);
      }
    };
  }, [isMultiplayer, roomCode, playerId, players, isHost]);
  
  // Create a car model function (reusable for other players)
  const createCarModel = (color: number): THREE.Group => {
    const newCarGroup = new THREE.Group();
    
    // Create car body
    const carBodyGeometry = new THREE.BoxGeometry(2, 1, 4);
    const carBodyMaterial = new THREE.MeshStandardMaterial({ color });
    const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
    carBody.position.y = 0.5;
    carBody.castShadow = true;
    newCarGroup.add(carBody);
    
    // Create car cabin
    const cabinGeometry = new THREE.BoxGeometry(1.5, 0.8, 2);
    const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.y = 1.4;
    cabin.position.z = -0.5;
    cabin.castShadow = true;
    newCarGroup.add(cabin);
    
    // Create wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32);
    wheelGeometry.rotateX(Math.PI / 2); // Rotate to align with car direction
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    // Front-left wheel
    const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFL.position.set(-1.2, 0.5, -1.2);
    wheelFL.castShadow = true;
    newCarGroup.add(wheelFL);
    
    // Front-right wheel
    const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFR.position.set(1.2, 0.5, -1.2);
    wheelFR.castShadow = true;
    newCarGroup.add(wheelFR);
    
    // Rear-left wheel
    const wheelRL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRL.position.set(-1.2, 0.5, 1.2);
    wheelRL.castShadow = true;
    newCarGroup.add(wheelRL);
    
    // Rear-right wheel
    const wheelRR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRR.position.set(1.2, 0.5, 1.2);
    wheelRR.castShadow = true;
    newCarGroup.add(wheelRR);
    
    return newCarGroup;
  };
  
  // Start the game
  const startGame = () => {
    setGameStarted(true);
  };
  
  // Send a chat message
  const sendChatMessage = () => {
    if (!chatMessage.trim()) return;
    
    const newMessage = {
      sender: playerName,
      message: chatMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setChatMessage('');
    
    // In a real implementation, you would send this message to other players
    // For this demo, we'll just add it to the local chat
  };
  
  // Leave the multiplayer room
  const leaveRoom = () => {
    if (isMultiplayer && roomCode && playerId) {
      MultiplayerService.leaveRoom(roomCode, playerId);
      navigate('/multiplayer');
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    if (!mountRef.current || !gameStarted) return;

    // Three.js initialization
    const newScene = new THREE.Scene();
    scene.current = newScene;
    
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
    const newCarGroup = createCarModel(carColor);
    carGroup.current = newCarGroup;
    
    let carSpeed = 0;
    let carRotation = 0;
    
    // Car physics parameters
    const BASE_MAX_SPEED = 0.5;
    const MAX_SPEED = BASE_MAX_SPEED * maxSpeedFactor;
    const ACCELERATION = 0.01 * maxSpeedFactor;
    const DECELERATION = 0.005;
    const ROTATION_SPEED = 0.05;
    
    // Add car to scene
    newCarGroup.position.set(0, 0, 0);
    newScene.add(newCarGroup);
    
    // Create ground (infinite grid)
    const gridSize = 1000;
    const gridDivisions = 100;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x888888);
    newScene.add(gridHelper);
    
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
    newScene.add(ground);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    newScene.add(ambientLight);
    
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
    newScene.add(directionalLight);
    
    // Position camera for 3rd person view
    camera.position.set(0, 5, 10);
    camera.lookAt(newCarGroup.position);
    
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
      newScene.add(treeGroup);
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
    
    // Set up simulation for other players if in multiplayer mode
    if (isMultiplayer && roomCode && playerId) {
      simulationInterval.current = setInterval(() => {
        MultiplayerService.simulateOtherPlayersMovement(roomCode, playerId);
      }, 100); // Update every 100ms
    }
    
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
      if (carGroup.current) {
        carGroup.current.rotation.y = carRotation;
      
        // Move car forward based on speed and rotation
        carGroup.current.position.x += Math.sin(carRotation) * carSpeed;
        carGroup.current.position.z += Math.cos(carRotation) * carSpeed;
        
        // Animate wheels based on speed
        const wheelRotationSpeed = carSpeed * 0.5;
        
        // We have to type cast here because we know the structure of our car model
        const wheels = [
          carGroup.current.children[2],
          carGroup.current.children[3],
          carGroup.current.children[4],
          carGroup.current.children[5]
        ];
        
        wheels.forEach(wheel => {
          (wheel as THREE.Mesh).rotation.x += wheelRotationSpeed;
        });
      
        // Update camera position for 3rd person view
        const cameraDistance = 10;
        const cameraHeight = 5;
        const cameraLagFactor = 0.1; // How quickly camera follows car
        
        // Calculate ideal camera position
        const idealCameraX = carGroup.current.position.x - Math.sin(carRotation) * cameraDistance;
        const idealCameraZ = carGroup.current.position.z - Math.cos(carRotation) * cameraDistance;
        
        // Smooth camera movement
        camera.position.x += (idealCameraX - camera.position.x) * cameraLagFactor;
        camera.position.z += (idealCameraZ - camera.position.z) * cameraLagFactor;
        camera.position.y = cameraHeight;
        
        // Make camera look at car
        camera.lookAt(
          carGroup.current.position.x,
          carGroup.current.position.y + 1.5, // Look at car roof
          carGroup.current.position.z
        );
      }
      
      // If in multiplayer mode, update player position on the server
      if (isMultiplayer && roomCode && playerId && carGroup.current) {
        MultiplayerService.updatePlayerPosition(
          roomCode,
          playerId,
          {
            x: carGroup.current.position.x,
            y: carGroup.current.position.y,
            z: carGroup.current.position.z
          },
          carRotation
        );
      }
      
      // Render scene
      renderer.render(newScene, camera);
      
      // Continue animation loop
      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    // Start animation loop
    animate();
    
    // Update car material when color changes
    if (carGroup.current) {
      const existingCarBody = carGroup.current.children[0] as THREE.Mesh;
      if (existingCarBody && existingCarBody.material) {
        (existingCarBody.material as THREE.MeshStandardMaterial).color.set(carColor);
      }
    }
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
      
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Clear references
      scene.current = null;
      carGroup.current = null;
      otherPlayerModels.current = {};
    };
  }, [carColor, maxSpeedFactor, gameStarted, isMultiplayer, roomCode, playerId]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-racing-dark">
      {!gameStarted ? (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-5xl font-bold mb-6 text-white">
            {isMultiplayer ? (
              <>
                MULTIPLAYER RACE
                <div className="text-2xl mt-2 text-racing-silver">Room: {roomCode}</div>
              </>
            ) : (
              "READY TO RACE?"
            )}
          </h1>
          
          {isMultiplayer && (
            <div className="mb-6 p-4 bg-racing-dark/80 rounded-lg w-full max-w-md">
              <h2 className="text-white text-xl mb-2">Players ({players.length}/6)</h2>
              <div className="space-y-2">
                {players.map((player) => (
                  <div 
                    key={player.id} 
                    className="flex items-center text-racing-silver"
                  >
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ backgroundColor: '#' + player.carColor.toString(16).padStart(6, '0') }}
                    />
                    <span>{player.name}</span>
                    {player.isHost && <span className="ml-2 text-racing-red text-xs">(Host)</span>}
                    {player.id === playerId && <span className="ml-2 text-white text-xs">(You)</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button 
            className="px-10 py-5 text-2xl font-bold bg-racing-red hover:bg-red-700 text-white rounded-full transition-all duration-200 transform hover:scale-105"
            onClick={startGame}
          >
            START ENGINE
          </button>
          
          <p className="mt-8 text-racing-silver">Use W, A, S, D keys to drive the car</p>
          
          <Button 
            variant="link" 
            className="mt-8 text-sm text-racing-silver hover:text-white"
            onClick={leaveRoom}
          >
            {isMultiplayer ? "Leave Room" : "Back to Home"}
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div ref={mountRef} className="w-screen h-screen overflow-hidden" />
          
          {/* Room code display for multiplayer */}
          {isMultiplayer && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
              <span className="font-mono">Room: {roomCode}</span>
            </div>
          )}
          
          {/* Controls and information overlay */}
          <div className="absolute top-4 left-4 bg-black/70 p-4 rounded-lg shadow-lg z-10 text-white">
            <h2 className="font-bold text-lg mb-2">Car Controls</h2>
            <ul className="text-sm space-y-1">
              <li><strong>W</strong> - Accelerate</li>
              <li><strong>S</strong> - Brake/Reverse</li>
              <li><strong>A</strong> - Turn Left</li>
              <li><strong>D</strong> - Turn Right</li>
            </ul>
            
            <div className="flex gap-2 mt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-black/50 border-white/20"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Settings size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {isMultiplayer && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-black/50 border-white/20"
                          onClick={() => setShowPlayers(!showPlayers)}
                        >
                          <Users size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Players</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-black/50 border-white/20"
                          onClick={() => setShowChat(!showChat)}
                        >
                          <MessageCircle size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Chat</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-black/50 border-white/20"
                      onClick={leaveRoom}
                    >
                      <ArrowLeft size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Exit Game</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {/* Settings panel */}
          {showSettings && (
            <Card className="absolute top-4 right-4 bg-black/90 border-racing-red shadow-lg z-10 w-64">
              <div className="flex justify-between items-center p-3 border-b border-white/10">
                <h2 className="font-bold text-white">Car Settings</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-white/70 hover:text-white"
                  onClick={() => setShowSettings(false)}
                >
                  <X size={16} />
                </Button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Car color selection */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Car Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <div 
                        key={color.name}
                        className={`w-full h-8 rounded cursor-pointer border-2 ${carColor === color.hex ? 'border-racing-red' : 'border-gray-700'}`}
                        style={{ backgroundColor: '#' + color.hex.toString(16).padStart(6, '0') }}
                        onClick={() => setCarColor(color.hex)}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Speed factor slider */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">Speed: {maxSpeedFactor.toFixed(1)}x</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={maxSpeedFactor}
                    onChange={(e) => setMaxSpeedFactor(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Slow</span>
                    <span>Normal</span>
                    <span>Fast</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
          
          {/* Players panel (for multiplayer) */}
          {isMultiplayer && showPlayers && (
            <Card className="absolute top-20 right-4 bg-black/90 border-racing-red shadow-lg z-10 w-64">
              <div className="flex justify-between items-center p-3 border-b border-white/10">
                <h2 className="font-bold text-white">Players ({players.length}/6)</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-white/70 hover:text-white"
                  onClick={() => setShowPlayers(false)}
                >
                  <X size={16} />
                </Button>
              </div>
              
              <ScrollArea className="h-60 p-4">
                <div className="space-y-3">
                  {players.map((player) => (
                    <div 
                      key={player.id} 
                      className="flex items-center gap-2 text-white border-b border-white/10 pb-2"
                    >
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: '#' + player.carColor.toString(16).padStart(6, '0') }}
                      />
                      <div className="flex-1 truncate">
                        {player.name}
                        {player.id === playerId && <span className="ml-1 text-xs">(You)</span>}
                      </div>
                      {player.isHost && <span className="text-racing-red text-xs">Host</span>}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
          
          {/* Chat panel (for multiplayer) */}
          {isMultiplayer && showChat && (
            <Card className="absolute bottom-4 right-4 bg-black/90 border-racing-red shadow-lg z-10 w-80">
              <div className="flex justify-between items-center p-3 border-b border-white/10">
                <h2 className="font-bold text-white">Race Chat</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-white/70 hover:text-white"
                  onClick={() => setShowChat(false)}
                >
                  <X size={16} />
                </Button>
              </div>
              
              <ScrollArea className="h-60 p-4">
                <div className="space-y-3">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className={`font-medium ${msg.sender === 'System' ? 'text-racing-red' : 'text-white'}`}>
                          {msg.sender}:
                        </span>
                        <span className="text-xs text-gray-400">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-sm ${msg.sender === 'System' ? 'text-gray-300' : 'text-white'}`}>
                        {msg.message}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-3 border-t border-white/10 flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendChatMessage();
                    }
                  }}
                  className="bg-gray-800 border-gray-700 text-white h-8"
                />
                <Button 
                  size="sm" 
                  className="h-8 bg-racing-red hover:bg-red-700"
                  onClick={sendChatMessage}
                >
                  Send
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Game;