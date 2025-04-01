
import React from 'react';
import { Link } from 'react-router-dom';

interface ColorOption {
  name: string;
  hex: number;
}

interface GameSettingsProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  carColor: number;
  setCarColor: (color: number) => void;
  maxSpeedFactor: number;
  setMaxSpeedFactor: (factor: number) => void;
}

const GameSettings: React.FC<GameSettingsProps> = ({
  showSettings,
  setShowSettings,
  carColor,
  setCarColor,
  maxSpeedFactor,
  setMaxSpeedFactor
}) => {
  // Available car colors with names
  const colorOptions: ColorOption[] = [
    { name: "Red", hex: 0xff0000 },
    { name: "Blue", hex: 0x0000ff },
    { name: "Green", hex: 0x00ff00 },
    { name: "Yellow", hex: 0xffff00 },
    { name: "Purple", hex: 0x800080 },
    { name: "Orange", hex: 0xffa500 },
    { name: "Black", hex: 0x000000 },
    { name: "White", hex: 0xffffff }
  ];

  return (
    <>
      {/* Instructions overlay */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow z-10">
        <h2 className="font-bold text-lg">Car Controls</h2>
        <ul className="text-sm">
          <li><strong>W</strong> - Accelerate</li>
          <li><strong>S</strong> - Brake/Reverse</li>
          <li><strong>A</strong> - Turn Left</li>
          <li><strong>D</strong> - Turn Right</li>
        </ul>
        <button 
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? "Hide Settings" : "Show Settings"}
        </button>
        <Link to="/" className="mt-2 ml-2 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm inline-block">
          Exit Game
        </Link>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded shadow z-10 w-64">
          <h2 className="font-bold text-lg mb-2">Car Settings</h2>
          
          {/* Car color selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Car Color</label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map((color) => (
                <div 
                  key={color.name}
                  className={`w-full h-8 rounded cursor-pointer border-2 ${carColor === color.hex ? 'border-blue-500' : 'border-gray-300'}`}
                  style={{ backgroundColor: '#' + color.hex.toString(16).padStart(6, '0') }}
                  onClick={() => setCarColor(color.hex)}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          
          {/* Speed factor slider */}
          <div>
            <label className="block text-sm font-medium mb-1">Speed: {maxSpeedFactor.toFixed(1)}x</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={maxSpeedFactor}
              onChange={(e) => setMaxSpeedFactor(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameSettings;
