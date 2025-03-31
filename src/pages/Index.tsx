// src/pages/Index.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PlayButton from '../components/PlayButton';
import GameFeature from '../components/GameFeature';
import GameStats from '../components/GameStats';
import { Car, Users } from 'lucide-react';
import LoginModal from '../components/LoginModal';
import { useAuthStore } from '../services/AuthService';

const Index: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const handleMultiplayerClick = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24 flex flex-col items-center">
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-bold mb-4">
            <span className="text-racing-red">TURBO</span>
            <span className="text-white">RACING</span>
          </h1>
          <p className="text-racing-silver text-xl md:text-2xl max-w-2xl mx-auto">
            The most intense online racing experience. Choose your car, customize your ride, and leave your opponents in the dust.
          </p>
        </div>

        {/* Play Buttons */}
        <div className="mb-16 flex flex-col md:flex-row gap-4 items-center">
          <PlayButton />
          
          {isAuthenticated ? (
            <Link to="/lobby" className="group flex items-center justify-center gap-2 px-8 py-4 text-white font-bold text-xl rounded-full bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-105">
              <span>MULTIPLAYER</span>
              <Users className="ml-2 group-hover:translate-x-1 transition-transform duration-300" size={24} />
            </Link>
          ) : (
            <button 
              onClick={handleMultiplayerClick} 
              className="group flex items-center justify-center gap-2 px-8 py-4 text-white font-bold text-xl rounded-full bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-105"
            >
              <span>MULTIPLAYER</span>
              <Users className="ml-2 group-hover:translate-x-1 transition-transform duration-300" size={24} />
            </button>
          )}
        </div>

        {/* Game Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          <GameFeature
            icon={<Car size={32} />}
            title="Exotic Cars"
            description="Race with over 50 meticulously detailed exotic cars from the world's top manufacturers."
          />
          <GameFeature
            icon={<Car size={32} />}
            title="Global Tracks"
            description="Compete on famous tracks from around the world with realistic weather conditions."
          />
          <GameFeature
            icon={<Users size={32} />}
            title="Multiplayer"
            description="Challenge your friends or race against players from around the globe in real-time multiplayer races."
          />
        </div>

        {/* Game Stats */}
        <div className="w-full max-w-5xl">
          <GameStats />
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-racing-silver">
        <p>© 2025 TURBO RACING. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;