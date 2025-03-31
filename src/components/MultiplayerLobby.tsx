// src/components/MultiplayerLobby.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/AuthService';
import { useMultiplayerStore, Room } from '../services/MultiplayerService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Users, Plus, RefreshCw, LogOut } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MultiplayerLobby: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { 
    connectToMultiplayer, 
    availableRooms, 
    fetchAvailableRooms, 
    joinRoom, 
    createNewRoom,
    isConnected
  } = useMultiplayerStore();
  
  const [isCreateRoomDialogOpen, setIsCreateRoomDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (user && !isConnected) {
      connectToMultiplayer(user);
    }
    
    // Refresh the room list
    if (isConnected) {
      fetchAvailableRooms();
    }
  }, [user, isConnected]);
  
  const handleJoinRoom = async (roomId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    await joinRoom(roomId, user);
    setIsLoading(false);
    navigate('/game');
  };
  
  const handleCreateRoom = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const roomId = await createNewRoom(user, newRoomName, 'default');
    console.log("Check room creation", roomId);
    setIsLoading(false);
    setIsCreateRoomDialogOpen(false);
    
    if (roomId) {
      navigate('/game');
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const refreshRooms = () => {
    fetchAvailableRooms();
  };
  
  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Multiplayer Lobby</h1>
          <p className="text-racing-silver">Welcome, {user.displayName}</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={refreshRooms} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>
      
      <div className="mb-6">
        <Button onClick={() => setIsCreateRoomDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> 
          Create New Room
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availableRooms.map((room) => (
          <RoomCard 
            key={room.id}
            room={room}
            onJoin={() => handleJoinRoom(room.id)}
            isLoading={isLoading}
          />
        ))}
        
        {availableRooms.length === 0 && (
          <div className="col-span-full text-center py-10 text-racing-silver">
            <div className="mb-4">
              <Car size={48} className="mx-auto text-racing-red" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Race Rooms Available</h3>
            <p>Create a new room to start racing with friends!</p>
          </div>
        )}
      </div>
      
      <CreateRoomDialog
        isOpen={isCreateRoomDialogOpen}
        onClose={() => setIsCreateRoomDialogOpen(false)}
        roomName={newRoomName}
        onRoomNameChange={setNewRoomName}
        onCreateRoom={handleCreateRoom}
        isLoading={isLoading}
      />
    </div>
  );
};

interface RoomCardProps {
  room: Room;
  onJoin: () => void;
  isLoading: boolean;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin, isLoading }) => {
  const isFull = room.playerCount >= room.maxPlayers;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{room.name}</CardTitle>
        <CardDescription>
          Track: {room.trackId === 'default' ? 'Default Track' : room.trackId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-muted-foreground">
          <Users className="h-4 w-4 mr-2" />
          {room.playerCount} / {room.maxPlayers} racers
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onJoin} 
          disabled={isFull || isLoading} 
          className="w-full"
          variant={isFull ? "secondary" : "default"}
        >
          {isFull ? 'Room Full' : isLoading ? 'Joining...' : 'Join Race'}
        </Button>
      </CardFooter>
    </Card>
  );
};

interface CreateRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  onRoomNameChange: (name: string) => void;
  onCreateRoom: () => void;
  isLoading: boolean;
}

const CreateRoomDialog: React.FC<CreateRoomDialogProps> = ({
  isOpen,
  onClose,
  roomName,
  onRoomNameChange,
  onCreateRoom,
  isLoading
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Race Room</DialogTitle>
          <DialogDescription>
            Set up a new room for multiplayer racing.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="room-name">Room Name</Label>
            <Input
              id="room-name"
              value={roomName}
              onChange={(e) => onRoomNameChange(e.target.value)}
              placeholder="My Awesome Race Room"
            />
          </div>
          
          {/* Could add track selection here */}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onCreateRoom} 
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MultiplayerLobby;