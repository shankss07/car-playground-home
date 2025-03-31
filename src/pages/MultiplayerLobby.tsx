import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Users, Copy, ArrowRight, RefreshCw } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";

// Helper function to generate room codes
const generateRoomCode = (): string => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
  const parts = Array(3).fill(0).map(() => {
    return Array(3).fill(0).map(() => 
      characters.charAt(Math.floor(Math.random() * characters.length))
    ).join('');
  });
  
  return parts.join('-');
};

interface Player {
  id: string;
  name: string;
  carColor: number;
  isHost: boolean;
}

interface MultiplayerLobbyProps {
  playerName?: string;
}

const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ playerName: initialPlayerName }) => {
  const [activeTab, setActiveTab] = useState<string>('join');
  const [playerName, setPlayerName] = useState<string>(initialPlayerName || '');
  const [roomCode, setRoomCode] = useState<string>('');
  const [generatedRoomCode, setGeneratedRoomCode] = useState<string>(generateRoomCode());
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // Effect to simulate player joining/leaving for demo
  useEffect(() => {
    if (activeTab === 'create' && players.length === 0) {
      // Add the host (current player) to the players list when creating a room
      setPlayers([{
        id: 'self',
        name: playerName || 'You',
        carColor: 0xff0000,
        isHost: true
      }]);
    }
  }, [activeTab, playerName]);

  // Handle room code input
  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    
    // Auto-format with dashes after 3 characters
    if (value.length > 0) {
      value = value.replace(/[^A-Z0-9]/g, ''); // Remove non-alphanumeric
      let formattedValue = '';
      
      for (let i = 0; i < value.length && i < 9; i++) {
        if (i > 0 && i % 3 === 0) {
          formattedValue += '-';
        }
        formattedValue += value[i];
      }
      
      value = formattedValue;
    }
    
    setRoomCode(value);
  };

  // Handle creating a new room
  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      toast({
        title: "Player name required",
        description: "Please enter your name before creating a room",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // In a real implementation, you would create a room on your server
    // For now, we'll simulate a delay and then navigate to the game
    setTimeout(() => {
      navigate(`/game?mode=multiplayer&room=${generatedRoomCode}&host=true&name=${encodeURIComponent(playerName)}`);
    }, 1500);
  };

  // Handle joining a room
  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      toast({
        title: "Player name required",
        description: "Please enter your name before joining a room",
        variant: "destructive"
      });
      return;
    }

    if (roomCode.length < 11 || roomCode.split('-').length !== 3) {
      toast({
        title: "Invalid room code",
        description: "Please enter a valid room code in the format XXX-XXX-XXX",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // In a real implementation, you would validate the room code on your server
    // For now, we'll simulate a delay and then navigate to the game
    setTimeout(() => {
      navigate(`/game?mode=multiplayer&room=${roomCode}&host=false&name=${encodeURIComponent(playerName)}`);
    }, 1500);
  };

  // Copy room code to clipboard
  const copyRoomCode = () => {
    navigator.clipboard.writeText(generatedRoomCode);
    toast({
      title: "Room code copied!",
      description: "The room code has been copied to your clipboard"
    });
  };

  // Generate a new room code
  const regenerateRoomCode = () => {
    setGeneratedRoomCode(generateRoomCode());
  };

  // Mocked function to add random player (for demo)
  const addMockPlayer = () => {
    if (players.length >= 6) {
      toast({
        title: "Room is full",
        description: "Maximum 6 players allowed in a room",
        variant: "destructive"
      });
      return;
    }
    
    const names = ["Alex", "Jordan", "Riley", "Avery", "Casey", "Morgan", "Taylor", "Sam"];
    const colors = [0x0000ff, 0x00ff00, 0xffff00, 0x800080, 0xffa500, 0x00ffff];
    
    const newPlayer: Player = {
      id: `player-${Math.random().toString(36).substring(2, 9)}`,
      name: names[Math.floor(Math.random() * names.length)],
      carColor: colors[Math.floor(Math.random() * colors.length)],
      isHost: false
    };
    
    setPlayers(prev => [...prev, newPlayer]);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl card-racing border-racing-red">
        <CardHeader>
          <CardTitle className="text-3xl text-center text-white">
            <Users className="inline-block mr-2 mb-1" /> Multiplayer Mode
          </CardTitle>
          <CardDescription className="text-center text-racing-silver">
            Race against friends in real-time multiplayer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">Your Name</label>
              <Input 
                placeholder="Enter your name" 
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-racing-dark/50 border-racing-silver/30 text-white"
              />
            </div>
            
            <Tabs defaultValue="join" value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="w-full bg-racing-dark grid grid-cols-2">
                <TabsTrigger value="join">Join Room</TabsTrigger>
                <TabsTrigger value="create">Create Room</TabsTrigger>
              </TabsList>
              
              <TabsContent value="join" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Room Code</label>
                  <Input 
                    placeholder="XXX-XXX-XXX" 
                    value={roomCode}
                    onChange={handleRoomCodeChange}
                    maxLength={11}
                    className="bg-racing-dark/50 border-racing-silver/30 text-white text-center font-mono tracking-widest text-lg uppercase"
                  />
                </div>
                
                <div className="mt-6">
                  <Button 
                    className="w-full racing-gradient"
                    onClick={handleJoinRoom}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    Join Race
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="create" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-white text-sm font-medium">Your Room Code</label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={regenerateRoomCode}
                      className="h-8 text-racing-silver hover:text-white"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" /> New
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <Input 
                      value={generatedRoomCode}
                      readOnly
                      className="bg-racing-dark/50 border-racing-silver/30 text-white text-center font-mono tracking-widest text-lg pr-10"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1 h-8 w-8 text-racing-silver hover:text-white"
                      onClick={copyRoomCode}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-white text-sm font-medium mb-2">Players in Lobby ({players.length}/6)</h3>
                  <div className="bg-racing-dark/60 rounded-md p-2 max-h-40 overflow-y-auto">
                    {players.map((player, index) => (
                      <div key={player.id} className="flex items-center py-2">
                        <div 
                          className="w-4 h-4 rounded-full mr-2" 
                          style={{ backgroundColor: '#' + player.carColor.toString(16).padStart(6, '0') }}
                        ></div>
                        <span className="text-white">{player.name}</span>
                        {player.isHost && (
                          <span className="text-racing-red ml-2 text-xs">(Host)</span>
                        )}
                        {index !== players.length - 1 && <Separator className="mt-2" />}
                      </div>
                    ))}
                    {players.length === 0 && (
                      <div className="text-racing-silver text-center py-2">No players in the lobby</div>
                    )}
                  </div>
                  
                  {/* This button is just for demo purposes - to simulate players joining */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 text-xs border-racing-silver/30 text-racing-silver"
                    onClick={addMockPlayer}
                  >
                    Simulate player joining (demo)
                  </Button>
                </div>
                
                <div className="mt-6">
                  <Button 
                    className="w-full racing-gradient"
                    onClick={handleCreateRoom}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Car className="mr-2 h-4 w-4" />
                    )}
                    Start Game
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" className="text-racing-silver" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MultiplayerLobby;