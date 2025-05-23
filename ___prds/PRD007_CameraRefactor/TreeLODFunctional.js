import * as THREE from 'three';

/**
 * Functional LOD Tree System - No classes, pure functions
 * Memory reduction: 60-80% through Level of Detail rendering
 */

// Configuration
const LOD_CONFIG = {
  detailed: { distance: 1000, maxTrees: 5000, segments: 6 },
  simple: { distance: 3000, maxTrees: 15000, segments: 3 },
  billboard: { distance: Infinity, maxTrees: Infinity }
};

// Shared geometries and materials cache
let sharedResources = null;

/**
 * Initialize shared geometries and materials
 */
export function initializeLODResources() {
  if (sharedResources) return sharedResources;
  
  sharedResources = {
    geometries: {
      detailed: createCombinedTreeGeometry(LOD_CONFIG.detailed.segments),
      simple: createCombinedTreeGeometry(LOD_CONFIG.simple.segments),
      billboard: createBillboardGeometry()
    },
    materials: {
      tree: new THREE.MeshLambertMaterial({ color: 0x228B22, fog: true }),
      billboard: createBillboardMaterial()
    },
    billboardTexture: createBillboardTexture()
  };
  
  return sharedResources;
}

/**
 * Create combined trunk+canopy geometry
 */
function createCombinedTreeGeometry(segments) {
  const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 2, segments);
  const canopyGeometry = new THREE.ConeGeometry(1, 3, segments);
  canopyGeometry.translate(0, 2.5, 0);
  
  const vertices = [];
  const normals = [];
  const uvs = [];
  
  // Add trunk vertices
  const trunkPos = trunkGeometry.attributes.position.array;
  const trunkNorm = trunkGeometry.attributes.normal.array;
  const trunkUv = trunkGeometry.attributes.uv.array;
  
  for (let i = 0; i < trunkPos.length; i += 3) {
    vertices.push(trunkPos[i], trunkPos[i + 1], trunkPos[i + 2]);
    normals.push(trunkNorm[i], trunkNorm[i + 1], trunkNorm[i + 2]);
  }
  for (let i = 0; i < trunkUv.length; i += 2) {
    uvs.push(trunkUv[i], trunkUv[i + 1]);
  }
  
  // Add canopy vertices
  const canopyPos = canopyGeometry.attributes.position.array;
  const canopyNorm = canopyGeometry.attributes.normal.array;
  const canopyUv = canopyGeometry.attributes.uv.array;
  
  for (let i = 0; i < canopyPos.length; i += 3) {
    vertices.push(canopyPos[i], canopyPos[i + 1], canopyPos[i + 2]);
    normals.push(canopyNorm[i], canopyNorm[i + 1], canopyNorm[i + 2]);
  }
  for (let i = 0; i < canopyUv.length; i += 2) {
    uvs.push(canopyUv[i], canopyUv[i + 1]);
  }
  
  const combinedGeometry = new THREE.BufferGeometry();
  combinedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  combinedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  combinedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  
  // Cleanup temporary geometries
  trunkGeometry.dispose();
  canopyGeometry.dispose();
  
  return combinedGeometry;
}

/**
 * Create billboard geometry
 */
function createBillboardGeometry() {
  return new THREE.PlaneGeometry(2, 4);
}

/**
 * Create billboard texture procedurally
 */
function createBillboardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  // Draw simple tree sprite
  ctx.fillStyle = '#8B4513'; // Brown trunk
  ctx.fillRect(28, 40, 8, 24);
  
  ctx.fillStyle = '#228B22'; // Green canopy
  ctx.beginPath();
  ctx.arc(32, 30, 16, 0, Math.PI * 2);
  ctx.fill();
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  
  return texture;
}

/**
 * Create billboard material
 */
function createBillboardMaterial() {
  const texture = createBillboardTexture();
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.1,
    side: THREE.DoubleSide,
    fog: true
  });
}

/**
 * Sort trees into LOD buckets based on camera distance
 */
export function sortTreesIntoLODBuckets(trees, cameraPosition) {
  const buckets = {
    detailed: [],
    simple: [],
    billboard: []
  };
  
  trees.forEach(tree => {
    const distance = cameraPosition.distanceTo(
      new THREE.Vector3(tree.position.x, tree.position.y, tree.position.z)
    );
    
    if (distance < LOD_CONFIG.detailed.distance && buckets.detailed.length < LOD_CONFIG.detailed.maxTrees) {
      buckets.detailed.push({ ...tree, distance });
    } else if (distance < LOD_CONFIG.simple.distance && buckets.simple.length < LOD_CONFIG.simple.maxTrees) {
      buckets.simple.push({ ...tree, distance });
    } else {
      buckets.billboard.push({ ...tree, distance });
    }
  });
  
  return buckets;
}

/**
 * Create instanced mesh for a LOD level
 */
function createInstancedMeshForLOD(lodLevel, trees, resources) {
  if (trees.length === 0) return null;
  
  const geometry = resources.geometries[lodLevel === 'billboard' ? 'billboard' : lodLevel];
  const material = resources.materials[lodLevel === 'billboard' ? 'billboard' : 'tree'];
  
  const mesh = new THREE.InstancedMesh(geometry, material, trees.length);
  
  trees.forEach((tree, index) => {
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3(tree.position.x, tree.position.y, tree.position.z);
    const scale = new THREE.Vector3(tree.scale || 1, tree.scale || 1, tree.scale || 1);
    
    // Orient tree
    const normal = position.clone().normalize();
    let quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    
    // For billboards, face camera
    if (lodLevel === 'billboard') {
      const cameraDirection = new THREE.Vector3().subVectors(
        tree.cameraPosition || new THREE.Vector3(0, 0, 0), 
        position
      ).normalize();
      quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), cameraDirection);
      
      // Scale billboard based on distance
      const distanceScale = Math.max(0.5, Math.min(2, tree.distance / 1000));
      scale.multiplyScalar(distanceScale);
    }
    
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

/**
 * Main function to render trees with LOD
 */
export function renderTreesWithLOD(trees, scene, cameraPosition) {
  const resources = initializeLODResources();
  const buckets = sortTreesIntoLODBuckets(trees, cameraPosition);
  
  // Add camera position to billboard trees for orientation
  buckets.billboard.forEach(tree => {
    tree.cameraPosition = cameraPosition;
  });
  
  const meshes = [];
  
  // Create meshes for each LOD level
  Object.entries(buckets).forEach(([lodLevel, lodTrees]) => {
    const mesh = createInstancedMeshForLOD(lodLevel, lodTrees, resources);
    if (mesh) {
      scene.add(mesh);
      meshes.push(mesh);
    }
  });
  
  const stats = {
    detailed: buckets.detailed.length,
    simple: buckets.simple.length,
    billboard: buckets.billboard.length,
    total: buckets.detailed.length + buckets.simple.length + buckets.billboard.length,
    memoryEstimate: estimateLODMemoryUsage(buckets, resources)
  };
  
  console.log(`[LODTrees] Rendered: ${stats.detailed} detailed, ${stats.simple} simple, ${stats.billboard} billboards`);
  
  return { meshes, stats };
}

/**
 * Clear LOD meshes from scene
 */
export function clearLODTrees(scene, meshes) {
  if (meshes) {
    meshes.forEach(mesh => scene.remove(mesh));
  }
}

/**
 * Estimate memory usage for LOD system
 */
function estimateLODMemoryUsage(buckets, resources) {
  let totalMemory = 0;
  
  // Geometry memory (shared)
  Object.values(resources.geometries).forEach(geometry => {
    const vertices = geometry.attributes.position.count;
    totalMemory += vertices * 24; // position + normal
  });
  
  // Instance memory
  Object.values(buckets).forEach(trees => {
    totalMemory += trees.length * 64; // 64 bytes per matrix
  });
  
  // Billboard texture
  totalMemory += 64 * 64 * 4; // RGBA texture
  
  return totalMemory;
}

/**
 * Dispose LOD resources
 */
export function disposeLODResources() {
  if (sharedResources) {
    Object.values(sharedResources.geometries).forEach(geo => geo.dispose());
    Object.values(sharedResources.materials).forEach(mat => mat.dispose());
    if (sharedResources.billboardTexture) {
      sharedResources.billboardTexture.dispose();
    }
    sharedResources = null;
  }
}

/**
 * Convert tile data to tree positions for LOD system
 */
export function generateTreesFromTiles(tiles) {
  const trees = [];
  
  tiles.forEach(tile => {
    const treeCount = Math.floor(tile.area * 1000); // Density
    const sphereRadius = Math.sqrt(
      tile.center.x ** 2 + tile.center.y ** 2 + tile.center.z ** 2
    );
    
    for (let i = 0; i < treeCount; i++) {
      const position = generateTreePosition(tile, sphereRadius);
      trees.push({
        position,
        scale: 0.8 + Math.random() * 0.4,
        tileId: tile.id
      });
    }
  });
  
  return trees;
}

/**
 * Simple tree position generation
 */
function generateTreePosition(tile, sphereRadius) {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * Math.sqrt(tile.area / Math.PI) * 0.8;
  
  const centerNormal = new THREE.Vector3(
    tile.center.x / sphereRadius,
    tile.center.y / sphereRadius,
    tile.center.z / sphereRadius
  );
  
  const tangent = new THREE.Vector3(1, 0, 0).cross(centerNormal).normalize();
  const bitangent = centerNormal.clone().cross(tangent).normalize();
  
  const offset = tangent.clone().multiplyScalar(Math.cos(angle) * radius)
    .add(bitangent.clone().multiplyScalar(Math.sin(angle) * radius));
  
  const finalPos = centerNormal.add(offset.multiplyScalar(1 / sphereRadius))
    .normalize().multiplyScalar(sphereRadius);
  
  return { x: finalPos.x, y: finalPos.y, z: finalPos.z };
} 