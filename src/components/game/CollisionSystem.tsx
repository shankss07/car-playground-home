
import * as THREE from 'three';

// Define road object types for collision detection
export type RoadObjectType = {
  name: string;
  model: THREE.Group | THREE.Mesh;
  scale: number;
  collisionRadius: number;
  probability: number;
};

export const checkCollision = (
  carPosition: THREE.Vector3,
  objectPosition: THREE.Vector3,
  collisionRadius: number
): boolean => {
  // Simple distance-based collision detection
  const distance = carPosition.distanceTo(objectPosition);
  return distance < collisionRadius;
};
