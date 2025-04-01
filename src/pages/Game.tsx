import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';

// Define TypeScript interfaces
interface ColorOption {
  name: string;
  hex: number;
}

interface KeysPressed {
  [key: string]: boolean;
}

interface PoliceCar {
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
}

const Game: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const keysPressed = useRef<KeysPressed>({});
  const animationFrameId = useRef<number | null>(null);
  const [carColor, setCarColor] = useState<number>(0xff0000); // Default red
  const [maxSpeedFactor, setMaxSpeedFactor] = useState<number>(1); // Default speed multiplier
  const [showSettings, setShowSettings] = useState<boolean>(true);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Available car colors with names
  const colorOptions: ColorOption[] = [
    { name: "Red", hex: 0xff0000 },
    { name: "Blue", hex: 0x0000ff },
    { name: "Green", hex: 0x00ff00 },
    { name: "Yellow", hex: 0xffff00 },
    { name: "Purple", hex: 0x800080 },
    { name: "Orange", hex: 0xffa500 },
    { name: "Black", hex: 0x000000 },
    { name: "White", hex: 0xffffff }
  ];
  
  // Start the game
  const startGame = () => {
    setGameStarted(true);
  };

  useEffect(() => {
    if (!mountRef.current || !gameStarted) return;

    // Three.js initialization
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87CEEB); // Sky blue background
    renderer.shadowMap.enabled = true;
    
    // Add renderer to DOM
    mountRef.current.appendChild(renderer.domElement);
    
    // Handle window resize
    const handleResize = (): void => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    
    // Game objects and variables
    const carGroup = new THREE.Group();
    let carSpeed = 0;
    let carRotation = 0;
    
    // Car physics parameters
    const BASE_MAX_SPEED = 0.5;
    const MAX_SPEED = BASE_MAX_SPEED * maxSpeedFactor;
    const ACCELERATION = 0.01 * maxSpeedFactor;
    const DECELERATION = 0.005;
    const ROTATION_SPEED = 0.05;
    
    // Create car body
    const carBodyGeometry = new THREE.BoxGeometry(2, 1, 4);
    const carBodyMaterial = new THREE.MeshStandardMaterial({ color: carColor });
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
    
    // Add car to scene
    carGroup.position.set(0, 0, 0);
    scene.add(carGroup);

    // ---- CREATE ENDLESS ROAD ----
    const roadWidth = 20;
    const roadLength = 1000;
    const roadSegments = [];
    const roadSegmentLength = 100;
    const numRoadSegments = roadLength / roadSegmentLength;
    
    const createRoadSegment = (zPosition) => {
      // Create road segment
      const roadGeometry = new THREE.PlaneGeometry(roadWidth, roadSegmentLength);
      const roadMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x444444,
        side: THREE.DoubleSide,
        roughness: 0.8
      });
      const road = new THREE.Mesh(roadGeometry, roadMaterial);
      road.rotation.x = Math.PI / 2;
      road.position.set(0, 0.01, zPosition);  // Slightly above the ground
      road.receiveShadow = true;
      
      // Add lane markings
      const laneMarkingGeometry = new THREE.PlaneGeometry(0.5, roadSegmentLength * 0.7);
      const laneMarkingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        side: THREE.DoubleSide 
      });
      const laneMarking = new THREE.Mesh(laneMarkingGeometry, laneMarkingMaterial);
      laneMarking.rotation.x = Math.PI / 2;
      laneMarking.position.y = 0.02; // Slightly above road
      
      // Create roadside (grass)
      const roadsideGeometry = new THREE.PlaneGeometry(100, roadSegmentLength);
      const roadsideLeftMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a7f1e, 
        side: THREE.DoubleSide,
        roughness: 0.8 
      });
      const roadsideRightMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a7f1e, 
        side: THREE.DoubleSide,
        roughness: 0.8 
      });
      
      const roadsideLeft = new THREE.Mesh(roadsideGeometry, roadsideLeftMaterial);
      roadsideLeft.rotation.x = Math.PI / 2;
      roadsideLeft.position.set(-roadWidth/2 - 50, 0, zPosition);
      roadsideLeft.receiveShadow = true;
      
      const roadsideRight = new THREE.Mesh(roadsideGeometry, roadsideRightMaterial);
      roadsideRight.rotation.x = Math.PI / 2;
      roadsideRight.position.set(roadWidth/2 + 50, 0, zPosition);
      roadsideRight.receiveShadow = true;
      
      scene.add(road, laneMarking, roadsideLeft, roadsideRight);
      
      return {
        road,
        laneMarking,
        roadsideLeft,
        roadsideRight,
        zPosition
      };
    };
    
    // Create initial road segments
    for (let i = 0; i < numRoadSegments; i++) {
      const zPosition = -i * roadSegmentLength;
      roadSegments.push(createRoadSegment(zPosition));
    }
    
    // --- RANDOM OBJECTS GENERATOR ---
    const roadObjects = [];
    const maxRoadObjects = 100; // Maximum number of objects on the road at any time
    
    // Types of road objects with their creation functions
    const roadObjectTypes = [
      {
        name: 'tree',
        create: (x, z) => {
          const treeGroup = new THREE.Group();
          
          // Tree trunk
          const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
          const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
          const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
          trunk.position.y = 2;
          trunk.castShadow = true;
          treeGroup.add(trunk);
          
          // Tree foliage
          const foliageGeometry = new THREE.ConeGeometry(3, 6, 8);
          const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x006400 });
          const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
          foliage.position.y = 6;
          foliage.castShadow = true;
          treeGroup.add(foliage);
          
          treeGroup.position.set(x, 0, z);
          scene.add(treeGroup);
          
          return {
            mesh: treeGroup,
            type: 'tree',
            collisionRadius: 3
          };
        }
      },
      {
        name: 'rock',
        create: (x, z) => {
          const rockGeometry = new THREE.DodecahedronGeometry(
            1 + Math.random() * 1.5, // Random size
            0
          );
          const rockMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080, 
            roughness: 0.9
          });
          const rock = new THREE.Mesh(rockGeometry, rockMaterial);
          
          // Random rotation
          rock.rotation.x = Math.random() * Math.PI;
          rock.rotation.y = Math.random() * Math.PI;
          rock.rotation.z = Math.random() * Math.PI;
          
          rock.position.set(x, 1, z);
          rock.castShadow = true;
          scene.add(rock);
          
          return {
            mesh: rock,
            type: 'rock',
            collisionRadius: 2
          };
        }
      },
      {
        name: 'billboard',
        create: (x, z) => {
          const group = new THREE.Group();
          
          // Billboard post
          const postGeometry = new THREE.BoxGeometry(0.5, 5, 0.5);
          const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
          const post = new THREE.Mesh(postGeometry, postMaterial);
          post.position.y = 2.5;
          post.castShadow = true;
          group.add(post);
          
          // Billboard sign
          const signGeometry = new THREE.BoxGeometry(4, 3, 0.2);
          const signMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
          const sign = new THREE.Mesh(signGeometry, signMaterial);
          sign.position.y = 6;
          sign.castShadow = true;
          group.add(sign);
          
          // Add text or logo on the billboard (simplified as a colored square)
          const logoGeometry = new THREE.PlaneGeometry(3, 2);
          const logoMaterial = new THREE.MeshBasicMaterial({ 
            color: Math.random() > 0.5 ? 0xFF0000 : 0x0000FF
          });
          const logo = new THREE.Mesh(logoGeometry, logoMaterial);
          logo.position.y = 6;
          logo.position.z = 0.11;
          group.add(logo);
          
          group.position.set(x, 0, z);
          scene.add(group);
          
          return {
            mesh: group,
            type: 'billboard',
            collisionRadius: 2
          };
        }
      }
    ];
    
    const generateRoadObject = () => {
      // Don't generate if we already have enough objects
      if (roadObjects.length >= maxRoadObjects) return;
      
      // Choose a random object type
      const randomType = roadObjectTypes[Math.floor(Math.random() * roadObjectTypes.length)];
      
      // Random position on side of the road
      const side = Math.random() > 0.5 ? 1 : -1;
      const distance = (roadWidth / 2) + 5 + Math.random() * 20;
      const x = side * distance;
      
      // Position ahead of the car
      const z = carGroup.position.z - 100 - Math.random() * 50;
      
      // Create the object
      const roadObject = randomType.create(x, z);
      roadObjects.push(roadObject);
    };
    
    // Periodically generate new objects
    setInterval(generateRoadObject, 500);
    
    // --- POLICE CAR ---
    const createPoliceCar = (x, z) => {
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
      scene.add(policeGroup);
      
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
        }
      };
    };
    
    // Create police cars
    const policeCars: PoliceCar[] = [];
    
    // Create 3 police cars at different positions
    policeCars.push(createPoliceCar(-5, -50));
    policeCars.push(createPoliceCar(5, -70));
    policeCars.push(createPoliceCar(0, -90));
    
    // Flash police lights
    let lightFlashTime = 0;
    const flashPoliceLights = (deltaTime: number) => {
      lightFlashTime += deltaTime;
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
    
    // Position camera for 3rd person view
    camera.position.set(0, 5, 10);
    camera.lookAt(carGroup.position);
    
    // Handle keyboard controls
    const handleKeyDown = (e: KeyboardEvent): void => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent): void => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Game clock for time-based animations
    const clock = new THREE.Clock();
    
    // Game loop
    const animate = (): void => {
      const deltaTime = clock.getDelta();
      
      // Handle car acceleration/deceleration
      if (keysPressed.current['w']) {
        carSpeed = Math.min(MAX_SPEED, carSpeed + ACCELERATION);
      } else if (keysPressed.current['s']) {
        carSpeed = Math.max(-MAX_SPEED * 0.5, carSpeed - ACCELERATION);
      } else {
        // Apply deceleration when no keys pressed
        if (carSpeed > 0) {
          carSpeed = Math.max(0, carSpeed - DECELERATION);
        } else if (carSpeed < 0) {
          carSpeed = Math.min(0, carSpeed + DECELERATION);
        }
      }
      
      // Handle car rotation (only when moving)
      if (Math.abs(carSpeed) > 0.01) {
        if (keysPressed.current['a']) {
          carRotation += ROTATION_SPEED * (carSpeed > 0 ? 1 : -1);
        }
        if (keysPressed.current['d']) {
          carRotation -= ROTATION_SPEED * (carSpeed > 0 ? 1 : -1);
        }
      }
      
      // Apply rotation to car model
      carGroup.rotation.y = carRotation;
      
      // Move car forward based on speed and rotation
      carGroup.position.x += Math.sin(carRotation) * carSpeed;
      carGroup.position.z += Math.cos(carRotation) * carSpeed;
      
      // Animate wheels based on speed
      const wheelRotationSpeed = carSpeed * 0.5;
      wheelFL.rotation.x += wheelRotationSpeed;
      wheelFR.rotation.x += wheelRotationSpeed;
      wheelRL.rotation.x += wheelRotationSpeed;
      wheelRR.rotation.x += wheelRotationSpeed;
      
      // Update police cars
      policeCars.forEach(police => {
        // Calculate direction from police car to player
        const dx = carGroup.position.x - police.mesh.position.x;
        const dz = carGroup.position.z - police.mesh.position.z;
        
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
        
        // Calculate distance to player
        const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);
        
        // Move towards player with a maximum chase distance
        if (distanceToPlayer > police.chaseDistance) {
          police.mesh.position.x += Math.sin(police.mesh.rotation.y) * police.speed;
          police.mesh.position.z += Math.cos(police.mesh.rotation.y) * police.speed;
        }
        
        // Animate wheels
        police.wheels.fl.rotation.x += police.speed * 0.5;
        police.wheels.fr.rotation.x += police.speed * 0.5;
        police.wheels.rl.rotation.x += police.speed * 0.5;
        police.wheels.rr.rotation.x += police.speed * 0.5;
      });
      
      // Flash police lights
      flashPoliceLights(deltaTime);
      
      // Check if we need to move road segments
      const playerZPos = carGroup.position.z;
      
      roadSegments.forEach((segment, index) => {
        // If player has passed this segment, move it ahead
        if (segment.zPosition - roadSegmentLength > playerZPos) {
          // Calculate new position (move to front)
          const newZPos = playerZPos - (numRoadSegments * roadSegmentLength) + roadSegmentLength;
          
          // Update position of all meshes in segment
          segment.road.position.z = newZPos;
          segment.laneMarking.position.z = newZPos;
          segment.roadsideLeft.position.z = newZPos;
          segment.roadsideRight.position.z = newZPos;
          
          // Update stored position
          segment.zPosition = newZPos;
        }
      });
      
      // Remove objects too far behind the player
      const removalDistance = 100; // Distance behind player to remove objects
      for (let i = roadObjects.length - 1; i >= 0; i--) {
        if (roadObjects[i].mesh.position.z > playerZPos + removalDistance) {
          scene.remove(roadObjects[i].mesh);
          roadObjects.splice(i, 1);
        }
      }
      
      // Update camera position for 3rd person view
      const cameraDistance = 10;
      const cameraHeight = 5;
      const cameraLagFactor = 0.1; // How quickly camera follows car
      
      // Calculate ideal camera position
      const idealCameraX = carGroup.position.x - Math.sin(carRotation) * cameraDistance;
      const idealCameraZ = carGroup.position.z - Math.cos(carRotation) * cameraDistance;
      
      // Smooth camera movement
      camera.position.x += (idealCameraX - camera.position.x) * cameraLagFactor;
      camera.position.z += (idealCameraZ - camera.position.z) * cameraLagFactor;
      camera.position.y = cameraHeight;
      
      // Make camera look at car
      camera.lookAt(
        carGroup.position.x,
        carGroup.position.y + 1.5, // Look at car roof
        carGroup.position.z
      );
      
      // Render scene
      renderer.render(scene, camera);
      
      // Continue animation loop
      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    // Start animation loop
    animate();
    
    // Update car material when color changes
    const existingCarBody = carGroup.children[0] as THREE.Mesh;
    if (existingCarBody && existingCarBody.material) {
      (existingCarBody.material as THREE.MeshStandardMaterial).color.set(carColor);
    }
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [carColor, maxSpeedFactor, gameStarted]); // Re-run effect when car color or speed factor changes

  return (
    <div className="w-screen h-screen overflow-hidden bg-racing-dark">
      {!gameStarted ? (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-5xl font-bold mb-6 text-white">READY TO RACE?</h1>
          <button 
            className="px-10 py-5 text-2xl font-bold bg-racing-red hover:bg-red-700 text-white rounded-full transition-all duration-200 transform hover:scale-105"
            onClick={startGame}
          >
            START ENGINE
          </button>
          <p className="mt-8 text-racing-silver">Use W, A, S, D keys to drive the car</p>
          <Link to="/" className="mt-8 text-sm text-racing-silver hover:text-white underline">
            Back to Home
          </Link>
        </div>
      ) : (
        <div ref={mountRef} className="w-screen h-screen overflow-hidden">
          {/* Instructions overlay */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow z-10">
            <h2 className="font-bold text-lg">Car Controls</h2>
            <ul className="text-sm">
              <li><strong>W</strong> - Accelerate</li>
              <li><strong>S</strong> - Brake/Reverse</li>
              <li><strong>A</strong> - Turn Left</li>
              <li><strong>D</strong> - Turn Right</li>
            </ul>
            <button 
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? "Hide Settings" : "Show Settings"}
            </button>
            <Link to="/" className="mt-2 ml-2 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm inline-block">
              Exit Game
            </Link>
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded shadow z-10 w-64">
              <h2 className="font-bold text-lg mb-2">Car Settings</h2>
              
              {/* Car color selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Car Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <div 
                      key={color.name}
                      className={`w-full h-8 rounded cursor-pointer border-2 ${carColor === color.hex ? 'border-blue-500' : 'border-gray-300'}`}
                      style={{ backgroundColor: '#' + color.hex.toString(16).padStart(6, '0') }}
                      onClick={() => setCarColor(color.hex)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              {/* Speed factor slider */}
              <div>
                <label className="block text-sm font-medium mb-1">Speed: {maxSpeedFactor.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={maxSpeedFactor}
                  onChange={(e) => setMaxSpeedFactor(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Game;
