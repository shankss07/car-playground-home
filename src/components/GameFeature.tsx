
import React from 'react';

interface GameFeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const GameFeature: React.FC<GameFeatureProps> = ({ title, description, icon }) => {
  return (
    <div className="card-racing rounded-lg p-6 hover:scale-105 transition-transform duration-300">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 text-racing-red p-3 bg-racing-dark/50 rounded-full">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-racing-silver">{description}</p>
      </div>
    </div>
  );
};

export default GameFeature;
