
import React from 'react';
import PlayButton from '../components/PlayButton';
import GameFeature from '../components/GameFeature';
import GameStats from '../components/GameStats';
import { Car, Flag, Users } from 'lucide-react';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24 flex flex-col items-center">
        <div className="text-center mb-12 relative">
          {/* Animated checkered flag background */}
          <div className="absolute -inset-4 checkered-flag opacity-5 animate-pulse rounded-full"></div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-4 relative animate-cartoon-bounce">
            <span className="text-racing-red drop-shadow-[0_2px_4px_rgba(229,9,20,0.7)]">TURBO</span>
            <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">RACING</span>
          </h1>
          <p className="text-racing-silver text-xl md:text-2xl max-w-2xl mx-auto">
            The most intense online racing experience. Choose your car, customize your ride, and leave your opponents in the dust.
          </p>
        </div>

        {/* Play Button */}
        <div className="mb-16 animate-pulse">
          <PlayButton />
        </div>

        {/* Game Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          <GameFeature
            icon={<Car />}
            title="Exotic Cars"
            description="Race with over 50 meticulously detailed exotic cars from the world's top manufacturers."
          />
          <GameFeature
            icon={<Flag />}
            title="Global Tracks"
            description="Compete on famous tracks from around the world with realistic weather conditions."
          />
          <GameFeature
            icon={<Users />}
            title="Multiplayer"
            description="Challenge your friends or race against players from around the globe."
          />
        </div>

        {/* Game Stats */}
        <div className="w-full max-w-5xl">
          <GameStats />
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-racing-silver">
        <p>© 2023 TURBO RACING. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
