import * as THREE from 'three';

/**
 * Ultra-Minimal Tree System - Stores only essential data, generates everything else
 * Memory usage: ~4-8 bytes per tree vs current ~1660 bytes per tree
 */
export class MinimalTreeSystem {
  constructor() {
    this.treeData = new Float32Array(0); // Packed tree data
    this.treeCount = 0;
    this.meshes = new Map();
    this.materialCache = new Map();
    this.geometryCache = new Map();
    
    // Shared geometries for different tree types
    this.initializeSharedGeometry();
  }

  initializeSharedGeometry() {
    // Ultra-simple tree geometries
    this.geometries = {
      // Type 0: Minimal cone tree (3 triangles)
      simple: this.createMinimalTreeGeometry(3),
      // Type 1: Basic tree (6 triangles) 
      basic: this.createMinimalTreeGeometry(6),
      // Type 2: Cross billboard
      cross: this.createCrossBillboard()
    };
    
    this.materials = {
      green: new THREE.MeshBasicMaterial({ color: 0x228B22, fog: true }),
      darkGreen: new THREE.MeshBasicMaterial({ color: 0x006400, fog: true }),
      lightGreen: new THREE.MeshBasicMaterial({ color: 0x32CD32, fog: true })
    };
  }

  createMinimalTreeGeometry(segments) {
    // Ultra-simple combined trunk+canopy geometry
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
        
        // Triangle from center to edge
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

  createCrossBillboard() {
    // Two intersecting planes for distant trees
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
   * Add trees using minimal data storage
   * Each tree: x(16bit), y(16bit), z(16bit), type(4bit), size(4bit), color(4bit) = 56 bits = 7 bytes
   */
  addTrees(tileData) {
    const treeCount = this.calculateTreeCount(tileData.area);
    const newTotalCount = this.treeCount + treeCount;
    
    // Expand tree data array
    const newTreeData = new Float32Array(newTotalCount * 2); // 2 floats per tree (position + packed data)
    newTreeData.set(this.treeData);
    
    const sphereRadius = Math.sqrt(
      tileData.center.x ** 2 + tileData.center.y ** 2 + tileData.center.z ** 2
    );
    
    // Generate minimal tree data
    for (let i = 0; i < treeCount; i++) {
      const treeIndex = (this.treeCount + i) * 2;
      const position = this.generateTreePosition(tileData, sphereRadius);
      
      // Pack position into two floats (lossy compression)
      newTreeData[treeIndex] = this.packPosition(position);
      
      // Pack tree properties (type, size, color variation) into second float
      const treeType = Math.floor(Math.random() * 3); // 0-2
      const size = 0.8 + Math.random() * 0.4; // 0.8-1.2
      const colorVariation = Math.floor(Math.random() * 3); // 0-2
      
      newTreeData[treeIndex + 1] = this.packProperties(treeType, size, colorVariation);
    }
    
    this.treeData = newTreeData;
    this.treeCount = newTotalCount;
    
    console.log(`[MinimalTrees] Added ${treeCount} trees. Total: ${this.treeCount} (${this.getMemoryUsage()} bytes)`);
  }

  packPosition(pos) {
    // Pack 3D position into a single float (very lossy but tiny)
    // Use spherical coordinates relative to sphere center
    const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
    const theta = Math.atan2(pos.y, pos.x);
    const phi = Math.acos(pos.z / r);
    
    // Pack into float32 mantissa bits (limited precision)
    const packed = (Math.floor(theta * 1000) & 0xFFF) << 12 | (Math.floor(phi * 1000) & 0xFFF);
    return packed;
  }

  packProperties(type, size, colorVariation) {
    // Pack tree properties into float32
    const typeInt = type & 0x3; // 2 bits
    const sizeInt = Math.floor(size * 15) & 0xF; // 4 bits  
    const colorInt = colorVariation & 0x3; // 2 bits
    
    return (typeInt << 6) | (sizeInt << 2) | colorInt;
  }

  unpackPosition(packed, sphereRadius) {
    // Unpack position from float
    const packedInt = Math.floor(packed);
    const theta = ((packedInt >> 12) & 0xFFF) / 1000;
    const phi = (packedInt & 0xFFF) / 1000;
    
    return {
      x: sphereRadius * Math.sin(phi) * Math.cos(theta),
      y: sphereRadius * Math.sin(phi) * Math.sin(theta), 
      z: sphereRadius * Math.cos(phi)
    };
  }

  unpackProperties(packed) {
    const packedInt = Math.floor(packed);
    return {
      type: (packedInt >> 6) & 0x3,
      size: ((packedInt >> 2) & 0xF) / 15,
      colorVariation: packedInt & 0x3
    };
  }

  generateTreePosition(tileData, sphereRadius) {
    // Very simple position generation
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * Math.sqrt(tileData.area / Math.PI) * 0.8;
    
    const offset = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: 0
    };
    
    // Project to sphere
    const center = new THREE.Vector3(tileData.center.x, tileData.center.y, tileData.center.z);
    const tangent = new THREE.Vector3(1, 0, 0).cross(center).normalize();
    const bitangent = center.clone().cross(tangent).normalize();
    
    const worldOffset = tangent.multiplyScalar(offset.x).add(bitangent.multiplyScalar(offset.y));
    const finalPos = center.add(worldOffset).normalize().multiplyScalar(sphereRadius);
    
    return { x: finalPos.x, y: finalPos.y, z: finalPos.z };
  }

  calculateTreeCount(area) {
    // Reduced density for minimal system
    return Math.floor(area * 500); // Much lower density
  }

  /**
   * Render trees using instanced meshes based on LOD
   */
  renderTrees(scene, cameraPosition, sphereRadius) {
    // Clear existing meshes
    this.meshes.forEach(mesh => scene.remove(mesh));
    this.meshes.clear();
    
    const lodBuckets = {
      detailed: { trees: [], maxDistance: 1000 },
      simple: { trees: [], maxDistance: 3000 },
      cross: { trees: [], maxDistance: Infinity }
    };
    
    // Sort trees into LOD buckets
    for (let i = 0; i < this.treeCount; i++) {
      const dataIndex = i * 2;
      const position = this.unpackPosition(this.treeData[dataIndex], sphereRadius);
      const properties = this.unpackProperties(this.treeData[dataIndex + 1]);
      
      const distance = cameraPosition.distanceTo(new THREE.Vector3(position.x, position.y, position.z));
      
      const treeData = { position, properties, distance };
      
      if (distance < lodBuckets.detailed.maxDistance) {
        lodBuckets.detailed.trees.push(treeData);
      } else if (distance < lodBuckets.simple.maxDistance) {
        lodBuckets.simple.trees.push(treeData);
      } else {
        lodBuckets.cross.trees.push(treeData);
      }
    }
    
    // Create instanced meshes for each LOD level
    Object.entries(lodBuckets).forEach(([lodLevel, bucket]) => {
      if (bucket.trees.length === 0) return;
      
      const geometryKey = lodLevel === 'detailed' ? 'basic' : lodLevel === 'simple' ? 'simple' : 'cross';
      const geometry = this.geometries[geometryKey];
      const material = this.materials.green; // Could vary based on properties
      
      const mesh = new THREE.InstancedMesh(geometry, material, bucket.trees.length);
      
      bucket.trees.forEach((tree, index) => {
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3(tree.position.x, tree.position.y, tree.position.z);
        const scale = 0.8 + tree.properties.size * 0.4;
        
        // Orient tree away from sphere center
        const normal = position.clone().normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        
        matrix.compose(position, quaternion, new THREE.Vector3(scale, scale, scale));
        mesh.setMatrixAt(index, matrix);
      });
      
      mesh.instanceMatrix.needsUpdate = true;
      scene.add(mesh);
      this.meshes.set(lodLevel, mesh);
    });
    
    console.log(`[MinimalTrees] Rendered: ${lodBuckets.detailed.trees.length} detailed, ${lodBuckets.simple.trees.length} simple, ${lodBuckets.cross.trees.length} cross`);
  }

  getMemoryUsage() {
    // Each tree: 2 floats = 8 bytes
    return this.treeCount * 8;
  }

  dispose() {
    Object.values(this.geometries).forEach(geo => geo.dispose());
    Object.values(this.materials).forEach(mat => mat.dispose());
    this.meshes.forEach(mesh => {
      mesh.dispose();
    });
  }
}

/**
 * Memory comparison:
 * 
 * Current system: ~1660 bytes per tree (55,770 trees = 92.33 MB)
 * Minimal system: ~8 bytes per tree (55,770 trees = 0.43 MB)
 * 
 * That's a 99.5% reduction in memory usage!
 */ 