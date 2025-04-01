
import * as THREE from 'three';
import { 
  createRoadSegment, 
  createRoadObjectTypes,
  updateRoadSegments,
  generateRoadObject,
  cleanupRoadObjects,
  RoadSegment,
  RoadObject,
  RoadObjectType
} from './RoadSystem';

export const initializeRoadSystem = (
  scene: THREE.Scene
): {
  roadSegments: RoadSegment[];
  roadObjects: RoadObject[];
  roadObjectTypes: RoadObjectType[];
} => {
  // Game road system setup
  const roadLength = 1000;
  const roadSegmentLength = 100;
  const numRoadSegments = roadLength / roadSegmentLength;
  const roadSegments: RoadSegment[] = [];
  
  // Create initial road segments
  for (let i = 0; i < numRoadSegments; i++) {
    const zPosition = -i * roadSegmentLength;
    const segment = createRoadSegment(zPosition);
    roadSegments.push(segment);
    scene.add(segment.road, segment.laneMarking, segment.roadsideLeft, segment.roadsideRight);
  }
  
  // Road objects system
  const roadObjects: RoadObject[] = [];
  const roadObjectTypes = createRoadObjectTypes();
  
  return {
    roadSegments,
    roadObjects,
    roadObjectTypes
  };
};

export const updateRoadSystem = (
  scene: THREE.Scene,
  roadSegments: RoadSegment[],
  roadObjects: RoadObject[],
  roadObjectTypes: RoadObjectType[],
  playerPosition: THREE.Vector3,
  roadSegmentLength: number,
  numRoadSegments: number,
  maxRoadObjects: number
): void => {
  // Update road segments
  updateRoadSegments(roadSegments, playerPosition.z, roadSegmentLength, numRoadSegments);
  
  // Clean up road objects that are too far behind
  cleanupRoadObjects(roadObjects, scene, playerPosition.z);
};

export const generateNewRoadObject = (
  scene: THREE.Scene,
  roadObjects: RoadObject[],
  roadObjectTypes: RoadObjectType[],
  playerPosition: THREE.Vector3,
  maxRoadObjects: number
): void => {
  const roadObject = generateRoadObject(roadObjects, roadObjectTypes, playerPosition, maxRoadObjects);
  if (roadObject) {
    roadObjects.push(roadObject);
    scene.add(roadObject.mesh);
  }
};
