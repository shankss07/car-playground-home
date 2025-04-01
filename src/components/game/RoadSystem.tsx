
import * as THREE from 'three';

interface RoadSegment {
  road: THREE.Mesh;
  laneMarking: THREE.Mesh;
  roadsideLeft: THREE.Mesh;
  roadsideRight: THREE.Mesh;
  zPosition: number;
}

interface RoadObject {
  mesh: THREE.Group | THREE.Mesh;
  type: string;
  collisionRadius: number;
}

export const createRoadSegment = (zPosition: number): RoadSegment => {
  const roadWidth = 20;
  
  // Create road segment
  const roadGeometry = new THREE.PlaneGeometry(roadWidth, 100);
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
  const laneMarkingGeometry = new THREE.PlaneGeometry(0.5, 70);
  const laneMarkingMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    side: THREE.DoubleSide 
  });
  const laneMarking = new THREE.Mesh(laneMarkingGeometry, laneMarkingMaterial);
  laneMarking.rotation.x = Math.PI / 2;
  laneMarking.position.y = 0.02; // Slightly above road
  laneMarking.position.z = zPosition;
  
  // Create roadside (grass)
  const roadsideGeometry = new THREE.PlaneGeometry(100, 100);
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
  
  return {
    road,
    laneMarking,
    roadsideLeft,
    roadsideRight,
    zPosition
  };
};

interface RoadObjectType {
  name: string;
  create: (x: number, z: number) => RoadObject;
}

export const createRoadObjectTypes = (): RoadObjectType[] => {
  return [
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
        
        return {
          mesh: group,
          type: 'billboard',
          collisionRadius: 2
        };
      }
    }
  ];
};

export const updateRoadSegments = (
  roadSegments: RoadSegment[], 
  playerZPos: number, 
  roadSegmentLength: number, 
  numRoadSegments: number
): void => {
  roadSegments.forEach((segment) => {
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
};

export const generateRoadObject = (
  roadObjects: RoadObject[], 
  roadObjectTypes: RoadObjectType[], 
  playerPosition: THREE.Vector3, 
  maxRoadObjects: number
): RoadObject | null => {
  // Don't generate if we already have enough objects
  if (roadObjects.length >= maxRoadObjects) return null;
  
  // Choose a random object type
  const randomType = roadObjectTypes[Math.floor(Math.random() * roadObjectTypes.length)];
  
  // Random position on side of the road
  const side = Math.random() > 0.5 ? 1 : -1;
  const distance = (20 / 2) + 5 + Math.random() * 20; // 20 is roadWidth
  const x = side * distance;
  
  // Position ahead of the car
  const z = playerPosition.z - 100 - Math.random() * 50;
  
  // Create the object
  return randomType.create(x, z);
};

export const cleanupRoadObjects = (
  roadObjects: RoadObject[],
  scene: THREE.Scene,
  playerZPos: number
): void => {
  const removalDistance = 100; // Distance behind player to remove objects
  for (let i = roadObjects.length - 1; i >= 0; i--) {
    if (roadObjects[i].mesh.position.z > playerZPos + removalDistance) {
      scene.remove(roadObjects[i].mesh);
      roadObjects.splice(i, 1);
    }
  }
};
