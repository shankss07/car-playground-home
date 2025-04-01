
import React from 'react';
import { Link } from 'react-router-dom';

interface StartScreenProps {
  onStartGame: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-5xl font-bold mb-6 text-white">READY TO RACE?</h1>
      <button 
        className="px-10 py-5 text-2xl font-bold bg-racing-red hover:bg-red-700 text-white rounded-full transition-all duration-200 transform hover:scale-105"
        onClick={onStartGame}
      >
        START ENGINE
      </button>
      <p className="mt-8 text-racing-silver">Use W, A, S, D keys to drive the car</p>
      <Link to="/" className="mt-8 text-sm text-racing-silver hover:text-white underline">
        Back to Home
      </Link>
    </div>
  );
};

export default StartScreen;
