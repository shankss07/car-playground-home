
import React from 'react';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const PlayButton: React.FC = () => {
  return (
    <Link to="/game">
      <button 
        className="group flex items-center justify-center gap-2 px-8 py-4 text-white font-bold text-xl rounded-full racing-gradient hover:brightness-110 transition-all duration-300 play-button-shadow hover:scale-105"
        onMouseDown={() => {
          document.getElementById('play-button')?.classList.add('animate-rev-engine');
        }}
        onMouseUp={() => {
          document.getElementById('play-button')?.classList.remove('animate-rev-engine');
        }}
      >
        <span id="play-button">PLAY NOW</span>
        <Play className="ml-2 group-hover:translate-x-1 transition-transform duration-300" size={24} />
      </button>
    </Link>
  );
};

export default PlayButton;
