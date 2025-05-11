import { createNoise3D } from 'simplex-noise';
import * as THREE from 'three';

// Terrain types
export const TerrainType = {
  OCEAN: 'ocean',
  PLAINS: 'plains',
  FOREST: 'forest',
  HILLS: 'hills',
  MOUNTAINS: 'mountains',
  DESERT: 'desert',
  TUNDRA: 'tundra'
};

// Resource types
export const ResourceType = {
  NONE: 'none',
  GRAIN: 'grain',
  LIVESTOCK: 'livestock',
  WOOD: 'wood',
  STONE: 'stone',
  IRON: 'iron',
  GOLD: 'gold',
  OIL: 'oil'
};

export function generateWorld(config) {
  const { radius, detail, waterLevel, mountainLevel } = config;
  
  // Initialize noise generators with random seeds
  const elevationNoise = createNoise3D(Math.random);
  const temperatureNoise = createNoise3D(Math.random);
  const moistureNoise = createNoise3D(Math.random);
  const resourceNoise = createNoise3D(Math.random);
  
  // Generate hexes for a sphere using icosahedron subdivision
  const hexes = generateHexSphereGrid(radius, detail);
  
  // Apply noise to generate terrain data
  for (const hex of hexes) {
    // Get normalized position on sphere
    const position = new THREE.Vector3(hex.position.x, hex.position.y, hex.position.z);
    const pos = position.normalize();
    
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
    hex.data = {
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
  
  return {
    hexes,
    config
  };
}

// Function to generate a hexagonal grid mapped to a sphere
function generateHexSphereGrid(radius, detail) {
  // This is a simplified placeholder
  // In a real implementation, we would use a proper algorithm to create a hexagonal grid on a sphere
  // For now, we'll return dummy data to be replaced with actual implementation
  
  const hexes = [];
  
  // Generate a simple latitude/longitude grid as a placeholder
  // This isn't a proper hex sphere but serves as a placeholder
  const steps = Math.pow(2, detail) * 5;
  
  for (let lat = 0; lat < steps; lat++) {
    for (let lon = 0; lon < steps; lon++) {
      const phi = (lat / steps) * Math.PI;
      const theta = (lon / steps) * 2 * Math.PI;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      // Calculate neighbors (not accurate for a proper hex sphere)
      const neighbors = [];
      
      hexes.push({
        id: `hex_${lat}_${lon}`,
        position: { x, y, z },
        neighbors,
        data: {}
      });
    }
  }
  
  // Note: In a production system, you would use a proper hex sphere algorithm
  // such as a subdivided icosahedron or other approach
  
  return hexes;
} 