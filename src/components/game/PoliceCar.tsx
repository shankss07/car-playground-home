
import * as THREE from 'three';

export interface PoliceCar {
  mesh: THREE.Group;
  speed: number;
  chaseDistance: number;
  lights: {
    red: THREE.Mesh;
    blue: THREE.Mesh;
  };
  wheels: {
    fl: THREE.Mesh;
    fr: THREE.Mesh;
    rl: THREE.Mesh;
    rr: THREE.Mesh;
  };
  touchingPlayer: boolean;
  touchStartTime: number | null;
}

export const createPoliceCar = (x: number, z: number): PoliceCar => {
  const policeGroup = new THREE.Group();
  
  // Police car body - slightly different shape than player car
  const policeBodyGeometry = new THREE.BoxGeometry(2, 1, 4.2);
  const policeBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x000080 }); // Dark blue
  const policeBody = new THREE.Mesh(policeBodyGeometry, policeBodyMaterial);
  policeBody.position.y = 0.5;
  policeBody.castShadow = true;
  policeGroup.add(policeBody);
  
  // Police car cabin
  const policeCabinGeometry = new THREE.BoxGeometry(1.6, 0.6, 2);
  const policeCabinMaterial = new THREE.MeshStandardMaterial({ color: 0x000050 });
  const policeCabin = new THREE.Mesh(policeCabinGeometry, policeCabinMaterial);
  policeCabin.position.y = 1.3;
  policeCabin.position.z = -0.5;
  policeCabin.castShadow = true;
  policeGroup.add(policeCabin);
  
  // Police light bar
  const lightBarGeometry = new THREE.BoxGeometry(1.5, 0.3, 1);
  const lightBarMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const lightBar = new THREE.Mesh(lightBarGeometry, lightBarMaterial);
  lightBar.position.y = 1.9;
  lightBar.position.z = -0.5;
  lightBar.castShadow = true;
  policeGroup.add(lightBar);
  
  // Red light
  const redLightGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.4);
  const redLightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const redLight = new THREE.Mesh(redLightGeometry, redLightMaterial);
  redLight.position.set(-0.4, 2.05, -0.5);
  policeGroup.add(redLight);
  
  // Blue light
  const blueLightGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.4);
  const blueLightMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const blueLight = new THREE.Mesh(blueLightGeometry, blueLightMaterial);
  blueLight.position.set(0.4, 2.05, -0.5);
  policeGroup.add(blueLight);
  
  // Create wheels (same as player car)
  const policeWheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32);
  policeWheelGeometry.rotateX(Math.PI / 2);
  const policeWheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  
  // Front-left wheel
  const policeWheelFL = new THREE.Mesh(policeWheelGeometry, policeWheelMaterial);
  policeWheelFL.position.set(-1.2, 0.5, -1.2);
  policeWheelFL.castShadow = true;
  policeGroup.add(policeWheelFL);
  
  // Front-right wheel
  const policeWheelFR = new THREE.Mesh(policeWheelGeometry, policeWheelMaterial);
  policeWheelFR.position.set(1.2, 0.5, -1.2);
  policeWheelFR.castShadow = true;
  policeGroup.add(policeWheelFR);
  
  // Rear-left wheel
  const policeWheelRL = new THREE.Mesh(policeWheelGeometry, policeWheelMaterial);
  policeWheelRL.position.set(-1.2, 0.5, 1.2);
  policeWheelRL.castShadow = true;
  policeGroup.add(policeWheelRL);
  
  // Rear-right wheel
  const policeWheelRR = new THREE.Mesh(policeWheelGeometry, policeWheelMaterial);
  policeWheelRR.position.set(1.2, 0.5, 1.2);
  policeWheelRR.castShadow = true;
  policeGroup.add(policeWheelRR);
  
  policeGroup.position.set(x, 0, z);
  
  // Create a spotlight for the police car headlights
  const headlight = new THREE.SpotLight(0xffffff, 1);
  headlight.position.set(0, 1, -2);
  headlight.target.position.set(0, 0, -10);
  headlight.angle = 0.3;
  headlight.penumbra = 0.2;
  headlight.distance = 30;
  headlight.castShadow = true;
  policeGroup.add(headlight);
  policeGroup.add(headlight.target);
  
  return {
    mesh: policeGroup,
    speed: 0.45 + Math.random() * 0.1,  // Slightly random speeds
    chaseDistance: 30 + Math.random() * 10,  // How close they try to follow
    wheels: {
      fl: policeWheelFL,
      fr: policeWheelFR,
      rl: policeWheelRL,
      rr: policeWheelRR
    },
    lights: {
      red: redLight,
      blue: blueLight
    },
    touchingPlayer: false,
    touchStartTime: null
  };
};

export const updatePoliceCar = (police: PoliceCar, playerPosition: THREE.Vector3, deltaTime: number): void => {
  // Calculate direction from police car to player
  const dx = playerPosition.x - police.mesh.position.x;
  const dz = playerPosition.z - police.mesh.position.z;
  
  // Calculate angle to player
  const angleToPlayer = Math.atan2(dx, dz);
  
  // Gradually rotate towards player
  const currentRotation = police.mesh.rotation.y;
  const rotationDiff = angleToPlayer - currentRotation;
  
  // Normalize rotation difference to be between -PI and PI
  let normalizedDiff = rotationDiff;
  while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
  while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
  
  // Apply rotation gradually (with a max rotation speed)
  const maxRotation = 0.05;
  if (Math.abs(normalizedDiff) > maxRotation) {
    police.mesh.rotation.y += Math.sign(normalizedDiff) * maxRotation;
  } else {
    police.mesh.rotation.y = angleToPlayer;
  }
  
  // Calculate distance to player - police cars will now always chase player
  const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);
  
  // Adjust speed based on distance (more aggressive when closer)
  const speedMultiplier = distanceToPlayer < 10 ? 1.2 : 1.0;
  
  // Move towards player - now always chase
  police.mesh.position.x += Math.sin(police.mesh.rotation.y) * police.speed * speedMultiplier;
  police.mesh.position.z += Math.cos(police.mesh.rotation.y) * police.speed * speedMultiplier;
  
  // Animate wheels
  police.wheels.fl.rotation.x += police.speed * 0.5;
  police.wheels.fr.rotation.x += police.speed * 0.5;
  police.wheels.rl.rotation.x += police.speed * 0.5;
  police.wheels.rr.rotation.x += police.speed * 0.5;
};

export const flashPoliceLights = (policeCars: PoliceCar[], lightFlashTime: number): void => {
  const flashPeriod = 0.5; // seconds
  
  policeCars.forEach(police => {
    if (lightFlashTime % flashPeriod < flashPeriod / 2) {
      (police.lights.red.material as THREE.MeshBasicMaterial).color.setHex(0xff0000);
      (police.lights.blue.material as THREE.MeshBasicMaterial).color.setHex(0x000099);
    } else {
      (police.lights.red.material as THREE.MeshBasicMaterial).color.setHex(0x990000);
      (police.lights.blue.material as THREE.MeshBasicMaterial).color.setHex(0x0000ff);
    }
  });
};

// New function to handle police car contacts with the player
export const updatePoliceContact = (
  police: PoliceCar, 
  playerGroup: THREE.Group, 
  currentTime: number,
  collisionThreshold: number = 3.0
): void => {
  // Check if police car is touching player
  const touching = police.mesh.position.distanceTo(playerGroup.position) < collisionThreshold;
  
  if (touching) {
    if (!police.touchingPlayer) {
      // Just started touching
      police.touchingPlayer = true;
      police.touchStartTime = currentTime;
    }
  } else {
    // No longer touching
    police.touchingPlayer = false;
    police.touchStartTime = null;
  }
};

// Function to check if player is caught by the police
export const isPlayerCaught = (policeCars: PoliceCar[], currentTime: number, requiredTime: number = 5): boolean => {
  // Check if any police car has been touching player for the required time
  for (const police of policeCars) {
    if (police.touchingPlayer && police.touchStartTime !== null) {
      const touchDuration = currentTime - police.touchStartTime;
      if (touchDuration >= requiredTime) {
        return true;
      }
    }
  }
  return false;
};
