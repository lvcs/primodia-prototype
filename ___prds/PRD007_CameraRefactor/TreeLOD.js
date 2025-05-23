import * as THREE from 'three';

/**
 * Multi-LOD Tree System - Drastically reduces memory by using different representations
 * based on distance from camera
 */
export class TreeLODSystem {
  constructor() {
    this.lodLevels = {
      // LOD 0: Full 3D geometry (closest trees)
      detailed: {
        distance: 1000,
        maxTrees: 5000,
        trunkSegments: 6,
        canopySegments: 6
      },
      // LOD 1: Simplified geometry
      simple: {
        distance: 3000,
        maxTrees: 15000,
        trunkSegments: 3,
        canopySegments: 3
      },
      // LOD 2: Billboard sprites (furthest trees)
      billboard: {
        distance: Infinity,
        maxTrees: Infinity
      }
    };
    
    this.lodMeshes = new Map();
    this.billboardSystem = null;
    this.trees = [];
    this.cameraPosition = new THREE.Vector3();
  }

  initialize(trees, scene) {
    this.trees = trees;
    this.createLODMeshes();
    this.createBillboardSystem();
    this.updateLOD(new THREE.Vector3(0, 0, 0)); // Initial update
    
    // Add all LOD meshes to scene
    this.lodMeshes.forEach(mesh => scene.add(mesh));
    if (this.billboardSystem) {
      scene.add(this.billboardSystem.mesh);
    }
  }

  createLODMeshes() {
    // Create detailed LOD mesh
    const detailedGeometry = this.createCombinedTreeGeometry(
      this.lodLevels.detailed.trunkSegments,
      this.lodLevels.detailed.canopySegments
    );
    const detailedMesh = new THREE.InstancedMesh(
      detailedGeometry,
      this.createTreeMaterial(),
      this.lodLevels.detailed.maxTrees
    );
    detailedMesh.count = 0;
    this.lodMeshes.set('detailed', detailedMesh);

    // Create simple LOD mesh
    const simpleGeometry = this.createCombinedTreeGeometry(
      this.lodLevels.simple.trunkSegments,
      this.lodLevels.simple.canopySegments
    );
    const simpleMesh = new THREE.InstancedMesh(
      simpleGeometry,
      this.createTreeMaterial(),
      this.lodLevels.simple.maxTrees
    );
    simpleMesh.count = 0;
    this.lodMeshes.set('simple', simpleMesh);
  }

  createCombinedTreeGeometry(trunkSegments, canopySegments) {
    // Combine trunk and canopy into single geometry to reduce draw calls
    const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 2, trunkSegments);
    const canopyGeometry = new THREE.ConeGeometry(1, 3, canopySegments);
    
    // Position canopy above trunk
    canopyGeometry.translate(0, 2.5, 0);
    
    // Merge geometries
    const combinedGeometry = new THREE.BufferGeometry();
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
    
    combinedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    combinedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    combinedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    
    // Cleanup
    trunkGeometry.dispose();
    canopyGeometry.dispose();
    
    return combinedGeometry;
  }

  createBillboardSystem() {
    // Create texture for tree billboard
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
    
    // Create billboard geometry
    const billboardGeometry = new THREE.PlaneGeometry(2, 4);
    const billboardMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });
    
    this.billboardSystem = {
      geometry: billboardGeometry,
      material: billboardMaterial,
      mesh: new THREE.InstancedMesh(billboardGeometry, billboardMaterial, 50000),
      texture: texture
    };
    this.billboardSystem.mesh.count = 0;
  }

  createTreeMaterial() {
    // Use vertex colors to distinguish trunk and canopy
    return new THREE.MeshLambertMaterial({
      vertexColors: false,
      color: 0x228B22 // Default green, can be modified per instance
    });
  }

  updateLOD(cameraPosition) {
    this.cameraPosition.copy(cameraPosition);
    
    // Reset all mesh counts
    this.lodMeshes.forEach(mesh => mesh.count = 0);
    this.billboardSystem.mesh.count = 0;
    
    const tempMatrix = new THREE.Matrix4();
    const tempPosition = new THREE.Vector3();
    
    // Sort trees by distance and assign to appropriate LOD levels
    const treesWithDistance = this.trees.map(tree => {
      const distance = cameraPosition.distanceTo(new THREE.Vector3(tree.position.x, tree.position.y, tree.position.z));
      return { tree, distance };
    }).sort((a, b) => a.distance - b.distance);
    
    let detailedCount = 0;
    let simpleCount = 0;
    let billboardCount = 0;
    
    treesWithDistance.forEach(({ tree, distance }) => {
      if (distance < this.lodLevels.detailed.distance && detailedCount < this.lodLevels.detailed.maxTrees) {
        // Use detailed geometry
        this.setInstanceMatrix(this.lodMeshes.get('detailed'), detailedCount, tree);
        detailedCount++;
      } else if (distance < this.lodLevels.simple.distance && simpleCount < this.lodLevels.simple.maxTrees) {
        // Use simple geometry
        this.setInstanceMatrix(this.lodMeshes.get('simple'), simpleCount, tree);
        simpleCount++;
      } else {
        // Use billboard
        this.setBillboardMatrix(billboardCount, tree, cameraPosition);
        billboardCount++;
      }
    });
    
    // Update instance counts
    this.lodMeshes.get('detailed').count = detailedCount;
    this.lodMeshes.get('simple').count = simpleCount;
    this.billboardSystem.mesh.count = billboardCount;
    
    // Update instance matrices
    this.lodMeshes.forEach(mesh => {
      mesh.instanceMatrix.needsUpdate = true;
    });
    this.billboardSystem.mesh.instanceMatrix.needsUpdate = true;
    
    console.log(`[TreeLOD] Updated: ${detailedCount} detailed, ${simpleCount} simple, ${billboardCount} billboards`);
  }

  setInstanceMatrix(mesh, index, tree) {
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3(tree.position.x, tree.position.y, tree.position.z);
    const quaternion = tree.quaternion || new THREE.Quaternion();
    const scale = new THREE.Vector3(tree.scale || 1, tree.scale || 1, tree.scale || 1);
    
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  }

  setBillboardMatrix(index, tree, cameraPosition) {
    const position = new THREE.Vector3(tree.position.x, tree.position.y, tree.position.z);
    
    // Make billboard face camera
    const lookDirection = new THREE.Vector3().subVectors(cameraPosition, position).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, lookDirection).normalize();
    const billboard_up = new THREE.Vector3().crossVectors(lookDirection, right);
    
    const matrix = new THREE.Matrix4();
    matrix.makeBasis(right, billboard_up, lookDirection);
    matrix.setPosition(position);
    
    // Scale billboard based on distance for consistent appearance
    const distance = cameraPosition.distanceTo(position);
    const scale = Math.max(0.5, Math.min(2, distance / 1000));
    matrix.scale(new THREE.Vector3(scale, scale, scale));
    
    this.billboardSystem.mesh.setMatrixAt(index, matrix);
  }

  dispose() {
    this.lodMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    
    if (this.billboardSystem) {
      this.billboardSystem.geometry.dispose();
      this.billboardSystem.material.dispose();
      this.billboardSystem.texture.dispose();
    }
  }

  getMemoryEstimate() {
    let totalMemory = 0;
    
    this.lodMeshes.forEach((mesh, name) => {
      const vertices = mesh.geometry.attributes.position.count;
      const instances = mesh.count;
      // Vertices (12 bytes) + normals (12 bytes) + matrices (64 bytes per instance)
      totalMemory += vertices * 24 + instances * 64;
    });
    
    // Billboard system memory (much smaller)
    const billboardVertices = this.billboardSystem.geometry.attributes.position.count;
    totalMemory += billboardVertices * 24 + this.billboardSystem.mesh.count * 64;
    
    return totalMemory;
  }
} 