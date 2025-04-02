
import * as THREE from 'three';

export const setupCamera = (camera: THREE.PerspectiveCamera): void => {
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);
};

export const updateCamera = (
  camera: THREE.PerspectiveCamera, 
  carPosition: THREE.Vector3, 
  carRotation: number
): void => {
  const cameraDistance = 10;
  const cameraHeight = 5;
  const cameraLagFactor = 0.1; // How quickly camera follows car
  
  // Calculate ideal camera position
  const idealCameraX = carPosition.x - Math.sin(carRotation) * cameraDistance;
  const idealCameraZ = carPosition.z - Math.cos(carRotation) * cameraDistance;
  
  // Smooth camera movement
  camera.position.x += (idealCameraX - camera.position.x) * cameraLagFactor;
  camera.position.z += (idealCameraZ - camera.position.z) * cameraLagFactor;
  camera.position.y = cameraHeight;
  
  // Make camera look at car
  camera.lookAt(
    carPosition.x,
    carPosition.y + 1.5, // Look at car roof
    carPosition.z
  );
};
