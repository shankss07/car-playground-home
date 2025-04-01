
import React from 'react';
import * as THREE from 'three';

interface CarProps {
  color: number;
  maxSpeedFactor: number;
}

export interface CarControls {
  keysPressed: React.MutableRefObject<{[key: string]: boolean}>;
}

const Car: React.FC<CarProps> = ({ color, maxSpeedFactor }) => {
  // This is a rendering component that will be used by the GameScene
  // It doesn't actually render anything in React DOM
  return null; 
};

export const createPlayerCar = (color: number): THREE.Group => {
  const carGroup = new THREE.Group();
  
  // Create car body
  const carBodyGeometry = new THREE.BoxGeometry(2, 1, 4);
  const carBodyMaterial = new THREE.MeshStandardMaterial({ color: color });
  const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
  carBody.position.y = 0.5;
  carBody.castShadow = true;
  carGroup.add(carBody);
  
  // Create car cabin
  const cabinGeometry = new THREE.BoxGeometry(1.5, 0.8, 2);
  const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.y = 1.4;
  cabin.position.z = -0.5;
  cabin.castShadow = true;
  carGroup.add(cabin);
  
  // Create wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32);
  wheelGeometry.rotateX(Math.PI / 2); // Rotate to align with car direction
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  
  // Front-left wheel
  const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheelFL.position.set(-1.2, 0.5, -1.2);
  wheelFL.castShadow = true;
  carGroup.add(wheelFL);
  
  // Front-right wheel
  const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheelFR.position.set(1.2, 0.5, -1.2);
  wheelFR.castShadow = true;
  carGroup.add(wheelFR);
  
  // Rear-left wheel
  const wheelRL = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheelRL.position.set(-1.2, 0.5, 1.2);
  wheelRL.castShadow = true;
  carGroup.add(wheelRL);
  
  // Rear-right wheel
  const wheelRR = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheelRR.position.set(1.2, 0.5, 1.2);
  wheelRR.castShadow = true;
  carGroup.add(wheelRR);
  
  return carGroup;
};

export const updateCarPhysics = (
  carGroup: THREE.Group, 
  keysPressed: {[key: string]: boolean}, 
  maxSpeedFactor: number,
  carSpeed: number,
  carRotation: number
): { carSpeed: number, carRotation: number } => {
  // Car physics parameters
  const BASE_MAX_SPEED = 0.5;
  const MAX_SPEED = BASE_MAX_SPEED * maxSpeedFactor;
  const ACCELERATION = 0.01 * maxSpeedFactor;
  const DECELERATION = 0.005;
  const ROTATION_SPEED = 0.05;
  
  let updatedSpeed = carSpeed;
  let updatedRotation = carRotation;

  // Handle car acceleration/deceleration
  if (keysPressed['w']) {
    updatedSpeed = Math.min(MAX_SPEED, updatedSpeed + ACCELERATION);
  } else if (keysPressed['s']) {
    updatedSpeed = Math.max(-MAX_SPEED * 0.5, updatedSpeed - ACCELERATION);
  } else {
    // Apply deceleration when no keys pressed
    if (updatedSpeed > 0) {
      updatedSpeed = Math.max(0, updatedSpeed - DECELERATION);
    } else if (updatedSpeed < 0) {
      updatedSpeed = Math.min(0, updatedSpeed + DECELERATION);
    }
  }
  
  // Handle car rotation (only when moving)
  if (Math.abs(updatedSpeed) > 0.01) {
    if (keysPressed['a']) {
      updatedRotation += ROTATION_SPEED * (updatedSpeed > 0 ? 1 : -1);
    }
    if (keysPressed['d']) {
      updatedRotation -= ROTATION_SPEED * (updatedSpeed > 0 ? 1 : -1);
    }
  }
  
  // Apply rotation to car model
  carGroup.rotation.y = updatedRotation;
  
  // Move car forward based on speed and rotation
  carGroup.position.x += Math.sin(updatedRotation) * updatedSpeed;
  carGroup.position.z += Math.cos(updatedRotation) * updatedSpeed;

  return { carSpeed: updatedSpeed, carRotation: updatedRotation };
};

export default Car;
