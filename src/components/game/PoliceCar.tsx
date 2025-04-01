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
  active: boolean; // Whether this police car is active in the chase
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
    active: true
  };
};

export const updatePoliceCar = (
  police: PoliceCar, 
  playerPosition: THREE.Vector3, 
  deltaTime: number, 
  difficulty: number
): void => {
  if (!police.active) return; // Skip if police car is not active
  
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
  // Increase rotation speed with difficulty
  const maxRotation = 0.05 * (1 + difficulty * 0.05);
  if (Math.abs(normalizedDiff) > maxRotation) {
    police.mesh.rotation.y += Math.sign(normalizedDiff) * maxRotation;
  } else {
    police.mesh.rotation.y = angleToPlayer;
  }
  
  // Calculate distance to player
  const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);
  
  // Enhanced chasing behavior
  // Scale speed with difficulty
  const speedMultiplier = 1 + (difficulty - 1) * 0.1; // 10% faster per difficulty level
  const currentSpeed = police.speed * speedMultiplier;
  
  // Move towards player if not too close
  if (distanceToPlayer > police.chaseDistance * 0.5) {
    police.mesh.position.x += Math.sin(police.mesh.rotation.y) * currentSpeed;
    police.mesh.position.z += Math.cos(police.mesh.rotation.y) * currentSpeed;
  }
  
  // Animate wheels
  police.wheels.fl.rotation.x += currentSpeed * 0.5;
  police.wheels.fr.rotation.x += currentSpeed * 0.5;
  police.wheels.rl.rotation.x += currentSpeed * 0.5;
  police.wheels.rr.rotation.x += currentSpeed * 0.5;
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

export const spawnPoliceCar = (
  playerPosition: THREE.Vector3,
  existingCars: PoliceCar[]
): PoliceCar => {
  // Spawn the car in a position around the player
  const spawnDistance = 70 + Math.random() * 30; // 70-100 units away
  const spawnAngle = Math.random() * Math.PI * 2; // Random angle around player
  
  const spawnX = playerPosition.x + Math.sin(spawnAngle) * spawnDistance;
  const spawnZ = playerPosition.z + Math.cos(spawnAngle) * spawnDistance;
  
  // Create a new police car
  return createPoliceCar(spawnX, spawnZ);
};

export const resetPoliceCar = (
  police: PoliceCar,
  playerPosition: THREE.Vector3
): void => {
  const spawnDistance = 70 + Math.random() * 30; // 70-100 units away
  const spawnAngle = Math.random() * Math.PI * 2; // Random angle around player
  
  const spawnX = playerPosition.x + Math.sin(spawnAngle) * spawnDistance;
  const spawnZ = playerPosition.z + Math.cos(spawnAngle) * spawnDistance;
  
  police.mesh.position.set(spawnX, 0, spawnZ);
  police.active = true;
};
