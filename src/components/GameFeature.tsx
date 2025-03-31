
import React from 'react';

interface GameFeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const GameFeature: React.FC<GameFeatureProps> = ({ title, description, icon }) => {
  return (
    <div className="card-racing rounded-lg p-6 hover:scale-110 transition-transform duration-300 relative overflow-hidden">
      {/* Animated border effect */}
      <div className="absolute inset-0 border-2 border-racing-red opacity-30 rounded-lg animate-pulse"></div>
      
      <div className="flex flex-col items-center text-center relative z-10">
        <div className="mb-4 text-racing-red p-3 bg-racing-dark/60 rounded-full transform hover:rotate-12 transition-all duration-300">
          {React.cloneElement(icon as React.ReactElement, { 
            size: 42,
            className: "animate-pulse"
          })}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-racing-silver">{description}</p>
      </div>
    </div>
  );
};

export default GameFeature;
