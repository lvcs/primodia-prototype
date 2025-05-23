import * as THREE from 'three';

/**
 * Spatial Culling Tree System - Only loads trees near camera
 * Dramatically reduces memory by streaming trees in/out of memory
 */
export class SpatialCullingTreeSystem {
  constructor() {
    this.tileTreeData = new Map(); // Stores tree seed data per tile
    this.activeTrees = new Map(); // Currently loaded tree instances
    this.activeChunks = new Set(); // Currently active chunks
    this.chunkSize = 2000; // Chunk size in world units
    this.renderDistance = 5000; // Maximum render distance
    this.streamingDistance = 8000; // Distance to start streaming
    
    this.instancedMeshes = new Map();
    this.geometries = this.createSharedGeometries();
    this.materials = this.createSharedMaterials();
    
    this.cameraPosition = new THREE.Vector3();
    this.lastUpdatePosition = new THREE.Vector3();
    this.updateThreshold = 500; // Update when camera moves this far
  }

  createSharedGeometries() {
    return {
      lod0: this.createSimpleTreeGeometry(8), // High detail
      lod1: this.createSimpleTreeGeometry(4), // Medium detail
      lod2: this.createSimpleTreeGeometry(3), // Low detail
      billboard: this.createBillboardGeometry()
    };
  }

  createSimpleTreeGeometry(segments) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];
    
    // Simple trunk
    const trunkHeight = 1;
    const trunkRadius = 0.1;
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;
      
      // Bottom triangle
      vertices.push(0, 0, 0);
      vertices.push(Math.cos(angle1) * trunkRadius, 0, Math.sin(angle1) * trunkRadius);
      vertices.push(Math.cos(angle2) * trunkRadius, 0, Math.sin(angle2) * trunkRadius);
      
      // Top triangle
      vertices.push(0, trunkHeight, 0);
      vertices.push(Math.cos(angle2) * trunkRadius, trunkHeight, Math.sin(angle2) * trunkRadius);
      vertices.push(Math.cos(angle1) * trunkRadius, trunkHeight, Math.sin(angle1) * trunkRadius);
      
      // Add normals
      for (let j = 0; j < 6; j++) {
        normals.push(0, 1, 0);
      }
    }
    
    // Simple canopy
    const canopyHeight = 2;
    const canopyRadius = 0.8;
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;
      
      vertices.push(0, trunkHeight + canopyHeight, 0);
      vertices.push(Math.cos(angle1) * canopyRadius, trunkHeight, Math.sin(angle1) * canopyRadius);
      vertices.push(Math.cos(angle2) * canopyRadius, trunkHeight, Math.sin(angle2) * canopyRadius);
      
      normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    
    return geometry;
  }

  createBillboardGeometry() {
    const geometry = new THREE.PlaneGeometry(2, 3);
    return geometry;
  }

  createSharedMaterials() {
    return {
      tree: new THREE.MeshLambertMaterial({ color: 0x228B22, fog: true }),
      billboard: new THREE.MeshBasicMaterial({ 
        color: 0x228B22, 
        transparent: true, 
        alphaTest: 0.5,
        fog: true 
      })
    };
  }

  /**
   * Store tree generation data for a tile (not the actual trees)
   */
  storeTileTreeData(tileData) {
    const tileId = tileData.id;
    
    // Store only the seed data needed to regenerate trees
    this.tileTreeData.set(tileId, {
      center: tileData.center,
      area: tileData.area,
      terrainId: tileData.terrainId,
      polygonVertices: tileData.polygonVertices,
      seed: this.hashTileId(tileId) // Deterministic seed from tile ID
    });
  }

  hashTileId(tileId) {
    // Simple hash function for deterministic tree generation
    let hash = 0;
    const str = tileId.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get chunk coordinates for a world position
   */
  getChunkCoordinates(position) {
    return {
      x: Math.floor(position.x / this.chunkSize),
      y: Math.floor(position.y / this.chunkSize),
      z: Math.floor(position.z / this.chunkSize)
    };
  }

  getChunkKey(chunkCoords) {
    return `${chunkCoords.x},${chunkCoords.y},${chunkCoords.z}`;
  }

  /**
   * Update active chunks based on camera position
   */
  updateActiveChunks(cameraPosition) {
    const cameraMoved = this.lastUpdatePosition.distanceTo(cameraPosition) > this.updateThreshold;
    if (!cameraMoved) return;
    
    this.cameraPosition.copy(cameraPosition);
    this.lastUpdatePosition.copy(cameraPosition);
    
    const cameraChunk = this.getChunkCoordinates(cameraPosition);
    const renderChunks = Math.ceil(this.renderDistance / this.chunkSize);
    const newActiveChunks = new Set();
    
    // Find chunks within render distance
    for (let x = cameraChunk.x - renderChunks; x <= cameraChunk.x + renderChunks; x++) {
      for (let y = cameraChunk.y - renderChunks; y <= cameraChunk.y + renderChunks; y++) {
        for (let z = cameraChunk.z - renderChunks; z <= cameraChunk.z + renderChunks; z++) {
          const chunkKey = this.getChunkKey({ x, y, z });
          newActiveChunks.add(chunkKey);
        }
      }
    }
    
    // Unload chunks that are no longer active
    this.activeChunks.forEach(chunkKey => {
      if (!newActiveChunks.has(chunkKey)) {
        this.unloadChunk(chunkKey);
      }
    });
    
    // Load new chunks
    newActiveChunks.forEach(chunkKey => {
      if (!this.activeChunks.has(chunkKey)) {
        this.loadChunk(chunkKey);
      }
    });
    
    this.activeChunks = newActiveChunks;
    console.log(`[SpatialCulling] Active chunks: ${this.activeChunks.size}, Active trees: ${this.activeTrees.size}`);
  }

  /**
   * Load trees for a specific chunk
   */
  loadChunk(chunkKey) {
    // Find tiles that intersect with this chunk
    const [x, y, z] = chunkKey.split(',').map(Number);
    const chunkMin = {
      x: x * this.chunkSize,
      y: y * this.chunkSize,
      z: z * this.chunkSize
    };
    const chunkMax = {
      x: (x + 1) * this.chunkSize,
      y: (y + 1) * this.chunkSize,
      z: (z + 1) * this.chunkSize
    };
    
    this.tileTreeData.forEach((tileData, tileId) => {
      if (this.tileIntersectsChunk(tileData, chunkMin, chunkMax)) {
        this.generateTreesForTile(tileId, tileData);
      }
    });
  }

  /**
   * Unload trees for a specific chunk
   */
  unloadChunk(chunkKey) {
    const treesToRemove = [];
    
    this.activeTrees.forEach((tree, treeId) => {
      const treeChunk = this.getChunkCoordinates(tree.position);
      const treeChunkKey = this.getChunkKey(treeChunk);
      
      if (treeChunkKey === chunkKey) {
        treesToRemove.push(treeId);
      }
    });
    
    treesToRemove.forEach(treeId => {
      this.activeTrees.delete(treeId);
    });
  }

  tileIntersectsChunk(tileData, chunkMin, chunkMax) {
    // Simple sphere-box intersection test
    const tileCenter = tileData.center;
    const tileRadius = Math.sqrt(tileData.area / Math.PI);
    
    const closestPoint = {
      x: Math.max(chunkMin.x, Math.min(tileCenter.x, chunkMax.x)),
      y: Math.max(chunkMin.y, Math.min(tileCenter.y, chunkMax.y)),
      z: Math.max(chunkMin.z, Math.min(tileCenter.z, chunkMax.z))
    };
    
    const distance = Math.sqrt(
      (closestPoint.x - tileCenter.x) ** 2 +
      (closestPoint.y - tileCenter.y) ** 2 +
      (closestPoint.z - tileCenter.z) ** 2
    );
    
    return distance <= tileRadius;
  }

  /**
   * Generate trees for a tile using deterministic random generation
   */
  generateTreesForTile(tileId, tileData) {
    // Use seeded random for deterministic generation
    const rng = this.seededRandom(tileData.seed);
    const treeCount = Math.floor(tileData.area * 1000 * rng());
    
    const sphereRadius = Math.sqrt(
      tileData.center.x ** 2 + tileData.center.y ** 2 + tileData.center.z ** 2
    );
    
    for (let i = 0; i < treeCount; i++) {
      const treeId = `${tileId}_${i}`;
      if (!this.activeTrees.has(treeId)) {
        const position = this.generateTreePosition(tileData, sphereRadius, rng);
        const tree = {
          position,
          tileId,
          scale: 0.8 + rng() * 0.4,
          type: Math.floor(rng() * 3)
        };
        
        this.activeTrees.set(treeId, tree);
      }
    }
  }

  generateTreePosition(tileData, sphereRadius, rng) {
    // Simple circular distribution
    const angle = rng() * Math.PI * 2;
    const radius = rng() * Math.sqrt(tileData.area / Math.PI) * 0.8;
    
    const centerNormal = new THREE.Vector3(
      tileData.center.x / sphereRadius,
      tileData.center.y / sphereRadius,
      tileData.center.z / sphereRadius
    );
    
    const tangent = new THREE.Vector3(1, 0, 0).cross(centerNormal).normalize();
    const bitangent = centerNormal.clone().cross(tangent).normalize();
    
    const offset = tangent.clone().multiplyScalar(Math.cos(angle) * radius)
      .add(bitangent.clone().multiplyScalar(Math.sin(angle) * radius));
    
    const finalPos = centerNormal.add(offset.multiplyScalar(1 / sphereRadius)).normalize().multiplyScalar(sphereRadius);
    
    return { x: finalPos.x, y: finalPos.y, z: finalPos.z };
  }

  seededRandom(seed) {
    // Simple seeded random number generator
    let s = seed;
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  /**
   * Render active trees with LOD
   */
  renderActiveTrees(scene) {
    // Clear existing meshes
    this.instancedMeshes.forEach(mesh => scene.remove(mesh));
    this.instancedMeshes.clear();
    
    if (this.activeTrees.size === 0) return;
    
    // Sort trees by distance and LOD
    const lodBuckets = {
      lod0: [],
      lod1: [],
      lod2: [],
      billboard: []
    };
    
    this.activeTrees.forEach(tree => {
      const distance = this.cameraPosition.distanceTo(new THREE.Vector3(tree.position.x, tree.position.y, tree.position.z));
      
      if (distance < 1000) {
        lodBuckets.lod0.push(tree);
      } else if (distance < 2500) {
        lodBuckets.lod1.push(tree);
      } else if (distance < 4000) {
        lodBuckets.lod2.push(tree);
      } else {
        lodBuckets.billboard.push(tree);
      }
    });
    
    // Create instanced meshes for each LOD
    Object.entries(lodBuckets).forEach(([lod, trees]) => {
      if (trees.length === 0) return;
      
      const geometry = this.geometries[lod];
      const material = lod === 'billboard' ? this.materials.billboard : this.materials.tree;
      const mesh = new THREE.InstancedMesh(geometry, material, trees.length);
      
      trees.forEach((tree, index) => {
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3(tree.position.x, tree.position.y, tree.position.z);
        const scale = new THREE.Vector3(tree.scale, tree.scale, tree.scale);
        
        // Orient tree
        const normal = position.clone().normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        
        if (lod === 'billboard') {
          // Face camera for billboards
          const lookDirection = new THREE.Vector3().subVectors(this.cameraPosition, position).normalize();
          quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), lookDirection);
        }
        
        matrix.compose(position, quaternion, scale);
        mesh.setMatrixAt(index, matrix);
      });
      
      mesh.instanceMatrix.needsUpdate = true;
      scene.add(mesh);
      this.instancedMeshes.set(lod, mesh);
    });
    
    console.log(`[SpatialCulling] Rendered - LOD0: ${lodBuckets.lod0.length}, LOD1: ${lodBuckets.lod1.length}, LOD2: ${lodBuckets.lod2.length}, Billboards: ${lodBuckets.billboard.length}`);
  }

  getMemoryUsage() {
    // Only active trees consume memory
    const bytesPerTree = 32; // position + scale + type + metadata
    return this.activeTrees.size * bytesPerTree;
  }

  dispose() {
    Object.values(this.geometries).forEach(geo => geo.dispose());
    Object.values(this.materials).forEach(mat => mat.dispose());
    this.instancedMeshes.forEach(mesh => mesh.dispose());
  }
}

/**
 * Memory savings with spatial culling:
 * 
 * Only trees within ~5km of camera are in memory
 * Typical usage: ~5,000-15,000 active trees vs 55,770 total
 * Memory reduction: ~70-90% depending on camera position and world size
 */ 