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
  const planetRadius = config.radius;
  
  // Create a blue sphere to represent the ocean base
  const oceanSphere = createOceanSphere(planetRadius);
  oceanSphere.userData.isOcean = true; // Tag it so we can find it later
  scene.add(oceanSphere);
  
  // Create a group to hold all tiles
  const tileGroup = new THREE.Group();
  scene.add(tileGroup);
  
  // Create tile meshes for each tile
  for (const tile of hexes) {
    const tileData = tile.data;
    
    // Skip ocean tiles - they'll be represented by the blue sphere
    if (tileData.terrainType === TerrainType.OCEAN) {
      continue;
    }
    
    // Get color based on terrain type
    const color = terrainColors[tileData.terrainType];
    
    // Create material with better visual properties
    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.1,
      roughness: 0.7,
      flatShading: false, // Use smooth shading instead of flat for more natural look
      side: THREE.FrontSide
    });
    
    // Create the tile mesh
    const mesh = createTileMesh(tile, material, planetRadius);
    
    // Apply smoother elevation based on terrain height
    if (tileData.terrainType !== TerrainType.OCEAN) {
      const position = new THREE.Vector3(tile.center.x, tile.center.y, tile.center.z);
      const normalizedPos = position.clone().normalize();
      
      // Use a smoother, more gradual elevation calculation
      let elevationScale;
      
      // Different elevation scales based on terrain type for more visual distinction
      switch(tileData.terrainType) {
        case TerrainType.MOUNTAINS:
          elevationScale = 0.25;
          break;
        case TerrainType.HILLS:
          elevationScale = 0.15;
          break;
        case TerrainType.FOREST:
          elevationScale = 0.1;
          break;
        default:
          elevationScale = 0.05;
      }
      
      // Use sigmoid function for smoother transition
      const normalizedElevation = 1 / (1 + Math.exp(-(tileData.elevation * 5 - 2)));
      const elevationOffset = normalizedPos.clone().multiplyScalar(normalizedElevation * elevationScale);
      
      mesh.position.add(elevationOffset);
    }
    
    // Store tile data in the mesh for later reference
    mesh.userData = {
      isHex: true,
      hexId: tile.id,
      hexData: tileData,
      isPentagon: tile.vertices.length === 5
    };
    
    // Add to the group
    tileGroup.add(mesh);
    
    // Add resource marker if the tile has a resource
    if (tileData.resource !== ResourceType.NONE) {
      const resourceInfo = resourceMarkers[tileData.resource];
      if (resourceInfo) {
        const resourceMarker = createResourceMarker(resourceInfo.color, resourceInfo.scale);
        const centerPos = new THREE.Vector3(tile.center.x, tile.center.y, tile.center.z);
        const normalizedPos = centerPos.normalize();
        
        // Position resource marker at proper elevation
        const elevationOffset = normalizedPos.clone().multiplyScalar(0.2);
        
        // Normalize center and add elevation
        resourceMarker.position.copy(
          centerPos.normalize().multiplyScalar(planetRadius + elevationOffset.length() + 0.05)
        );
        
        tileGroup.add(resourceMarker);
      }
    }
  }
  
  return tileGroup;
}

// Create the base ocean sphere with better water appearance
function createOceanSphere(radius) {
  const geometry = new THREE.SphereGeometry(radius, 64, 32);
  const material = new THREE.MeshStandardMaterial({
    color: terrainColors[TerrainType.OCEAN],
    metalness: 0.2,
    roughness: 0.5,
    flatShading: false,
    transparent: true,
    opacity: 0.95
  });
  
  const sphere = new THREE.Mesh(geometry, material);
  sphere.userData.isOcean = true; // Tag for easy identification
  return sphere;
}

// Create a mesh for a tile (pentagon or hexagon)
function createTileMesh(tile, material, planetRadius) {
  // Use the tile's center for position
  const center = new THREE.Vector3(tile.center.x, tile.center.y, tile.center.z);
  const normalizedCenter = center.clone().normalize();
  
  // Create extruded geometry with better parameters
  const geometry = createExtrudedTileGeometry(tile, normalizedCenter, planetRadius);
  
  // Create the mesh
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(center);
  
  // Make the tile face outward from the center
  mesh.lookAt(0, 0, 0);
  
  return mesh;
}

// Create extruded geometry for a tile with improved parameters
function createExtrudedTileGeometry(tile, normalDirection, planetRadius) {
  // Create a shape for the tile
  const shape = new THREE.Shape();
  const vertices = tile.vertices;
  
  // Process vertices to create a 2D shape in a plane
  const normal = normalDirection.clone();
  
  // Create a local coordinate system on the tangent plane
  let tangent1 = new THREE.Vector3(1, 0, 0);
  if (Math.abs(normal.dot(tangent1)) > 0.9) {
    tangent1 = new THREE.Vector3(0, 1, 0);
  }
  
  const tangent2 = new THREE.Vector3().crossVectors(normal, tangent1).normalize();
  tangent1 = new THREE.Vector3().crossVectors(tangent2, normal).normalize();
  
  // Project the vertices onto the tangent plane
  const projectedVertices = [];
  
  for (const vertex of vertices) {
    const vertexVec = new THREE.Vector3(vertex.x, vertex.y, vertex.z)
      .sub(new THREE.Vector3(tile.center.x, tile.center.y, tile.center.z));
    
    // Project onto tangent plane
    const x = vertexVec.dot(tangent1);
    const y = vertexVec.dot(tangent2);
    
    projectedVertices.push(new THREE.Vector2(x, y));
  }
  
  // Create the shape
  if (projectedVertices.length > 0) {
    shape.moveTo(projectedVertices[0].x, projectedVertices[0].y);
    for (let i = 1; i < projectedVertices.length; i++) {
      shape.lineTo(projectedVertices[i].x, projectedVertices[i].y);
    }
    shape.closePath();
  }
  
  // Extrude the shape with better settings for more natural look
  const extrudeSettings = {
    depth: 0.15,            // Increased from 0.1 for more depth
    bevelEnabled: true,     // Enable beveling for smoother edges
    bevelThickness: 0.02,   // Small bevel thickness
    bevelSize: 0.02,        // Small bevel size
    bevelSegments: 2        // Number of bevel segments
  };
  
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  
  // Remove backfaces to avoid Z-fighting
  const positionAttribute = geometry.getAttribute('position');
  const positions = positionAttribute.array;
  
  for (let i = 0; i < positions.length; i += 3) {
    // Scale the position to push it slightly outward from the center
    const vertex = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
    
    // Normalize to unit length and scale up slightly to avoid Z-fighting
    if (vertex.z < -0.1) { // Only modify backface vertices
      vertex.z *= 0.9; // Push back face inward slightly
    }
    
    positions[i] = vertex.x;
    positions[i + 1] = vertex.y;
    positions[i + 2] = vertex.z;
  }
  
  positionAttribute.needsUpdate = true;
  geometry.computeVertexNormals(); // Recompute normals for proper lighting
  
  return geometry;
}

function createResourceMarker(color, scale) {
  // Create a more visible resource marker
  const geometry = new THREE.SphereGeometry(0.1, 8, 8);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.7,   // Increased from 0.5
    metalness: 0.8,
    roughness: 0.2
  });
  
  const marker = new THREE.Mesh(geometry, material);
  marker.scale.set(scale, scale, scale);
  
  return marker;
} 