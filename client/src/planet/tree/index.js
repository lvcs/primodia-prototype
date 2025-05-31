import * as THREE from 'three';
import {
  TREES_DENSITY_PER_UNIT_AREA,
  TREES_BASE_HEIGHT,
  TREES_BASE_RADIUS,
  TREES_SIZE_VARIATION,
  TREES_TRUNK_COLOR,
  TREES_CANOPY_COLOR
} from '@config';
import { useSceneStore } from '@stores';

// Performance optimizations
const LOD_DISTANCE_THRESHOLD = 5000; // Distance for LOD switching
const FRUSTUM_CULLING_ENABLED = true;
const TREE_DENSITY_MULTIPLIER = 2.0; // Multiplier for tree density (2.0 = double density)

/**
 * High-performance tree system using instanced rendering
 */
class TreeSystem {
  constructor() {
    this.trunkGeometry = null;
    this.canopyGeometry = null;
    this.trunkMaterial = null;
    this.canopyMaterial = null;
    this.trunkInstancedMesh = null;
    this.canopyInstancedMesh = null;
    this.treeInstances = [];
    this.maxInstances = 0;
    this.isInitialized = false;
  }

  /**
   * Initialize the tree system with estimated tree count
   */
  initialize(estimatedTreeCount) {
    if (this.isInitialized) {
      this.dispose();
    }

    this.maxInstances = Math.ceil(estimatedTreeCount * 1.2); // No artificial caps!
    
    // Create shared geometry (simplified for performance)
    this.trunkGeometry = new THREE.CylinderGeometry(
      TREES_BASE_RADIUS * 0.2,
      TREES_BASE_RADIUS * 0.3,
      TREES_BASE_HEIGHT * 0.4,
      6 // Reduced segments for performance
    );
    
    this.canopyGeometry = new THREE.ConeGeometry(
      TREES_BASE_RADIUS,
      TREES_BASE_HEIGHT * 0.6,
      6 // Reduced segments for performance
    );

    // Create shared materials
    this.trunkMaterial = new THREE.MeshLambertMaterial({ 
      color: TREES_TRUNK_COLOR,
      fog: true // Enable fog for depth perception
    });
    
    this.canopyMaterial = new THREE.MeshLambertMaterial({ 
      color: TREES_CANOPY_COLOR,
      fog: true
    });

    // Create instanced meshes
    this.trunkInstancedMesh = new THREE.InstancedMesh(
      this.trunkGeometry,
      this.trunkMaterial,
      this.maxInstances
    );
    
    this.canopyInstancedMesh = new THREE.InstancedMesh(
      this.canopyGeometry,
      this.canopyMaterial,
      this.maxInstances
    );

    // Enable frustum culling for better performance
    this.trunkInstancedMesh.frustumCulled = FRUSTUM_CULLING_ENABLED;
    this.canopyInstancedMesh.frustumCulled = FRUSTUM_CULLING_ENABLED;

    // Initialize instance count to 0
    this.trunkInstancedMesh.count = 0;
    this.canopyInstancedMesh.count = 0;

    this.isInitialized = true;
  }

  /**
   * Add trees for a tile using optimized distribution
   */
  addTreesForTile(tileData) {
    if (!this.isInitialized) {
      return;
    }

    const treeCount = this.calculateTreeCount(tileData.area);
    const planetRadius = Math.sqrt(
      tileData.center.x ** 2 + tileData.center.y ** 2 + tileData.center.z ** 2
    );

    for (let i = 0; i < treeCount; i++) {
      const treePos = this.generateTreePosition(tileData, planetRadius);
      this.addTreeInstance(treePos, planetRadius);
    }
  }

  /**
   * Calculate tree count based on area and density multiplier
   */
  calculateTreeCount(area) {
    let treeCount = Math.floor(area * TREES_DENSITY_PER_UNIT_AREA * TREE_DENSITY_MULTIPLIER);
    return treeCount; // No artificial limits!
  }

  /**
   * Generate tree position with simplified PLANET_RENDERING_ALGORITHMS
   */
  generateTreePosition(tileData, planetRadius) {
    if (tileData.polygonVertices && tileData.polygonVertices.length >= 3) {
      return this.generatePointInPolygon(tileData.polygonVertices, tileData.center, planetRadius);
    } else {
      return this.generatePointInCircle(tileData.center, tileData.area, planetRadius);
    }
  }

  /**
   * Generate point in polygon using bounding box and simplified testing
   */
  generatePointInPolygon(polygonVertices, tileCenter, planetRadius) {
    // Calculate bounding box for faster rejection
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    polygonVertices.forEach(vertex => {
      minX = Math.min(minX, vertex.x);
      maxX = Math.max(maxX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxY = Math.max(maxY, vertex.y);
      minZ = Math.min(minZ, vertex.z);
      maxZ = Math.max(maxZ, vertex.z);
    });

    // Use simplified distribution within bounding box
    const attempts = 10; // Reduced attempts for performance
    for (let attempt = 0; attempt < attempts; attempt++) {
      const testPos = {
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY),
        z: minZ + Math.random() * (maxZ - minZ)
      };

      // Project to planet surface
      const length = Math.sqrt(testPos.x ** 2 + testPos.y ** 2 + testPos.z ** 2);
      testPos.x = (testPos.x / length) * planetRadius;
      testPos.y = (testPos.y / length) * planetRadius;
      testPos.z = (testPos.z / length) * planetRadius;

      // Simplified point-in-polygon test using 2D projection
      if (this.pointInPolygon2D(testPos, polygonVertices, tileCenter)) {
        return testPos;
      }
    }

    // Fallback to center
    return { ...tileCenter };
  }

  /**
   * Simplified 2D point-in-polygon test for performance
   */
  pointInPolygon2D(point, polygonVertices, center) {
    // Project to 2D plane using dominant axis
    const centerVec = new THREE.Vector3(center.x, center.y, center.z).normalize();
    const absX = Math.abs(centerVec.x);
    const absY = Math.abs(centerVec.y);
    const absZ = Math.abs(centerVec.z);

    let px, py, vertices2D;
    
    if (absZ >= absX && absZ >= absY) {
      // Project to XY plane
      px = point.x;
      py = point.y;
      vertices2D = polygonVertices.map(v => ({ x: v.x, y: v.y }));
    } else if (absY >= absX) {
      // Project to XZ plane
      px = point.x;
      py = point.z;
      vertices2D = polygonVertices.map(v => ({ x: v.x, y: v.z }));
    } else {
      // Project to YZ plane
      px = point.y;
      py = point.z;
      vertices2D = polygonVertices.map(v => ({ x: v.y, y: v.z }));
    }

    // Ray casting algorithm (simplified)
    let inside = false;
    for (let i = 0, j = vertices2D.length - 1; i < vertices2D.length; j = i++) {
      const xi = vertices2D[i].x, yi = vertices2D[i].y;
      const xj = vertices2D[j].x, yj = vertices2D[j].y;
      
      if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  /**
   * Generate point in circular distribution
   */
  generatePointInCircle(tileCenter, tileArea, planetRadius) {
    const maxOffsetRadius = Math.sqrt(tileArea / Math.PI) * 0.8;
    
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * maxOffsetRadius;
    
    const centerNormal = new THREE.Vector3(
      tileCenter.x / planetRadius,
      tileCenter.y / planetRadius,
      tileCenter.z / planetRadius
    );
    
    // Simplified tangent calculation
    const tangent1 = new THREE.Vector3();
    const tangent2 = new THREE.Vector3();
    
    if (Math.abs(centerNormal.y) < 0.9) {
      tangent1.set(0, 1, 0).cross(centerNormal).normalize();
    } else {
      tangent1.set(1, 0, 0).cross(centerNormal).normalize();
    }
    
    tangent2.crossVectors(centerNormal, tangent1);
    
    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * radius;
    
    const offset = tangent1.clone().multiplyScalar(offsetX / planetRadius)
      .add(tangent2.clone().multiplyScalar(offsetY / planetRadius));
    
    const treePos = centerNormal.clone().add(offset).normalize().multiplyScalar(planetRadius);
    
    return { x: treePos.x, y: treePos.y, z: treePos.z };
  }

  /**
   * Add a single tree instance with variation
   */
  addTreeInstance(position, planetRadius) {
    const instanceIndex = this.trunkInstancedMesh.count;
    
    // Apply size variation
    const sizeVariation = 1 + (Math.random() - 0.5) * 2 * TREES_SIZE_VARIATION;
    const treeHeight = TREES_BASE_HEIGHT * sizeVariation;
    
    // Calculate orientation (point away from planet center)
    const treePosition = new THREE.Vector3(position.x, position.y, position.z);
    const surfaceNormal = treePosition.clone().normalize();
    
    // Align tree's Y-axis (up direction) with the surface normal
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(up, surfaceNormal);
    
    // Create transformation matrices
    const trunkMatrix = new THREE.Matrix4();
    const canopyMatrix = new THREE.Matrix4();
    
    // Trunk position (at base of tree)
    const trunkPos = surfaceNormal.clone().multiplyScalar(planetRadius + treeHeight * 0.2);
    trunkMatrix.compose(trunkPos, quaternion, new THREE.Vector3(sizeVariation, sizeVariation, sizeVariation));
    
    // Add random rotation around the tree's Y-axis (now pointing radially outward)
    const randomRotation = Math.random() * Math.PI * 2;
    const rotationMatrix = new THREE.Matrix4().makeRotationY(randomRotation);
    trunkMatrix.multiply(rotationMatrix);
    
    // Canopy position (above trunk) - apply same transformations
    const canopyPos = surfaceNormal.clone().multiplyScalar(planetRadius + treeHeight * 0.7);
    canopyMatrix.compose(canopyPos, quaternion, new THREE.Vector3(sizeVariation, sizeVariation, sizeVariation));
    canopyMatrix.multiply(rotationMatrix);
    
    // Set instance matrices
    this.trunkInstancedMesh.setMatrixAt(instanceIndex, trunkMatrix);
    this.canopyInstancedMesh.setMatrixAt(instanceIndex, canopyMatrix);
    
    // Increment count
    this.trunkInstancedMesh.count++;
    this.canopyInstancedMesh.count++;
    
    // Update instance matrices
    this.trunkInstancedMesh.instanceMatrix.needsUpdate = true;
    this.canopyInstancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Add tree meshes to scene
   */
  addToScene() {
    if (!this.isInitialized) {
      return;
    }
    
    const scene = useSceneStore.getState().getScene();
    scene.add(this.trunkInstancedMesh);
    scene.add(this.canopyInstancedMesh);
  }

  /**
   * Remove tree meshes from scene
   */
  removeFromScene() {
    const scene = useSceneStore.getState().getScene();
    if (this.trunkInstancedMesh) {
      scene.remove(this.trunkInstancedMesh);
    }
    if (this.canopyInstancedMesh) {
      scene.remove(this.canopyInstancedMesh);
    }
  }

  /**
   * Update LOD based on camera distance (future enhancement)
   */
  updateLOD(cameraPosition) {
    // Implementation for Level of Detail updates
    // Could switch to lower poly geometry or billboards at distance
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    if (this.trunkGeometry) {
      this.trunkGeometry.dispose();
    }
    if (this.canopyGeometry) {
      this.canopyGeometry.dispose();
    }
    if (this.trunkMaterial) {
      this.trunkMaterial.dispose();
    }
    if (this.canopyMaterial) {
      this.canopyMaterial.dispose();
    }
    if (this.trunkInstancedMesh) {
      this.trunkInstancedMesh.dispose();
    }
    if (this.canopyInstancedMesh) {
      this.canopyInstancedMesh.dispose();
    }
    
    this.isInitialized = false;
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      totalTrees: this.trunkInstancedMesh ? this.trunkInstancedMesh.count : 0,
      maxInstances: this.maxInstances,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage for monitoring
   */
  estimateMemoryUsage() {
    if (!this.isInitialized) return 0;
    
    // FIXED: Geometry memory is shared across all instances, not per-tree
    const trunkVertices = this.trunkGeometry.attributes.position.count;
    const canopyVertices = this.canopyGeometry.attributes.position.count;
    const sharedGeometryMemory = (trunkVertices + canopyVertices) * 24; // position (12) + normal (12) bytes per vertex
    
    // Instance matrices: 64 bytes per tree for trunk + 64 bytes per tree for canopy
    const instanceMemory = this.trunkInstancedMesh.count * 128;
    
    // Additional overhead for materials, textures, etc.
    const overhead = 1024; // 1KB overhead
    
    return sharedGeometryMemory + instanceMemory + overhead;
  }
}

// Create global tree system instance
const treeSystem = new TreeSystem();

/**
 * Legacy compatibility functions
 */

export const createTreeGeometry = () => {
  console.warn('[Tree] createTreeGeometry is deprecated. Use TreeSystem instead.');
  return {
    trunkGeometry: new THREE.CylinderGeometry(
      TREES_BASE_RADIUS * 0.2,
      TREES_BASE_RADIUS * 0.3,
      TREES_BASE_HEIGHT * 0.4,
      6
    ),
    canopyGeometry: new THREE.ConeGeometry(
      TREES_BASE_RADIUS,
      TREES_BASE_HEIGHT * 0.6,
      6
    )
  };
};

export const createTreeMaterials = () => {
  console.warn('[Tree] createTreeMaterials is deprecated. Use TreeSystem instead.');
  return {
    trunkMaterial: new THREE.MeshLambertMaterial({ color: TREES_TRUNK_COLOR }),
    canopyMaterial: new THREE.MeshLambertMaterial({ color: TREES_CANOPY_COLOR })
  };
};

/**
 * Check if a terrain type should have trees
 */
export const shouldHaveTrees = (terrainId) => {
  const treeTerrains = ['FOREST', 'TAIGA', 'JUNGLE', 'RAINFOREST'];
  return treeTerrains.includes(terrainId);
};

/**
 * Add trees to scene for qualifying tiles
 */
export const addTreesToScene = (tiles) => {
  const treeTiles = tiles.filter(tile => shouldHaveTrees(tile.terrainId));
  
  if (treeTiles.length === 0) {
    return { treeSystem: null, stats: null };
  }

  // Estimate total tree count for initialization
  const estimatedTreeCount = treeTiles.reduce((total, tile) => {
    const treeCount = Math.floor(tile.area * TREES_DENSITY_PER_UNIT_AREA * TREE_DENSITY_MULTIPLIER);
    return total + treeCount;
  }, 0);


  // Initialize tree system
  treeSystem.initialize(estimatedTreeCount);

  // Add trees for each tile
  treeTiles.forEach(tile => {
    treeSystem.addTreesForTile(tile);
  });

  // Add to scene
  treeSystem.addToScene();

  const stats = treeSystem.getStats();
  console.log(`[TreeSystem] Generated ${stats.totalTrees} trees (estimated memory: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB)`);

  return { treeSystem, stats };
};

/**
 * Clear trees from scene
 */
export const clearTrees = () => {
  treeSystem.removeFromScene();
  treeSystem.dispose();
};

// Export the tree system for direct access
export { treeSystem as TreeSystem };

export const disposeTreeResources = (geometry, materials) => {
  console.warn('[Tree] disposeTreeResources is deprecated with new system');
  if (geometry) {
    geometry.trunkGeometry?.dispose();
    geometry.canopyGeometry?.dispose();
  }
  if (materials) {
    materials.trunkMaterial?.dispose();
    materials.canopyMaterial?.dispose();
  }
};

export default {
  TreeSystem: treeSystem,
  addTreesToScene,
  clearTrees,
  shouldHaveTrees,
  // Legacy compatibility
  createTreeGeometry,
  createTreeMaterials,
  disposeTreeResources
}; 