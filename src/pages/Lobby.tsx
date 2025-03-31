// src/pages/Lobby.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/AuthService';
import { useMultiplayerStore } from '../services/MultiplayerService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, Plus, RefreshCw, LogOut, Users } from 'lucide-react';
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
import LoginModal from '../components/LoginModal';

const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { 
    connectToMultiplayer, 
    availableRooms, 
    fetchAvailableRooms, 
    joinRoom, 
    createNewRoom,
    isConnected,
    disconnectFromMultiplayer
  } = useMultiplayerStore();
  
  const [isCreateRoomDialogOpen, setIsCreateRoomDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
    } else if (user && !isConnected) {
      connectToMultiplayer(user);
    }
  }, [isAuthenticated, user, isConnected, connectToMultiplayer]);
  
  useEffect(() => {
    // Refresh the room list when connected
    if (isConnected) {
      fetchAvailableRooms();
    }
    
    // Set up interval to refresh rooms
    const intervalId = setInterval(() => {
      if (isConnected) {
        fetchAvailableRooms();
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [isConnected, fetchAvailableRooms]);
  
  const handleJoinRoom = async (roomId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await joinRoom(roomId, user);
      navigate('/game');
    } catch (error) {
      console.error('Failed to join room:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateRoom = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const roomId = await createNewRoom(user, newRoomName || `${user.displayName}'s Room`, 'default');
      setIsCreateRoomDialogOpen(false);
      
      if (roomId) {
        navigate('/game');
      }
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    disconnectFromMultiplayer();
    logout();
    navigate('/');
  };
  
  const refreshRooms = () => {
    fetchAvailableRooms();
  };

  // If not authenticated, show login modal
  if (!isAuthenticated) {
    return <LoginModal isOpen={isLoginModalOpen} onClose={() => navigate('/')} />;
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-white">Racing Lobby</h1>
            {user && (
              <p className="text-racing-silver">Welcome, {user.displayName}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button onClick={refreshRooms} variant="outline" className="bg-opacity-80">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button onClick={() => navigate('/')} variant="outline" className="bg-opacity-80">
              <Car className="h-4 w-4 mr-2" />
              Home
            </Button>
            
            <Button onClick={handleLogout} variant="outline" className="bg-opacity-80">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>
        
        <div className="mb-8">
          <Button 
            onClick={() => setIsCreateRoomDialogOpen(true)}
            className="bg-racing-red hover:bg-red-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> 
            Create New Room
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableRooms.map((room) => (
            <Card key={room.id} className="card-racing border-none">
              <CardHeader>
                <CardTitle className="text-white">{room.name}</CardTitle>
                <CardDescription className="text-racing-silver">
                  Default Track
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-racing-silver">
                  <Users className="h-4 w-4 mr-2" />
                  {room.playerCount} / {room.maxPlayers} racers
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleJoinRoom(room.id)} 
                  disabled={room.playerCount >= room.maxPlayers || isLoading} 
                  className="w-full bg-racing-red hover:bg-red-700 text-white"
                >
                  {room.playerCount >= room.maxPlayers 
                    ? 'Room Full' 
                    : isLoading ? 'Joining...' : 'Join Race'}
                </Button>
              </CardFooter>
            </Card>
          ))}
          
          {availableRooms.length === 0 && (
            <div className="col-span-full text-center py-16 card-racing rounded-lg border-none">
              <div className="mb-4">
                <Car size={48} className="mx-auto text-racing-red" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">No Race Rooms Available</h3>
              <p className="text-racing-silver mb-6">Create a new room to start racing with friends!</p>
              <Button 
                onClick={() => setIsCreateRoomDialogOpen(true)}
                className="bg-racing-red hover:bg-red-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" /> 
                Create Room
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Room Dialog */}
      <Dialog open={isCreateRoomDialogOpen} onOpenChange={setIsCreateRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Race Room</DialogTitle>
            <DialogDescription>
              Set up a new room for multiplayer racing.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="room-name" className="block text-sm font-medium mb-1">
                Room Name
              </label>
              <Input
                id="room-name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder={user ? `${user.displayName}'s Room` : "My Racing Room"}
                className="bg-white"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateRoomDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRoom} 
              disabled={isLoading}
              className="bg-racing-red hover:bg-red-700 text-white"
            >
              {isLoading ? 'Creating...' : 'Create & Join'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Lobby;