
import * as THREE from 'three';

export interface RoadObject {
  mesh: THREE.Group | THREE.Mesh;
  type: string;
  collisionRadius: number;
}

export const setupRoadObjectGeneration = (
  scene: THREE.Scene,
  roadObjects: RoadObject[],
  roadObjectTypes: any[],
  carPosition: React.MutableRefObject<THREE.Vector3>,
  maxRoadObjects: number
): { cleanup: () => void } => {
  
  // Generate objects periodically
  const objectGenerationInterval = setInterval(() => {
    const roadObject = generateRoadObject(roadObjects, roadObjectTypes, carPosition.current, maxRoadObjects);
    if (roadObject) {
      roadObjects.push(roadObject);
      scene.add(roadObject.mesh);
    }
  }, 500);

  return {
    cleanup: () => clearInterval(objectGenerationInterval)
  };
};

// Reuse existing function from RoadSystem.tsx
export { generateRoadObject } from './RoadSystem';
