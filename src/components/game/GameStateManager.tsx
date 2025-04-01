
export interface GameState {
  score: number;
  gameOver: boolean;
  collisionTime: number;
  maxCollisionTime: number;
  elapsedTime: number;
  difficulty: number;
  policeCarsCount: number;
}

export const initialGameState: GameState = {
  score: 0,
  gameOver: false,
  collisionTime: 0,
  maxCollisionTime: 5, // 5 seconds to game over
  elapsedTime: 0,
  difficulty: 1,
  policeCarsCount: 3 // Start with 3 police cars
};

// Update game state based on time survived
export const updateGameState = (
  gameState: GameState,
  deltaTime: number,
  isColliding: boolean
): GameState => {
  // Don't update if game is over
  if (gameState.gameOver) {
    return gameState;
  }
  
  // Calculate new elapsed time
  const newElapsedTime = gameState.elapsedTime + deltaTime;
  
  // Update collision timer if colliding
  let newCollisionTime = isColliding 
    ? gameState.collisionTime + deltaTime
    : 0;
    
  // Check if game over condition met
  const gameOver = newCollisionTime >= gameState.maxCollisionTime;
  
  // Calculate score based on time survived
  const newScore = Math.floor(newElapsedTime * 10);
  
  // Calculate difficulty increase
  // Every 30 seconds, difficulty increases
  const difficultyLevel = Math.floor(newElapsedTime / 30) + 1;
  
  // Calculate how many police cars should be active
  // Add 1 police car for every 2 difficulty levels
  const policeCarsCount = 3 + Math.floor(difficultyLevel / 2);
  
  return {
    score: newScore,
    gameOver: gameOver,
    collisionTime: newCollisionTime,
    maxCollisionTime: gameState.maxCollisionTime,
    elapsedTime: newElapsedTime,
    difficulty: difficultyLevel,
    policeCarsCount: policeCarsCount
  };
};
