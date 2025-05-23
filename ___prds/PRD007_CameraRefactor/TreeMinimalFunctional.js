import * as THREE from 'three';

/**
 * Functional Ultra-Minimal Tree System - No classes, pure functions
 * Memory reduction: 99.5% through aggressive data compression
 */

// Shared geometries cache
let minimalResources = null;

/**
 * Initialize minimal tree resources
 */
export function initializeMinimalResources() {
  if (minimalResources) return minimalResources;
  
  minimalResources = {
    geometries: {
      simple: createMinimalTreeGeometry(3),   // 3 triangles
      basic: createMinimalTreeGeometry(6),    // 6 triangles
      cross: createCrossBillboard()           // Cross billboard
    },
    materials: {
      green: new THREE.MeshBasicMaterial({ color: 0x228B22, fog: true }),
      darkGreen: new THREE.MeshBasicMaterial({ color: 0x006400, fog: true }),
      lightGreen: new THREE.MeshBasicMaterial({ color: 0x32CD32, fog: true })
    }
  };
  
  return minimalResources;
}

/**
 * Create ultra-simple tree geometry
 */
function createMinimalTreeGeometry(segments) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const normals = [];
  
  // Trunk (just a thin rectangle)
  vertices.push(
    -0.05, 0, 0,    0.05, 0, 0,    0.05, 1, 0,
    0.05, 1, 0,     -0.05, 1, 0,   -0.05, 0, 0
  );
  
  // Add normals for trunk
  for (let i = 0; i < 6; i++) {
    normals.push(0, 0, 1);
  }
  
  // Canopy (simple triangle/cone)
  if (segments === 3) {
    // Ultra-minimal: just one triangle
    vertices.push(
      0, 1, 0,     -0.8, 2.5, 0,    0.8, 2.5, 0
    );
    normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1);
  } else {
    // Basic: simple diamond shape
    const height = 2.5;
    const radius = 0.8;
    const angleStep = (Math.PI * 2) / segments;
    
    for (let i = 0; i < segments; i++) {
      const angle1 = i * angleStep;
      const angle2 = ((i + 1) % segments) * angleStep;
      
      vertices.push(
        0, 1, 0,
        Math.cos(angle1) * radius, height, Math.sin(angle1) * radius,
        Math.cos(angle2) * radius, height, Math.sin(angle2) * radius
      );
      
      normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
    }
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  
  return geometry;
}

/**
 * Create cross billboard for distant trees
 */
function createCrossBillboard() {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const uvs = [];
  
  // First plane
  vertices.push(
    -1, 0, 0,  1, 0, 0,   1, 3, 0,
    1, 3, 0,   -1, 3, 0,  -1, 0, 0
  );
  
  // Second plane (rotated 90 degrees)
  vertices.push(
    0, 0, -1,  0, 0, 1,   0, 3, 1,
    0, 3, 1,   0, 3, -1,  0, 0, -1
  );
  
  // UVs for texture mapping
  for (let i = 0; i < 2; i++) {
    uvs.push(0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0);
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  
  return geometry;
}

/**
 * Pack 3D position into a single float (lossy compression)
 */
export function packPosition(pos) {
  const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
  const theta = Math.atan2(pos.y, pos.x);
  const phi = Math.acos(pos.z / r);
  
  // Pack into float32 mantissa bits (limited precision)
  const packed = (Math.floor(theta * 1000) & 0xFFF) << 12 | (Math.floor(phi * 1000) & 0xFFF);
  return packed;
}

/**
 * Pack tree properties into a single float
 */
export function packProperties(type, size, colorVariation) {
  const typeInt = type & 0x3; // 2 bits
  const sizeInt = Math.floor(size * 15) & 0xF; // 4 bits  
  const colorInt = colorVariation & 0x3; // 2 bits
  
  return (typeInt << 6) | (sizeInt << 2) | colorInt;
}

/**
 * Unpack position from float
 */
export function unpackPosition(packed, sphereRadius) {
  const packedInt = Math.floor(packed);
  const theta = ((packedInt >> 12) & 0xFFF) / 1000;
  const phi = (packedInt & 0xFFF) / 1000;
  
  return {
    x: sphereRadius * Math.sin(phi) * Math.cos(theta),
    y: sphereRadius * Math.sin(phi) * Math.sin(theta), 
    z: sphereRadius * Math.cos(phi)
  };
}

/**
 * Unpack tree properties from float
 */
export function unpackProperties(packed) {
  const packedInt = Math.floor(packed);
  return {
    type: (packedInt >> 6) & 0x3,
    size: ((packedInt >> 2) & 0xF) / 15,
    colorVariation: packedInt & 0x3
  };
}

/**
 * Generate minimal tree data from tiles
 */
export function generateMinimalTreeData(tiles) {
  const treeData = [];
  let totalTrees = 0;
  
  tiles.forEach(tile => {
    const treeCount = Math.floor(tile.area * 500); // Reduced density
    const sphereRadius = Math.sqrt(
      tile.center.x ** 2 + tile.center.y ** 2 + tile.center.z ** 2
    );
    
    for (let i = 0; i < treeCount; i++) {
      const position = generateSimpleTreePosition(tile, sphereRadius);
      
      // Pack all data into just 2 floats per tree
      const packedPosition = packPosition(position);
      const treeType = Math.floor(Math.random() * 3); // 0-2
      const size = 0.8 + Math.random() * 0.4; // 0.8-1.2
      const colorVariation = Math.floor(Math.random() * 3); // 0-2
      const packedProperties = packProperties(treeType, size, colorVariation);
      
      treeData.push(packedPosition, packedProperties);
      totalTrees++;
    }
  });
  
  console.log(`[MinimalTrees] Generated ${totalTrees} trees (${treeData.length * 4} bytes)`);
  
  return {
    data: new Float32Array(treeData),
    count: totalTrees,
    memoryUsage: treeData.length * 4 // 4 bytes per float
  };
}

/**
 * Simple tree position generation
 */
function generateSimpleTreePosition(tile, sphereRadius) {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * Math.sqrt(tile.area / Math.PI) * 0.8;
  
  const offset = {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    z: 0
  };
  
  // Project to sphere
  const center = new THREE.Vector3(tile.center.x, tile.center.y, tile.center.z);
  const tangent = new THREE.Vector3(1, 0, 0).cross(center).normalize();
  const bitangent = center.clone().cross(tangent).normalize();
  
  const worldOffset = tangent.multiplyScalar(offset.x).add(bitangent.multiplyScalar(offset.y));
  const finalPos = center.add(worldOffset).normalize().multiplyScalar(sphereRadius);
  
  return { x: finalPos.x, y: finalPos.y, z: finalPos.z };
}

/**
 * Unpack and sort trees into LOD buckets
 */
export function unpackMinimalTreesToLOD(treeData, sphereRadius, cameraPosition) {
  const buckets = {
    detailed: [],
    simple: [],
    cross: []
  };
  
  for (let i = 0; i < treeData.data.length; i += 2) {
    const position = unpackPosition(treeData.data[i], sphereRadius);
    const properties = unpackProperties(treeData.data[i + 1]);
    
    const distance = cameraPosition.distanceTo(new THREE.Vector3(position.x, position.y, position.z));
    
    const tree = {
      position,
      scale: 0.8 + properties.size * 0.4,
      type: properties.type,
      colorVariation: properties.colorVariation,
      distance
    };
    
    if (distance < 1000) {
      buckets.detailed.push(tree);
    } else if (distance < 3000) {
      buckets.simple.push(tree);
    } else {
      buckets.cross.push(tree);
    }
  }
  
  return buckets;
}

/**
 * Create instanced mesh from minimal tree data
 */
function createMinimalInstancedMesh(lodLevel, trees, resources) {
  if (trees.length === 0) return null;
  
  const geometryKey = lodLevel === 'detailed' ? 'basic' : lodLevel === 'simple' ? 'simple' : 'cross';
  const geometry = resources.geometries[geometryKey];
  const material = resources.materials.green; // Could vary based on properties
  
  const mesh = new THREE.InstancedMesh(geometry, material, trees.length);
  
  trees.forEach((tree, index) => {
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3(tree.position.x, tree.position.y, tree.position.z);
    const scale = new THREE.Vector3(tree.scale, tree.scale, tree.scale);
    
    // Orient tree away from sphere center
    const normal = position.clone().normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

/**
 * Render minimal trees with LOD
 */
export function renderMinimalTrees(treeData, scene, cameraPosition, sphereRadius) {
  const resources = initializeMinimalResources();
  const buckets = unpackMinimalTreesToLOD(treeData, sphereRadius, cameraPosition);
  
  const meshes = [];
  
  // Create meshes for each LOD level
  Object.entries(buckets).forEach(([lodLevel, trees]) => {
    const mesh = createMinimalInstancedMesh(lodLevel, trees, resources);
    if (mesh) {
      scene.add(mesh);
      meshes.push(mesh);
    }
  });
  
  const stats = {
    detailed: buckets.detailed.length,
    simple: buckets.simple.length,
    cross: buckets.cross.length,
    total: buckets.detailed.length + buckets.simple.length + buckets.cross.length,
    memoryUsage: treeData.memoryUsage
  };
  
  console.log(`[MinimalTrees] Rendered: ${stats.detailed} detailed, ${stats.simple} simple, ${stats.cross} cross`);
  
  return { meshes, stats };
}

/**
 * Clear minimal trees from scene
 */
export function clearMinimalTrees(scene, meshes) {
  if (meshes) {
    meshes.forEach(mesh => scene.remove(mesh));
  }
}

/**
 * Dispose minimal resources
 */
export function disposeMinimalResources() {
  if (minimalResources) {
    Object.values(minimalResources.geometries).forEach(geo => geo.dispose());
    Object.values(minimalResources.materials).forEach(mat => mat.dispose());
    minimalResources = null;
  }
}

/**
 * Compare with original system
 */
export function getMinimalMemoryComparison(treeCount) {
  const originalBytes = treeCount * 1660; // Your current system
  const minimalBytes = treeCount * 8;     // Minimal system (2 floats)
  
  return {
    original: `${(originalBytes / 1024 / 1024).toFixed(2)} MB`,
    minimal: `${(minimalBytes / 1024 / 1024).toFixed(2)} MB`,
    reduction: `${(((originalBytes - minimalBytes) / originalBytes) * 100).toFixed(1)}%`,
    savedBytes: originalBytes - minimalBytes
  };
} 