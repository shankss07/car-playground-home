
import * as THREE from 'three';
import React from 'react';
import { setupCamera } from './CameraSystem';
import { setupLighting } from './LightingSystem';

export const initThreeJS = (
  mountRef: React.RefObject<HTMLDivElement>
): { 
  scene: THREE.Scene, 
  camera: THREE.PerspectiveCamera, 
  renderer: THREE.WebGLRenderer 
} => {
  if (!mountRef.current) {
    throw new Error("Mount reference is not available");
  }

  // Three.js initialization
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x87CEEB); // Sky blue background
  renderer.shadowMap.enabled = true;
  
  // Add renderer to DOM
  mountRef.current.appendChild(renderer.domElement);
  
  // Initialize camera and lighting
  setupCamera(camera);
  setupLighting(scene);
  
  return { scene, camera, renderer };
};

export const handleResize = (
  camera: THREE.PerspectiveCamera, 
  renderer: THREE.WebGLRenderer
): void => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};
