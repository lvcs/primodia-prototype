import * as THREE from 'three';
import { TerrainType, ResourceType } from './worldGenerator.js';

// Define colors for different terrain types
const terrainColors = {
  [TerrainType.OCEAN]: 0x0077be,
  [TerrainType.PLAINS]: 0x7cfc00,
  [TerrainType.FOREST]: 0x228b22,
  [TerrainType.HILLS]: 0x8b4513,
  [TerrainType.MOUNTAINS]: 0x808080,
  [TerrainType.DESERT]: 0xf4a460,
  [TerrainType.TUNDRA]: 0xf0f8ff
};

// Resource markers
const resourceMarkers = {
  [ResourceType.GRAIN]: { color: 0xffff00, scale: 0.2 },
  [ResourceType.LIVESTOCK]: { color: 0xcd853f, scale: 0.2 },
  [ResourceType.WOOD]: { color: 0x8b4513, scale: 0.2 },
  [ResourceType.STONE]: { color: 0x696969, scale: 0.2 },
  [ResourceType.IRON]: { color: 0x708090, scale: 0.2 },
  [ResourceType.GOLD]: { color: 0xffd700, scale: 0.2 },
  [ResourceType.OIL]: { color: 0x000000, scale: 0.2 }
};

export function createHexSphere(world, scene) {
  const { hexes, config } = world;
  const hexRadius = config.hexSize;
  const planetRadius = config.radius;
  
  // Create a group to hold all hexes
  const hexGroup = new THREE.Group();
  scene.add(hexGroup);
  
  // Create a hex geometry (simplified)
  const hexShape = new THREE.Shape();
  const hexCorners = 6;
  const hexAngle = (2 * Math.PI) / hexCorners;
  
  for (let i = 0; i < hexCorners; i++) {
    const angle = i * hexAngle;
    const x = hexRadius * Math.cos(angle);
    const y = hexRadius * Math.sin(angle);
    
    if (i === 0) {
      hexShape.moveTo(x, y);
    } else {
      hexShape.lineTo(x, y);
    }
  }
  
  const hexGeometry = new THREE.ExtrudeGeometry(hexShape, {
    depth: 0.1,
    bevelEnabled: false
  });
  
  // Create hex meshes for each hex tile
  for (const hex of hexes) {
    const hexData = hex.data;
    
    // Get color based on terrain type
    const color = terrainColors[hexData.terrainType];
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.1,
      roughness: 0.8,
      flatShading: true
    });
    
    // Create mesh
    const mesh = new THREE.Mesh(hexGeometry, material);
    
    // Position and orient the hex on the sphere surface
    const position = new THREE.Vector3(hex.position.x, hex.position.y, hex.position.z);
    mesh.position.copy(position);
    
    // Make the hex face outward from the center of the sphere
    mesh.lookAt(0, 0, 0);
    
    // Orient it correctly
    mesh.rotateZ(Math.random() * Math.PI); // Random rotation for variety
    
    // Add some elevation based on terrain height
    mesh.scale.z = 1 + hexData.elevation;
    
    // Store hex data in the mesh for later reference
    mesh.userData = {
      isHex: true,
      hexId: hex.id,
      hexData
    };
    
    // Add to the group
    hexGroup.add(mesh);
    
    // Add resource marker if the hex has a resource
    if (hexData.resource !== ResourceType.NONE) {
      const resourceInfo = resourceMarkers[hexData.resource];
      if (resourceInfo) {
        const resourceMarker = createResourceMarker(resourceInfo.color, resourceInfo.scale);
        resourceMarker.position.copy(position.normalize().multiplyScalar(planetRadius + 0.2));
        hexGroup.add(resourceMarker);
      }
    }
  }
  
  return hexGroup;
}

function createResourceMarker(color, scale) {
  const geometry = new THREE.SphereGeometry(0.1, 8, 8);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.5,
    metalness: 0.8,
    roughness: 0.2
  });
  
  const marker = new THREE.Mesh(geometry, material);
  marker.scale.set(scale, scale, scale);
  
  return marker;
} 