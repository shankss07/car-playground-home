// This is a simplified multiplayer service that simulates networking
// In a real application, you would use WebSockets or a similar technology
// to implement real-time communication between players

// Simple EventEmitter implementation (browser compatible)
class EventEmitter {
    private events: Record<string, Array<(data: any) => void>> = {};
  
    on(event: string, callback: (data: any) => void): void {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(callback);
    }
  
    off(event: string, callback: (data: any) => void): void {
      if (!this.events[event]) return;
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  
    emit(event: string, data: any): void {
      if (!this.events[event]) return;
      this.events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
  
  // Player data interface
  export interface MultiplayerPlayer {
    id: string;
    name: string;
    carColor: number;
    isHost: boolean;
    position?: {
      x: number;
      y: number;
      z: number;
    };
    rotation?: number;
    connected: boolean;
  }
  
  // Room data interface
  export interface MultiplayerRoom {
    roomCode: string;
    players: MultiplayerPlayer[];
    created: Date;
    started: boolean;
  }
  
  // Global state for the multiplayer simulation (in memory)
  const rooms: Record<string, MultiplayerRoom> = {};
  
  // Events
  const eventEmitter = new EventEmitter();
  
  // Generate a random player ID
  const generatePlayerId = (): string => {
    return Math.random().toString(36).substring(2, 15);
  };
  
  // Create a new room
  export const createRoom = (roomCode: string, hostName: string, hostCarColor: number = 0xff0000): MultiplayerRoom => {
    // Check if the room already exists
    if (rooms[roomCode]) {
      throw new Error(`Room ${roomCode} already exists`);
    }
  
    // Create a new room
    const playerId = generatePlayerId();
    const room: MultiplayerRoom = {
      roomCode,
      players: [
        {
          id: playerId,
          name: hostName,
          carColor: hostCarColor,
          isHost: true,
          connected: true
        }
      ],
      created: new Date(),
      started: false
    };
  
    // Store the room
    rooms[roomCode] = room;
  
    // Emit an event for the room creation
    eventEmitter.emit('roomCreated', room);
  
    return room;
  };
  
  // Join an existing room
  export const joinRoom = (roomCode: string, playerName: string, playerCarColor: number = 0x0000ff): [MultiplayerRoom, string] => {
    // Check if the room exists
    const room = rooms[roomCode];
    if (!room) {
      // For demo purposes, create the room if it doesn't exist
      return [createRoom(roomCode, playerName, playerCarColor), generatePlayerId()];
    }
  
    // Check if the room is full (max 6 players)
    if (room.players.length >= 6) {
      throw new Error(`Room ${roomCode} is full`);
    }
  
    // Check if the game has already started
    if (room.started) {
      throw new Error(`Game in room ${roomCode} has already started`);
    }
  
    // Generate a player ID
    const playerId = generatePlayerId();
  
    // Add the player to the room
    const newPlayer: MultiplayerPlayer = {
      id: playerId,
      name: playerName,
      carColor: playerCarColor,
      isHost: false,
      connected: true
    };
    room.players.push(newPlayer);
  
    // Emit an event for the player joining
    eventEmitter.emit('playerJoined', { room, player: newPlayer });
  
    return [room, playerId];
  };
  
  // Leave a room
  export const leaveRoom = (roomCode: string, playerId: string): void => {
    // Check if the room exists
    const room = rooms[roomCode];
    if (!room) {
      return;
    }
  
    // Find the player in the room
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return;
    }
  
    const player = room.players[playerIndex];
  
    // Remove the player from the room
    if (player.isHost) {
      // If the host leaves, assign a new host if there are other players
      if (room.players.length > 1) {
        room.players.splice(playerIndex, 1);
        room.players[0].isHost = true;
        
        // Emit an event for the host change
        eventEmitter.emit('hostChanged', { room, newHost: room.players[0] });
      } else {
        // If the host was the only player, delete the room
        delete rooms[roomCode];
        eventEmitter.emit('roomDeleted', { roomCode });
        return;
      }
    } else {
      // If a regular player leaves, just remove them
      room.players.splice(playerIndex, 1);
    }
  
    // Emit an event for the player leaving
    eventEmitter.emit('playerLeft', { room, playerId });
  };
  
  // Update player position
  export const updatePlayerPosition = (
    roomCode: string, 
    playerId: string, 
    position: { x: number; y: number; z: number }, 
    rotation: number
  ): void => {
    // Check if the room exists
    const room = rooms[roomCode];
    if (!room) {
      return;
    }
  
    // Find the player in the room
    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return;
    }
  
    // Update the player's position and rotation
    player.position = position;
    player.rotation = rotation;
  
    // Emit an event for the position update
    eventEmitter.emit('playerPositionUpdated', { room, player });
  };
  
  // Start the game
  export const startGame = (roomCode: string, playerId: string): void => {
    // Check if the room exists
    const room = rooms[roomCode];
    if (!room) {
      throw new Error(`Room ${roomCode} does not exist`);
    }
  
    // Check if the player is the host
    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isHost) {
      throw new Error('Only the host can start the game');
    }
  
    // Start the game
    room.started = true;
  
    // Emit an event for the game starting
    eventEmitter.emit('gameStarted', { room });
  };
  
  // Get a room by its code
  export const getRoom = (roomCode: string): MultiplayerRoom | null => {
    return rooms[roomCode] || null;
  };
  
  // Check if a room exists
  export const roomExists = (roomCode: string): boolean => {
    return !!rooms[roomCode];
  };
  
  // Subscribe to events
  export const subscribe = (
    event: string, 
    callback: (data: any) => void
  ): () => void => {
    eventEmitter.on(event, callback);
    
    // Return a function to unsubscribe
    return () => {
      eventEmitter.off(event, callback);
    };
  };
  
  // List of available events to subscribe to
  export const MULTIPLAYER_EVENTS = {
    ROOM_CREATED: 'roomCreated',
    ROOM_DELETED: 'roomDeleted',
    PLAYER_JOINED: 'playerJoined',
    PLAYER_LEFT: 'playerLeft',
    HOST_CHANGED: 'hostChanged',
    PLAYER_POSITION_UPDATED: 'playerPositionUpdated',
    GAME_STARTED: 'gameStarted'
  };
  
  // Simulate network latency for demo purposes
  export const simulateNetworkLatency = (callback: () => void, minMs: number = 50, maxMs: number = 150): void => {
    const latency = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    setTimeout(callback, latency);
  };
  
  // For demo purposes: simulate other players' movements
  export const simulateOtherPlayersMovement = (roomCode: string, localPlayerId: string): void => {
    const room = rooms[roomCode];
    if (!room) return;
  
    // Find all players except the local player
    const otherPlayers = room.players.filter(p => p.id !== localPlayerId);
    
    for (const player of otherPlayers) {
      if (!player.position) {
        // Initialize position if not set
        player.position = {
          x: (Math.random() - 0.5) * 20,
          y: 0,
          z: (Math.random() - 0.5) * 20
        };
        player.rotation = Math.random() * Math.PI * 2;
      }
      
      // Random movement
      const speed = 0.1;
      const turnAmount = (Math.random() - 0.5) * 0.1;
      
      // Update rotation
      player.rotation = (player.rotation! + turnAmount) % (Math.PI * 2);
      
      // Move forward based on rotation
      player.position.x += Math.sin(player.rotation!) * speed;
      player.position.z += Math.cos(player.rotation!) * speed;
      
      // Emit position update
      eventEmitter.emit('playerPositionUpdated', { room, player });
    }
  };
  
  // Clean up inactive rooms (in a real implementation, this would be done by a server process)
  export const cleanupInactiveRooms = (): void => {
    const now = new Date();
    const MAX_ROOM_AGE_MS = 3600000; // 1 hour
    
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      const age = now.getTime() - room.created.getTime();
      
      if (age > MAX_ROOM_AGE_MS) {
        delete rooms[roomCode];
        eventEmitter.emit('roomDeleted', { roomCode });
      }
    }
  };
  
  // Set an interval to clean up inactive rooms
  setInterval(cleanupInactiveRooms, 300000); // Every 5 minutes
  
  // For demo purposes: Export the rooms object
  export const getAllRooms = (): Record<string, MultiplayerRoom> => {
    return { ...rooms };
  };