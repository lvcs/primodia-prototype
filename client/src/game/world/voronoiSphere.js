import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { TerrainType, ResourceType, terrainColors, resourceMarkers } from './constants.js';
import { debug, error } from '../debug.js';

/**
 * Generate a spherical Voronoi diagram for the planet
 * @param {Object} config - Configuration for world generation
 * @returns {Object} - World data with cell information
 */
export function generateVoronoiSphere(config) {
  try {
    debug('Starting Voronoi sphere generation with config:', config);
    
    // Extract configuration
    const { radius = 10, numCells = 500, waterLevel = 0.35, mountainLevel = 0.75 } = config;
    
    // Initialize noise generators with random seeds
    const elevationNoise = createNoise3D(Math.random);
    const temperatureNoise = createNoise3D(Math.random);
    const moistureNoise = createNoise3D(Math.random);
    const resourceNoise = createNoise3D(Math.random);
    
    debug(`Generating ${numCells} seed points for Fibonacci sphere...`);
    
    // Generate seed points using Fibonacci spiral for uniform distribution
    const seedPoints = generateFibonacciPoints(numCells, radius);
    
    debug(`Generated ${seedPoints.length} seed points, now computing dual mesh...`);
    
    // Generate the dual mesh (Voronoi cells)
    const voronoiCells = computeDualMesh(seedPoints, radius);
    
    debug(`Generated ${voronoiCells.length} Voronoi cells, applying terrain data...`);
    
    // Apply noise to generate terrain data
    for (const cell of voronoiCells) {
      // Get normalized position (center of the cell)
      const pos = new THREE.Vector3(
        cell.center.x, 
        cell.center.y, 
        cell.center.z
      ).normalize();
      
      // Generate elevation using multiple octaves of noise
      const elevation = (
        elevationNoise(pos.x * 1.0, pos.y * 1.0, pos.z * 1.0) * 0.5 +
        elevationNoise(pos.x * 2.0, pos.y * 2.0, pos.z * 2.0) * 0.25 +
        elevationNoise(pos.x * 4.0, pos.y * 4.0, pos.z * 4.0) * 0.125
      ) / 0.875;
      
      // Normalize to 0-1 range
      const normalizedElevation = (elevation + 1) / 2;
      
      // Generate temperature (hotter at equator, colder at poles)
      const latitude = Math.acos(pos.y) / Math.PI; // 0 = north pole, 1 = south pole
      const equatorDistance = Math.abs(latitude - 0.5) * 2; // 0 = equator, 1 = pole
      const baseTemperature = 1 - equatorDistance;
      
      // Apply noise to temperature
      const temperature = baseTemperature + temperatureNoise(pos.x * 2, pos.y * 2, pos.z * 2) * 0.2;
      
      // Generate moisture
      const moisture = (
        moistureNoise(pos.x * 1.5, pos.y * 1.5, pos.z * 1.5) * 0.5 +
        moistureNoise(pos.x * 3.0, pos.y * 3.0, pos.z * 3.0) * 0.25
      ) / 0.75;
      
      // Normalize to 0-1 range
      const normalizedMoisture = (moisture + 1) / 2;
      
      // Determine terrain type based on elevation, temperature, and moisture
      let terrainType;
      
      if (normalizedElevation < waterLevel) {
        terrainType = TerrainType.OCEAN;
      } else if (normalizedElevation > mountainLevel) {
        terrainType = TerrainType.MOUNTAINS;
      } else if (normalizedElevation > mountainLevel - 0.1) {
        terrainType = TerrainType.HILLS;
      } else if (temperature < 0.3) {
        terrainType = TerrainType.TUNDRA;
      } else if (temperature > 0.7 && normalizedMoisture < 0.3) {
        terrainType = TerrainType.DESERT;
      } else if (normalizedMoisture > 0.6) {
        terrainType = TerrainType.FOREST;
      } else {
        terrainType = TerrainType.PLAINS;
      }
      
      // Determine resources based on terrain
      let resource = ResourceType.NONE;
      const resourceValue = resourceNoise(pos.x * 5, pos.y * 5, pos.z * 5);
      
      // Only add resources with 30% probability
      if (resourceValue > 0.7) {
        switch (terrainType) {
          case TerrainType.PLAINS:
            resource = Math.random() > 0.5 ? ResourceType.GRAIN : ResourceType.LIVESTOCK;
            break;
          case TerrainType.FOREST:
            resource = ResourceType.WOOD;
            break;
          case TerrainType.HILLS:
            resource = Math.random() > 0.5 ? ResourceType.STONE : ResourceType.IRON;
            break;
          case TerrainType.MOUNTAINS:
            resource = ResourceType.GOLD;
            break;
          case TerrainType.DESERT:
            if (Math.random() > 0.7) resource = ResourceType.OIL;
            break;
        }
      }
      
      // Store terrain data
      cell.data = {
        elevation: normalizedElevation,
        temperature,
        moisture: normalizedMoisture,
        terrainType,
        resource,
        owner: null,
        buildings: [],
        units: []
      };
    }
    
    debug(`Terrain generation complete. Returning ${voronoiCells.length} cells.`);
    
    return {
      cells: voronoiCells,
      config
    };
  } catch (err) {
    error('Error in generateVoronoiSphere:', err);
    // Return minimal valid structure
    return {
      cells: [],
      config
    };
  }
}

/**
 * Create a THREE.js representation of the Voronoi sphere
 * @param {Object} world - World data with Voronoi cells
 * @param {THREE.Scene} scene - THREE.js scene to add objects to
 * @returns {THREE.Group} - Group containing all cell meshes
 */
export function createVoronoiSphereRenderer(world, scene) {
  // Create a group to hold all cells
  const cellGroup = new THREE.Group();
  scene.add(cellGroup);

  // Verify the world object has the expected structure
  if (!world || !world.cells || !Array.isArray(world.cells)) {
    console.error('Invalid world data:', world);
    
    // If world data is invalid, create a basic sphere as a fallback
    const fallbackGeometry = new THREE.SphereGeometry(10, 32, 32);
    const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0x1a75b0 });
    const fallbackSphere = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    cellGroup.add(fallbackSphere);
    
    return cellGroup;
  }
  
  const { cells, config } = world;
  const planetRadius = config?.radius || 10;
  
  // Create a blue sphere to represent the ocean base
  const oceanSphere = createOceanSphere(planetRadius);
  oceanSphere.userData.isOcean = true;
  scene.add(oceanSphere);
  
  // Create meshes for each cell
  for (const cell of cells) {
    // Skip invalid cells
    if (!cell || !cell.data) continue;
    
    const cellData = cell.data;
    
    // Skip ocean cells - they'll be represented by the blue sphere
    if (cellData.terrainType === TerrainType.OCEAN) {
      continue;
    }
    
    // Get color based on terrain type
    const color = terrainColors[cellData.terrainType] || 0x808080;
    
    // Create cell mesh
    const cellMesh = createCellMesh(cell, color, planetRadius, cellData.elevation);
    
    // Store cell data for later reference
    cellMesh.userData = {
      isCell: true,
      cellId: cell.id,
      cellData: cellData
    };
    
    // Add to the group
    cellGroup.add(cellMesh);
    
    // Add resource marker if the cell has a resource
    if (cellData.resource && cellData.resource !== ResourceType.NONE) {
      const resourceInfo = resourceMarkers[cellData.resource];
      if (resourceInfo) {
        const resourceMarker = createResourceMarker(resourceInfo, planetRadius);
        const normalizedPos = new THREE.Vector3(
          cell.center.x, 
          cell.center.y, 
          cell.center.z
        ).normalize();
        
        // Position marker at cell center with elevation
        const elevationFactor = 1 + (cellData.elevation * 0.12);
        resourceMarker.position.copy(
          normalizedPos.multiplyScalar(planetRadius * elevationFactor + 0.05)
        );
        
        cellGroup.add(resourceMarker);
      }
    }
  }
  
  return cellGroup;
}

/**
 * Generate points on a sphere using Fibonacci spiral distribution
 * @param {Number} numPoints - Number of points to generate
 * @param {Number} radius - Radius of the sphere
 * @returns {Array} - Array of point positions
 */
function generateFibonacciPoints(numPoints, radius) {
  const points = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
  
  for (let i = 0; i < numPoints; i++) {
    const y = 1 - (i / (numPoints - 1)) * 2; // y goes from 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y); // radius at y position
    
    const theta = phi * i; // Golden angle increment
    
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    
    points.push({
      id: `point_${i}`,
      position: new THREE.Vector3(x, y, z).multiplyScalar(radius)
    });
  }
  
  return points;
}

/**
 * Compute the dual mesh (Voronoi diagram) from a set of points on a sphere
 * @param {Array} points - Array of seed points
 * @param {Number} radius - Radius of the sphere
 * @returns {Array} - Array of Voronoi cells
 */
function computeDualMesh(points, radius) {
  const cells = [];
  
  // For each seed point, create a Voronoi cell
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    
    // Find nearest neighbors
    const neighbors = findNearestNeighbors(points, i, 10);
    
    // Compute the Voronoi cell vertices
    const vertices = computeSphericalVoronoiCell(point, neighbors, radius);
    
    cells.push({
      id: `cell_${i}`,
      center: point.position,
      vertices: vertices,
      neighbors: neighbors.map(n => n.id)
    });
  }
  
  return cells;
}

/**
 * Find the nearest neighbors to a point
 * @param {Array} points - Array of all points
 * @param {Number} pointIndex - Index of the point to find neighbors for
 * @param {Number} numNeighbors - Number of neighbors to find
 * @returns {Array} - Array of nearest neighbor points
 */
function findNearestNeighbors(points, pointIndex, numNeighbors) {
  const point = points[pointIndex];
  const others = points.filter((p, idx) => idx !== pointIndex);
  
  // Sort by distance
  others.sort((a, b) => {
    const distA = point.position.distanceTo(a.position);
    const distB = point.position.distanceTo(b.position);
    return distA - distB;
  });
  
  // Return the closest numNeighbors points
  return others.slice(0, numNeighbors);
}

/**
 * Compute a spherical Voronoi cell for a point
 * @param {Object} point - The seed point
 * @param {Array} neighbors - Array of neighbor points
 * @param {Number} radius - Radius of the sphere
 * @returns {Array} - Array of vertex positions for the cell
 */
function computeSphericalVoronoiCell(point, neighbors, radius) {
  const center = point.position.clone().normalize();
  const vertices = [];
  
  // For each pair of adjacent neighbors, find the circumcenter
  for (let i = 0; i < neighbors.length; i++) {
    const n1 = neighbors[i];
    const n2 = neighbors[(i + 1) % neighbors.length];
    
    // Find the circumcenter of the triangle (point, n1, n2)
    const v1 = point.position.clone().normalize();
    const v2 = n1.position.clone().normalize();
    const v3 = n2.position.clone().normalize();
    
    // Use spherical barycentric coordinates to find a point roughly at the circumcenter
    const circumcenter = new THREE.Vector3()
      .addScaledVector(v1, 1)
      .addScaledVector(v2, 1)
      .addScaledVector(v3, 1)
      .normalize()
      .multiplyScalar(radius);
    
    vertices.push(circumcenter);
  }
  
  // Sort vertices in clockwise order around the center
  sortVerticesAroundAxis(vertices, center);
  
  return vertices;
}

/**
 * Sort vertices in clockwise order around an axis
 * @param {Array} vertices - Array of vertex positions
 * @param {THREE.Vector3} axis - Axis to sort around
 */
function sortVerticesAroundAxis(vertices, axis) {
  // Create a reference vector perpendicular to the axis
  const perpendicular = new THREE.Vector3(1, 0, 0);
  if (Math.abs(axis.dot(perpendicular)) > 0.9) {
    perpendicular.set(0, 1, 0);
  }
  
  const tangent1 = new THREE.Vector3().crossVectors(axis, perpendicular).normalize();
  const tangent2 = new THREE.Vector3().crossVectors(axis, tangent1).normalize();
  
  // Sort by angle in the tangent plane
  vertices.sort((a, b) => {
    const aProj = new THREE.Vector2(a.dot(tangent1), a.dot(tangent2));
    const bProj = new THREE.Vector2(b.dot(tangent1), b.dot(tangent2));
    
    return Math.atan2(aProj.y, aProj.x) - Math.atan2(bProj.y, bProj.x);
  });
}

/**
 * Create the ocean sphere
 * @param {Number} radius - Radius of the sphere
 * @returns {THREE.Mesh} - Ocean sphere mesh
 */
function createOceanSphere(radius) {
  const geometry = new THREE.SphereGeometry(radius * 0.99, 128, 64);
  const material = new THREE.MeshPhysicalMaterial({
    color: terrainColors[TerrainType.OCEAN],
    metalness: 0.0,
    roughness: 0.5,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.4,
    transparent: true,
    opacity: 0.9
  });
  
  return new THREE.Mesh(geometry, material);
}

/**
 * Create a mesh for a Voronoi cell
 * @param {Object} cell - Cell data
 * @param {Number} color - Cell color
 * @param {Number} radius - Planet radius
 * @param {Number} elevation - Cell elevation (0-1)
 * @returns {THREE.Mesh} - Cell mesh
 */
function createCellMesh(cell, color, radius, elevation) {
  // Create geometry from vertices
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const triangles = [];
  
  // Center point of the cell (will be used for triangulation)
  const center = new THREE.Vector3(
    cell.center.x, 
    cell.center.y, 
    cell.center.z
  );
  
  // Normalize center and apply elevation
  const normalizedCenter = center.clone().normalize();
  const elevationOffset = normalizedCenter.clone().multiplyScalar(radius * elevation * 0.1);
  const elevatedCenter = center.clone().add(elevationOffset);
  
  // Add vertices for triangulation
  vertices.push(elevatedCenter.x, elevatedCenter.y, elevatedCenter.z);
  
  // Add outer vertices with elevation
  for (let i = 0; i < cell.vertices.length; i++) {
    const vertex = new THREE.Vector3(
      cell.vertices[i].x,
      cell.vertices[i].y,
      cell.vertices[i].z
    );
    
    // Apply elevation
    const normalizedVertex = vertex.clone().normalize();
    const vertexElevationOffset = normalizedVertex.clone().multiplyScalar(radius * elevation * 0.1);
    const elevatedVertex = vertex.clone().add(vertexElevationOffset);
    
    vertices.push(elevatedVertex.x, elevatedVertex.y, elevatedVertex.z);
    
    // Create triangles (center, current vertex, next vertex)
    const nextIdx = (i + 1) % cell.vertices.length;
    triangles.push(0, i + 1, nextIdx + 1);
  }
  
  // Create buffer geometry
  const verticesFloat32 = new Float32Array(vertices);
  geometry.setAttribute('position', new THREE.BufferAttribute(verticesFloat32, 3));
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();
  
  // Create material with slight randomness for visual variety
  const hueVariation = (Math.random() * 0.1) - 0.05; // ±5% hue variation
  const color3 = new THREE.Color(color);
  color3.offsetHSL(hueVariation, 0, 0);
  
  const material = new THREE.MeshPhysicalMaterial({
    color: color3,
    metalness: 0.1,
    roughness: 0.7,
    flatShading: false,
    side: THREE.FrontSide
  });
  
  return new THREE.Mesh(geometry, material);
}

/**
 * Create a resource marker for a cell
 * @param {Object} resourceInfo - Resource marker info
 * @param {Number} radius - Planet radius
 * @returns {THREE.Object3D} - Resource marker object
 */
function createResourceMarker(resourceInfo, radius) {
  // Create a small glowing sphere to represent the resource
  const geometry = new THREE.SphereGeometry(radius * 0.03, 8, 8);
  const material = new THREE.MeshStandardMaterial({
    color: resourceInfo.color,
    emissive: resourceInfo.color,
    emissiveIntensity: 0.6,
    metalness: 0.8,
    roughness: 0.2
  });
  
  return new THREE.Mesh(geometry, material);
} 