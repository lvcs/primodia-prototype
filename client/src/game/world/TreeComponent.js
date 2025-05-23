import * as THREE from 'three';
import {
  TREES_DENSITY_PER_UNIT_AREA,
  TREES_BASE_HEIGHT,
  TREES_BASE_RADIUS,
  TREES_SIZE_VARIATION,
  TREES_TRUNK_COLOR,
  TREES_CANOPY_COLOR
} from '@config/gameConfig';

/**
 * TreeComponent - Handles creation and rendering of simple trees using instancing
 */
export class TreeComponent {
  constructor() {
    this.treeGroup = new THREE.Group();
    this.trees = [];
    
    // Create basic tree geometry
    this.trunkGeometry = new THREE.CylinderGeometry(
      TREES_BASE_RADIUS * 0.2, // top radius (narrower)
      TREES_BASE_RADIUS * 0.3, // bottom radius 
      TREES_BASE_HEIGHT * 0.4, // height - trunk is 40% of total tree height
      8 // radial segments
    );
    
    this.canopyGeometry = new THREE.ConeGeometry(
      TREES_BASE_RADIUS, // radius
      TREES_BASE_HEIGHT * 0.6, // height - canopy is 60% of total tree height
      8 // radial segments
    );
    
    // Create basic materials
    this.trunkMaterial = new THREE.MeshLambertMaterial({ color: TREES_TRUNK_COLOR });
    this.canopyMaterial = new THREE.MeshLambertMaterial({ color: TREES_CANOPY_COLOR });
  }

  /**
   * Create a single tree with randomized properties
   * @param {number} x - X position
   * @param {number} y - Y position  
   * @param {number} z - Z position
   * @returns {THREE.Group} - Tree group containing trunk and canopy
   */
  createSingleTree(x, y, z) {
    const treeGroup = new THREE.Group();
    
    // Apply size variation (±30%)
    const sizeVariation = 1 + (Math.random() - 0.5) * 2 * TREES_SIZE_VARIATION;
    const treeHeight = TREES_BASE_HEIGHT * sizeVariation;
    const treeRadius = TREES_BASE_RADIUS * sizeVariation;
    
    // Create trunk
    const trunk = new THREE.Mesh(this.trunkGeometry, this.trunkMaterial);
    trunk.scale.set(sizeVariation, sizeVariation, sizeVariation);
    trunk.position.y = treeHeight * 0.2; // Position trunk at base
    
    // Create canopy
    const canopy = new THREE.Mesh(this.canopyGeometry, this.canopyMaterial);
    canopy.scale.set(sizeVariation, sizeVariation, sizeVariation);
    canopy.position.y = treeHeight * 0.7; // Position canopy above trunk
    
    // Position the tree on the sphere surface
    treeGroup.position.set(x, y, z);
    
    // Orient the tree to point away from sphere center (grow "up" from surface)
    const treePosition = new THREE.Vector3(x, y, z);
    const surfaceNormal = treePosition.clone().normalize(); // Direction away from sphere center
    
    // Align tree's Y-axis (up direction) with the surface normal
    const up = new THREE.Vector3(0, 1, 0); // Tree's local up direction
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(up, surfaceNormal);
    treeGroup.setRotationFromQuaternion(quaternion);
    
    // Add only a small random rotation around the tree's Y-axis (now pointing radially outward)
    // This gives variety without tilting the trees
    const randomRotation = Math.random() * Math.PI * 2;
    treeGroup.rotateY(randomRotation);
    
    // Add trunk and canopy to tree group
    treeGroup.add(trunk);
    treeGroup.add(canopy);
    
    return treeGroup;
  }

  /**
   * Generate random trees for a tile
   * @param {Object} tileData - Tile information containing center position, size, area, and optionally polygon vertices
   * @param {Object} tileData.center - World coordinates of tile center
   * @param {number} tileData.area - Tile area in square units
   * @param {Array} [tileData.polygonVertices] - Optional array of THREE.Vector3 vertices defining the tile polygon
   * @returns {THREE.Group} - Group containing all trees for this tile
   */
  generateTreesForTile(tileData) {
    const tileTreeGroup = new THREE.Group();
    
    // Calculate tree count based on tile area and density
    let treeCount = Math.floor(tileData.area * TREES_DENSITY_PER_UNIT_AREA);
    
    // Ensure at least a few trees for small tiles to avoid empty forest areas
    treeCount = Math.max(1, treeCount);
    
    console.log(`[TreeComponent] Generating ${treeCount} trees for tile ${tileData.id} (area: ${tileData.area.toFixed(2)}) at terrain ${tileData.terrainId}`);
    
    // Calculate sphere radius from tile center position
    const sphereRadius = Math.sqrt(
      tileData.center.x * tileData.center.x + 
      tileData.center.y * tileData.center.y + 
      tileData.center.z * tileData.center.z
    );
    
    // Generate trees at random positions within tile bounds
    for (let i = 0; i < treeCount; i++) {
      let treePos;
      
      if (tileData.polygonVertices && tileData.polygonVertices.length >= 3) {
        // Use actual polygon shape for tree distribution
        treePos = this.generatePointInPolygon(tileData.polygonVertices, tileData.center, sphereRadius);
      } else {
        // Fallback to circular approximation
        treePos = this.generatePointInCircle(tileData.center, tileData.area, sphereRadius);
      }
      
      const tree = this.createSingleTree(treePos.x, treePos.y, treePos.z);
      tileTreeGroup.add(tree);
    }
    
    return tileTreeGroup;
  }

  /**
   * Generate a random point within a polygon on the sphere surface
   * @param {Array} polygonVertices - Array of THREE.Vector3 vertices defining the polygon
   * @param {Object} tileCenter - Center point of the tile
   * @param {number} sphereRadius - Radius of the sphere
   * @returns {Object} - {x, y, z} coordinates on sphere surface
   */
  generatePointInPolygon(polygonVertices, tileCenter, sphereRadius) {
    // Use rejection sampling: generate random points in polygon's bounding area and test if inside
    const maxAttempts = 50; // Prevent infinite loops
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Calculate bounding circle radius (distance from center to farthest vertex)
      let maxDistance = 0;
      polygonVertices.forEach(vertex => {
        const distance = Math.sqrt(
          (vertex.x - tileCenter.x) ** 2 + 
          (vertex.y - tileCenter.y) ** 2 + 
          (vertex.z - tileCenter.z) ** 2
        );
        maxDistance = Math.max(maxDistance, distance);
      });
      
      // Generate random point within bounding circle
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * maxDistance * 0.9; // Use 90% of max distance for better containment
      
      // Convert to 3D coordinates
      const centerNormal = {
        x: tileCenter.x / sphereRadius,
        y: tileCenter.y / sphereRadius,
        z: tileCenter.z / sphereRadius
      };
      
      // Create tangent vectors (same logic as before)
      let tangent1 = { x: 1, y: 0, z: 0 };
      let tangent2 = { x: 0, y: 1, z: 0 };
      
      const dot1 = tangent1.x * centerNormal.x + tangent1.y * centerNormal.y + tangent1.z * centerNormal.z;
      tangent1.x -= dot1 * centerNormal.x;
      tangent1.y -= dot1 * centerNormal.y;
      tangent1.z -= dot1 * centerNormal.z;
      
      const len1 = Math.sqrt(tangent1.x * tangent1.x + tangent1.y * tangent1.y + tangent1.z * tangent1.z);
      if (len1 > 0.001) {
        tangent1.x /= len1;
        tangent1.y /= len1;
        tangent1.z /= len1;
      }
      
      tangent2.x = centerNormal.y * tangent1.z - centerNormal.z * tangent1.y;
      tangent2.y = centerNormal.z * tangent1.x - centerNormal.x * tangent1.z;
      tangent2.z = centerNormal.x * tangent1.y - centerNormal.y * tangent1.x;
      
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;
      
      let testPos = {
        x: centerNormal.x + (tangent1.x * offsetX + tangent2.x * offsetY) / sphereRadius,
        y: centerNormal.y + (tangent1.y * offsetX + tangent2.y * offsetY) / sphereRadius,
        z: centerNormal.z + (tangent1.z * offsetX + tangent2.z * offsetY) / sphereRadius
      };
      
      // Normalize and scale to sphere surface
      const length = Math.sqrt(testPos.x * testPos.x + testPos.y * testPos.y + testPos.z * testPos.z);
      testPos.x = (testPos.x / length) * sphereRadius;
      testPos.y = (testPos.y / length) * sphereRadius;
      testPos.z = (testPos.z / length) * sphereRadius;
      
      // Test if point is inside polygon using spherical point-in-polygon test
      if (this.isPointInSphericalPolygon(testPos, polygonVertices, tileCenter)) {
        return testPos;
      }
    }
    
    // Fallback: return center position if all attempts failed
    console.warn(`[TreeComponent] Failed to find point inside polygon after ${maxAttempts} attempts, using center`);
    return { ...tileCenter };
  }

  /**
   * Test if a point on the sphere is inside a spherical polygon
   * Uses the spherical winding number algorithm
   * @param {Object} point - Point to test {x, y, z}
   * @param {Array} polygonVertices - Array of polygon vertices {x, y, z}
   * @param {Object} center - Polygon center for reference {x, y, z}
   * @returns {boolean} - True if point is inside polygon
   */
  isPointInSphericalPolygon(point, polygonVertices, center) {
    // Normalize all points to unit sphere for consistent calculations
    const pointNorm = this.normalizeVector(point);
    const centerNorm = this.normalizeVector(center);
    const verticesNorm = polygonVertices.map(v => this.normalizeVector(v));
    
    // Use spherical winding number method
    // Calculate signed solid angle subtended by the polygon at the test point
    let totalAngle = 0;
    
    for (let i = 0; i < verticesNorm.length; i++) {
      const v1 = verticesNorm[i];
      const v2 = verticesNorm[(i + 1) % verticesNorm.length];
      
      // Calculate the spherical angle between edges from point to vertices
      const edge1 = {
        x: v1.x - pointNorm.x,
        y: v1.y - pointNorm.y,
        z: v1.z - pointNorm.z
      };
      
      const edge2 = {
        x: v2.x - pointNorm.x,
        y: v2.y - pointNorm.y,
        z: v2.z - pointNorm.z
      };
      
      // Normalize edges
      const edge1Norm = this.normalizeVector(edge1);
      const edge2Norm = this.normalizeVector(edge2);
      
      // Calculate angle between edges using dot product
      const dotProduct = edge1Norm.x * edge2Norm.x + edge1Norm.y * edge2Norm.y + edge1Norm.z * edge2Norm.z;
      const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct))); // Clamp to avoid numerical errors
      
      // Determine sign using cross product with respect to point normal
      const cross = {
        x: edge1Norm.y * edge2Norm.z - edge1Norm.z * edge2Norm.y,
        y: edge1Norm.z * edge2Norm.x - edge1Norm.x * edge2Norm.z,
        z: edge1Norm.x * edge2Norm.y - edge1Norm.y * edge2Norm.x
      };
      
      const sign = (cross.x * pointNorm.x + cross.y * pointNorm.y + cross.z * pointNorm.z) >= 0 ? 1 : -1;
      totalAngle += sign * angle;
    }
    
    // Point is inside if winding number is approximately ±2π
    const windingNumber = Math.abs(totalAngle);
    return windingNumber > Math.PI; // More than 180 degrees indicates inside
  }

  /**
   * Normalize a vector to unit length
   * @param {Object} vector - Vector {x, y, z}
   * @returns {Object} - Normalized vector {x, y, z}
   */
  normalizeVector(vector) {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    if (length < 0.0001) {
      return { x: 0, y: 0, z: 1 }; // Default direction if zero vector
    }
    return {
      x: vector.x / length,
      y: vector.y / length,
      z: vector.z / length
    };
  }

  /**
   * Generate a random point within a circular approximation (fallback method)
   * @param {Object} tileCenter - Center point of the tile  
   * @param {number} tileArea - Area of the tile
   * @param {number} sphereRadius - Radius of the sphere
   * @returns {Object} - {x, y, z} coordinates on sphere surface
   */
  generatePointInCircle(tileCenter, tileArea, sphereRadius) {
    // Original circular distribution logic
    const maxOffsetRadius = Math.sqrt(tileArea / Math.PI) * 0.8;
    
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * maxOffsetRadius;
    
    const centerNormal = {
      x: tileCenter.x / sphereRadius,
      y: tileCenter.y / sphereRadius,
      z: tileCenter.z / sphereRadius
    };
    
    let tangent1 = { x: 1, y: 0, z: 0 };
    let tangent2 = { x: 0, y: 1, z: 0 };
    
    const dot1 = tangent1.x * centerNormal.x + tangent1.y * centerNormal.y + tangent1.z * centerNormal.z;
    tangent1.x -= dot1 * centerNormal.x;
    tangent1.y -= dot1 * centerNormal.y;
    tangent1.z -= dot1 * centerNormal.z;
    
    const len1 = Math.sqrt(tangent1.x * tangent1.x + tangent1.y * tangent1.y + tangent1.z * tangent1.z);
    if (len1 > 0.001) {
      tangent1.x /= len1;
      tangent1.y /= len1;
      tangent1.z /= len1;
    }
    
    tangent2.x = centerNormal.y * tangent1.z - centerNormal.z * tangent1.y;
    tangent2.y = centerNormal.z * tangent1.x - centerNormal.x * tangent1.z;
    tangent2.z = centerNormal.x * tangent1.y - centerNormal.y * tangent1.x;
    
    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * radius;
    
    let treePos = {
      x: centerNormal.x + (tangent1.x * offsetX + tangent2.x * offsetY) / sphereRadius,
      y: centerNormal.y + (tangent1.y * offsetX + tangent2.y * offsetY) / sphereRadius,
      z: centerNormal.z + (tangent1.z * offsetX + tangent2.z * offsetY) / sphereRadius
    };
    
    const length = Math.sqrt(treePos.x * treePos.x + treePos.y * treePos.y + treePos.z * treePos.z);
    treePos.x = (treePos.x / length) * sphereRadius;
    treePos.y = (treePos.y / length) * sphereRadius;
    treePos.z = (treePos.z / length) * sphereRadius;
    
    return treePos;
  }

  /**
   * Check if a terrain type should have trees
   * @param {string} terrainId - The terrain type ID
   * @returns {boolean} - Whether this terrain should have trees
   */
  shouldHaveTrees(terrainId) {
    const treeTerrains = ['FOREST', 'TAIGA', 'JUNGLE'];
    return treeTerrains.includes(terrainId);
  }

  /**
   * Add trees to the scene for qualifying tiles
   * @param {Array} tiles - Array of tile objects with terrain information
   * @param {THREE.Scene} scene - Three.js scene to add trees to
   */
  addTreesToScene(tiles, scene) {
    // Clear existing trees
    this.clearTrees(scene);
    
    tiles.forEach(tile => {
      if (this.shouldHaveTrees(tile.terrainId)) {
        const tileTreeGroup = this.generateTreesForTile({
          center: tile.center || { x: 0, y: 0, z: 0 },
          area: tile.area || 0
        });
        
        this.treeGroup.add(tileTreeGroup);
        this.trees.push(tileTreeGroup);
      }
    });
    
    scene.add(this.treeGroup);
  }

  /**
   * Remove all trees from the scene
   * @param {THREE.Scene} scene - Three.js scene to remove trees from
   */
  clearTrees(scene) {
    // Remove from scene
    scene.remove(this.treeGroup);
    
    // Dispose of tree objects
    this.trees.forEach(treeGroup => {
      treeGroup.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    });
    
    // Clear arrays
    this.trees = [];
    this.treeGroup.clear();
  }

  /**
   * Dispose of tree component resources
   */
  dispose() {
    this.trunkGeometry.dispose();
    this.canopyGeometry.dispose();
    this.trunkMaterial.dispose();
    this.canopyMaterial.dispose();
  }
}

export default TreeComponent; 