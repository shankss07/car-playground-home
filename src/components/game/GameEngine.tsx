
import * as THREE from 'three';
import { PoliceCar } from './PoliceCar';

export const setupLighting = (scene: THREE.Scene): void => {
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  // Add directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 200, 100);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);
};

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
