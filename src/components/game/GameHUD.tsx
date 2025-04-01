
import React from 'react';
import { GameState } from './GameEngine';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface GameHUDProps {
  gameState: GameState;
  restartGame: () => void;
}

const GameHUD: React.FC<GameHUDProps> = ({ gameState, restartGame }) => {
  const { score, gameOver, collisionTime, maxCollisionTime, difficulty, policeCarsCount } = gameState;
  
  // Calculate collision progress percentage
  const collisionProgress = (collisionTime / maxCollisionTime) * 100;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Score display */}
      <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg">
        <div className="text-2xl font-bold">Score: {score}</div>
        <div className="text-sm">Difficulty: {difficulty}</div>
        <div className="text-sm">Police Cars: {policeCarsCount}</div>
      </div>
      
      {/* Collision warning */}
      {collisionTime > 0 && !gameOver && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64">
          <div className="text-center text-white mb-1 font-bold animate-pulse">
            POLICE CONTACT!
          </div>
          <div className="h-4 bg-gray-700 rounded-full">
            <div 
              className="h-4 bg-red-600 rounded-full transition-all duration-200 ease-linear"
              style={{ width: `${collisionProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Game over dialog */}
      <AlertDialog open={gameOver} onOpenChange={() => {}}>
        <AlertDialogContent className="pointer-events-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Game Over!</AlertDialogTitle>
            <AlertDialogDescription>
              You were caught by the police!
              <div className="text-xl font-bold mt-2">Final Score: {score}</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={restartGame}>
              Try Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GameHUD;
