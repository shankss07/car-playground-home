
import * as THREE from 'three';
import { PoliceCar } from './PoliceCar';

// Re-export components with proper type syntax
export { setupLighting } from './LightingSystem';
export { setupCamera, updateCamera } from './CameraSystem';
export { initThreeJS, handleResize } from './ThreeJSInitializer';
export type { RoadObjectType } from './CollisionSystem';

// Re-export types properly with 'export type' syntax
export type { GameState } from './GameStateManager';

