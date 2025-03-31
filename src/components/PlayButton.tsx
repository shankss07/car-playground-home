
import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const PlayButton: React.FC = () => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <Link to="/game">
      <button 
        className="group flex items-center justify-center gap-2 px-10 py-6 text-white font-bold text-2xl rounded-full racing-gradient hover:brightness-110 transition-all duration-300 play-button-shadow hover:scale-105 relative overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseDown={() => {
          document.getElementById('play-button')?.classList.add('animate-rev-engine');
        }}
        onMouseUp={() => {
          document.getElementById('play-button')?.classList.remove('animate-rev-engine');
        }}
      >
        {/* Animated flames effect on hover */}
        {isHovering && (
          <>
            <div className="absolute -left-2 -bottom-4 w-12 h-12 bg-orange-500 rounded-full blur-md animate-flame-1"></div>
            <div className="absolute -right-2 -bottom-4 w-10 h-10 bg-yellow-500 rounded-full blur-md animate-flame-2"></div>
          </>
        )}
        
        {/* Animated clouds/speed effect */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="absolute bg-white h-1 rounded-full transform -rotate-45"
              style={{
                width: `${Math.random() * 30 + 20}px`,
                top: `${Math.random() * 100}%`, 
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 1 + 0.5}s`,
              }}
            ></div>
          ))}
        </div>
        
        <span id="play-button" className="relative z-10">PLAY NOW</span>
        <Play className="ml-2 group-hover:translate-x-1 transition-transform duration-300 relative z-10" size={28} />
      </button>
    </Link>
  );
};

export default PlayButton;
