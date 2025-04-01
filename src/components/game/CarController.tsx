
import * as THREE from 'three';
import { createPlayerCar, updateCarPhysics } from './Car';

interface KeysPressed {
  [key: string]: boolean;
}

interface CarPhysicsState {
  carSpeed: number;
  carRotation: number;
}

export const initializePlayerCar = (
  scene: THREE.Scene,
  carColor: number
): THREE.Group => {
  const carGroup = createPlayerCar(carColor);
  scene.add(carGroup);
  return carGroup;
};

export const updatePlayerCar = (
  carGroup: THREE.Group,
  keysPressed: KeysPressed,
  maxSpeedFactor: number,
  currentState: CarPhysicsState
): CarPhysicsState => {
  // Update car physics
  const { carSpeed, carRotation } = updateCarPhysics(
    carGroup,
    keysPressed,
    maxSpeedFactor,
    currentState.carSpeed,
    currentState.carRotation
  );
  
  return { carSpeed, carRotation };
};

export const updateCarWheels = (
  carGroup: THREE.Group,
  wheelRotationSpeed: number
): void => {
  // Animate wheels based on speed
  // Access wheels from carGroup children
  const wheelFL = carGroup.children[2] as THREE.Mesh;
  const wheelFR = carGroup.children[3] as THREE.Mesh;
  const wheelRL = carGroup.children[4] as THREE.Mesh;
  const wheelRR = carGroup.children[5] as THREE.Mesh;
  
  wheelFL.rotation.x += wheelRotationSpeed;
  wheelFR.rotation.x += wheelRotationSpeed;
  wheelRL.rotation.x += wheelRotationSpeed;
  wheelRR.rotation.x += wheelRotationSpeed;
};

export const updateCarColor = (
  carGroup: THREE.Group,
  carColor: number
): void => {
  const existingCarBody = carGroup.children[0] as THREE.Mesh;
  if (existingCarBody && existingCarBody.material) {
    (existingCarBody.material as THREE.MeshStandardMaterial).color.set(carColor);
  }
};
