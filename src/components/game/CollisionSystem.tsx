
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

// Check collision between vehicles (for player and police cars)
export const checkVehicleCollision = (
  vehicle1: THREE.Group,
  vehicle2: THREE.Group,
  collisionThreshold: number = 3.0
): boolean => {
  const distance = vehicle1.position.distanceTo(vehicle2.position);
  return distance < collisionThreshold;
};
