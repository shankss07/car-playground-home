
import React from 'react';

interface StatProps {
  value: string;
  label: string;
}

const Stat: React.FC<StatProps> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="text-3xl font-bold text-racing-red">{value}</span>
    <span className="text-racing-silver text-sm">{label}</span>
  </div>
);

const GameStats: React.FC = () => {
  return (
    <div className="card-racing rounded-lg p-6 mt-8 flex justify-around">
      <Stat value="100+" label="Tracks" />
      <Stat value="50+" label="Cars" />
      <Stat value="1M+" label="Players" />
    </div>
  );
};

export default GameStats;
