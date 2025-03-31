
import React from 'react';
import { Link } from 'react-router-dom';

const Game: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-racing-dark">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8 text-white">Game Coming Soon</h1>
        <p className="text-xl text-racing-silver mb-8">The race is being prepared...</p>
        <Link to="/" className="inline-block px-6 py-3 bg-racing-red hover:bg-red-700 text-white font-bold rounded-full transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default Game;
