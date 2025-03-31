// src/services/MultiplayerService.ts
import { create } from 'zustand';
import { User } from './AuthService';
import { 
  ref, 
  set as firebaseSet, 
  onValue, 
  onDisconnect, 
  off, 
  remove, 
  push,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  DatabaseReference
} from 'firebase/database';
import { database } from './firebase';

export interface PlayerPosition {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  speed: number;
  timestamp: number;
}

// Extended player with position information
export interface OnlinePlayer extends User {
  position: PlayerPosition;
  lastUpdated: number;
  roomId: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  trackId: string;
}

interface MultiplayerState {
  isConnected: boolean;
  isConnecting: boolean;
  currentRoom: Room | null;
  availableRooms: Room[];
  onlinePlayers: OnlinePlayer[];
  chatMessages: ChatMessage[];
  error: string | null;
  
  // Actions
  connectToMultiplayer: (user: User) => Promise<void>;
  disconnectFromMultiplayer: () => void;
  joinRoom: (roomId: string, user: User) => Promise<void>;
  leaveRoom: () => Promise<void>;
  updatePlayerPosition: (user: User, position: PlayerPosition) => Promise<void>;
  sendChatMessage: (user: User, message: string) => Promise<void>;
  fetchAvailableRooms: () => Promise<void>;
  createNewRoom: (user: User, roomName: string, trackId: string) => Promise<string>;
}

// Reference to the current player's connection
let playerRef: DatabaseReference | null = null;
let roomRef: DatabaseReference | null = null;
let messagesRef: DatabaseReference | null = null;
let currentRoomId: string | null = null;

// Multiplayer store
export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  currentRoom: null,
  availableRooms: [],
  onlinePlayers: [],
  chatMessages: [],
  error: null,
  
  connectToMultiplayer: async (user: User) => {
    set({ isConnecting: true, error: null });
    
    try {
      // Just establish the connection
      set({ 
        isConnected: true,
        isConnecting: false
      });
      
      // Load available rooms
      get().fetchAvailableRooms();
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to connect to multiplayer',
        isConnecting: false
      });
    }
  },
  
  disconnectFromMultiplayer: () => {
    // First leave any current room
    const currentState = get();
    if (currentState.currentRoom) {
      get().leaveRoom();
    }
    
    set({ 
      isConnected: false,
      onlinePlayers: [],
      chatMessages: []
    });
  },
  
  joinRoom: async (roomId: string, user: User) => {
    // Leave current room first if already in one
    if (currentRoomId) {
      await get().leaveRoom();
    }
    
    currentRoomId = roomId;
    
    try {
      // Reference to the room
      roomRef = ref(database, `rooms/${roomId}`);
      console.log("Joining room:", roomRef);
      // Reference to players in this room
      const playersRef = ref(database, `rooms/${roomId}/players`);
      
      // Reference to this specific player
      playerRef = ref(database, `rooms/${roomId}/players/${user.id}`);
      
      // Reference to chat messages for this room
      messagesRef = ref(database, `rooms/${roomId}/messages`);
      
      // Listen for player movement data
      onChildAdded(playersRef, (snapshot) => {
        const player = snapshot.val() as OnlinePlayer;
        set(state => ({
          onlinePlayers: [...state.onlinePlayers.filter(p => p.id !== player.id), player]
        }));
      });
      
      onChildChanged(playersRef, (snapshot) => {
        const player = snapshot.val() as OnlinePlayer;
        set(state => ({
          onlinePlayers: state.onlinePlayers.map(p => 
            p.id === player.id ? player : p
          )
        }));
      });
      
      onChildRemoved(playersRef, (snapshot) => {
        const player = snapshot.val() as OnlinePlayer;
        set(state => ({
          onlinePlayers: state.onlinePlayers.filter(p => p.id !== player.id)
        }));
      });
      
      // Listen for new chat messages
      onChildAdded(messagesRef, (snapshot) => {
        const message = snapshot.val() as ChatMessage;
        set(state => ({
          chatMessages: [...state.chatMessages, message]
        }));
      });
      
      // Initial position
      const initialPosition: PlayerPosition = {
        x: 0,
        y: 0,
        z: 0,
        rotationY: 0,
        speed: 0,
        timestamp: Date.now()
      };
      
      const playerData: OnlinePlayer = {
        ...user,
        position: initialPosition,
        lastUpdated: Date.now(),
        roomId
      };
      
      // Use firebaseSet instead of set
      if (playerRef) {
        await firebaseSet(playerRef, {
          id: playerData.id,
          displayName: playerData.displayName,
          email: playerData.email,
          position: playerData.position,
          lastUpdated: playerData.lastUpdated,
          roomId: playerData.roomId
        });
      }
      
      // Set up disconnection cleanup
      if (playerRef) {
        onDisconnect(playerRef).remove();
      }
      
      // Get current room information
      onValue(roomRef, (snapshot) => {
        const roomData = snapshot.val() as Room;
        if (roomData) {
          set({ currentRoom: roomData });
        }
      });
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to join room',
      });
    }
  },
  
  leaveRoom: async () => {
    if (!currentRoomId) return;
    
    try {
      // Remove player from room
      if (playerRef) {
        await remove(playerRef);
        playerRef = null;
      }
      
      // Remove listeners
      if (roomRef) {
        off(roomRef);
        roomRef = null;
      }
      
      if (messagesRef) {
        off(messagesRef);
        messagesRef = null;
      }
      
      currentRoomId = null;
      
      set({
        currentRoom: null,
        onlinePlayers: [],
        chatMessages: []
      });
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to leave room',
      });
    }
  },
  
  updatePlayerPosition: async (user: User, position: PlayerPosition) => {
    if (!playerRef) return;
    
    try {
      const update = {
        position: {
          ...position,
          timestamp: Date.now()
        },
        lastUpdated: Date.now()
      };
      
      await firebaseSet(playerRef, { 
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        position: update.position,
        lastUpdated: update.lastUpdated,
        roomId: currentRoomId
      });
      
    } catch (error) {
      console.error('Failed to update position:', error);
    }
  },
  
  sendChatMessage: async (user: User, message: string) => {
    if (!messagesRef || !message.trim()) return;
    
    try {
      const newMessageRef = push(messagesRef);
      const messageData: ChatMessage = {
        id: newMessageRef.key || Date.now().toString(),
        senderId: user.id,
        senderName: user.displayName,
        message: message.trim(),
        timestamp: Date.now()
      };
      
      await firebaseSet(newMessageRef, messageData);
      
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  },
  
  fetchAvailableRooms: async () => {
    try {
      const roomsRef = ref(database, 'rooms');
      
      onValue(roomsRef, (snapshot) => {
        const roomsData = snapshot.val();
        const rooms: Room[] = [];
        
        if (roomsData) {
          Object.keys(roomsData).forEach((key) => {
            const room = roomsData[key];
            
            // Count the number of players in the room
            let playerCount = 0;
            if (room.players) {
              playerCount = Object.keys(room.players).length;
            }
            
            rooms.push({
              id: key,
              name: room.name || `Room ${key.substring(0, 5)}`,
              playerCount,
              maxPlayers: room.maxPlayers || 8,
              trackId: room.trackId || 'default'
            });
          });
        }
        
        set({ availableRooms: rooms });
      });
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch rooms',
      });
    }
  },
  
  createNewRoom: async (user: User, roomName: string, trackId: string): Promise<string> => {
    try {
      const roomsRef = ref(database, 'rooms');
      const newRoomRef = push(roomsRef);
      const roomId = newRoomRef.key!;
      
      const roomData: Room = {
        id: roomId,
        name: roomName || `${user.displayName}'s Room`,
        playerCount: 0,
        maxPlayers: 8,
        trackId: trackId || 'default'
      };
      
      await firebaseSet(newRoomRef, roomData);
      
      // Automatically join the newly created room
      await get().joinRoom(roomId, user);
      
      return roomId;
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create room',
      });
      return '';
    }
  }
}));