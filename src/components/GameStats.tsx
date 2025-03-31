
import React from 'react';
import { Star } from 'lucide-react';

interface StatProps {
  value: string;
  label: string;
}

const Stat: React.FC<StatProps> = ({ value, label }) => (
  <div className="flex flex-col items-center group hover:scale-110 transition-all duration-300">
    <div className="relative">
      <Star size={64} className="text-racing-red animate-pulse" fill="#E50914" strokeWidth={1} />
      <span className="text-3xl font-bold text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">{value}</span>
    </div>
    <span className="text-racing-silver text-sm mt-2 group-hover:text-white transition-colors">{label}</span>
  </div>
);

const GameStats: React.FC = () => {
  return (
    <div className="card-racing rounded-lg p-6 mt-8 flex justify-around relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute -inset-2 bg-racing-red opacity-10 blur-xl animate-pulse"></div>
      
      <Stat value="100+" label="Tracks" />
      <Stat value="50+" label="Cars" />
      <Stat value="1M+" label="Players" />
    </div>
  );
};

export default GameStats;
