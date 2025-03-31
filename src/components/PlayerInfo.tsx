// src/components/PlayerInfo.tsx
import React from 'react';
import { useAuthStore } from '../services/AuthService';
import { useMultiplayerStore } from '../services/MultiplayerService';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlayerInfo: React.FC<{
  showLogout?: boolean;
  className?: string;
}> = ({ showLogout = true, className = '' }) => {
  const { user, logout } = useAuthStore();
  const { disconnectFromMultiplayer } = useMultiplayerStore();
  const navigate = useNavigate();
  
  if (!user) {
    return null;
  }
  
  const handleLogout = () => {
    disconnectFromMultiplayer();
    logout();
    navigate('/');
  };
  
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <Card className={`shadow-md ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <User className="h-4 w-4 mr-2" />
          Player Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center">
          <Avatar className="h-14 w-14 mr-4">
            <AvatarFallback
              style={{ backgroundColor: user.avatarColor }}
              className="text-white text-lg font-semibold"
            >
              {getInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-medium text-lg">{user.displayName}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            
            {showLogout && (
              <div className="flex mt-3 gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate('/settings')}>
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={handleLogout}>
                  <LogOut className="h-3 w-3 mr-1" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerInfo;