import MapType from '@game/world/model/MapType';
import { Terrains } from '@game/planet/terrain/index.js';

const TerrainType = Object.keys(Terrains).reduce((o,k)=>(o[k]=k,o),{});

// MapType enum
export const MapTypes = {
  CONTINENTS: 'continents',
  PANGAEA: 'pangaea',
  FRACTAL: 'fractal',
  ARCHIPELAGO: 'archipelago',
  ISLAND_PLATES: 'island_plates',
  HIGHLANDS: 'highlands',
  LAKES: 'lakes',
  DRY: 'dry'
};

// Registry of map types
export const MapRegistry = {
  [MapTypes.CONTINENTS]: new MapType({
    id: MapTypes.CONTINENTS,
    name: 'Continents',
    description: 'Large landmasses separated by oceans.',
    waterCutoff: 0,
    terrainDistribution: {
      [TerrainType.OCEAN]: 0.65,
      [TerrainType.PLAINS]: 0.15,
      [TerrainType.FOREST]: 0.08,
      [TerrainType.HILLS]: 0.05,
      [TerrainType.MOUNTAINS]: 0.03,
      [TerrainType.DESERT]: 0.02,
      [TerrainType.TUNDRA]: 0.02
    }
  }),
  [MapTypes.PANGAEA]: new MapType({
    id: MapTypes.PANGAEA,
    name: 'Pangaea',
    description: 'One massive supercontinent.',
    waterCutoff: 0,
    terrainDistribution: {
      [TerrainType.OCEAN]: 0.40,
      [TerrainType.PLAINS]: 0.20,
      [TerrainType.FOREST]: 0.10,
      [TerrainType.HILLS]: 0.10,
      [TerrainType.MOUNTAINS]: 0.05,
      [TerrainType.DESERT]: 0.10,
      [TerrainType.TUNDRA]: 0.05
    }
  }),
  [MapTypes.FRACTAL]: new MapType({
    id: MapTypes.FRACTAL,
    name: 'Fractal',
    description: 'Semi-random landmasses with chaotic coastlines. Good for unpredictable games.',
    waterCutoff: 0.1,
    terrainDistribution: {
      [TerrainType.OCEAN]: 0.55,
      [TerrainType.PLAINS]: 0.15,
      [TerrainType.FOREST]: 0.08,
      [TerrainType.HILLS]: 0.08,
      [TerrainType.MOUNTAINS]: 0.05,
      [TerrainType.DESERT]: 0.05,
      [TerrainType.JUNGLE]: 0.04
    }
  }),
  [MapTypes.ARCHIPELAGO]: new MapType({
    id: MapTypes.ARCHIPELAGO,
    name: 'Archipelago',
    description: 'Lots of small islands.',
    waterCutoff: -0.2,
    terrainDistribution: {
      [TerrainType.OCEAN]: 0.85,
      [TerrainType.PLAINS]: 0.05,
      [TerrainType.FOREST]: 0.03,
      [TerrainType.HILLS]: 0.03,
      [TerrainType.MOUNTAINS]: 0.02,
      [TerrainType.JUNGLE]: 0.02
    }
  }),
  [MapTypes.ISLAND_PLATES]: new MapType({
    id: MapTypes.ISLAND_PLATES,
    name: 'Island Plates',
    description: 'Mix of small-to-medium islands.',
    waterCutoff: -0.1,
    terrainDistribution: {
      [TerrainType.OCEAN]: 0.78,
      [TerrainType.PLAINS]: 0.10,
      [TerrainType.FOREST]: 0.05,
      [TerrainType.HILLS]: 0.03,
      [TerrainType.MOUNTAINS]: 0.02,
      [TerrainType.JUNGLE]: 0.02
    }
  }),
  [MapTypes.HIGHLANDS]: new MapType({
    id: MapTypes.HIGHLANDS,
    name: 'Highlands',
    description: 'Mostly hills and mountains. Few seas.',
    waterCutoff: 0.25,
    terrainDistribution: {
      [TerrainType.OCEAN]: 0.25,
      [TerrainType.PLAINS]: 0.10,
      [TerrainType.HILLS]: 0.30,
      [TerrainType.MOUNTAINS]: 0.25,
      [TerrainType.TUNDRA]: 0.10
    }
  }),
  [MapTypes.LAKES]: new MapType({
    id: MapTypes.LAKES,
    name: 'Lakes',
    description: 'Tons of small inland lakes.',
    waterCutoff: 0,
    terrainDistribution: {
      [TerrainType.OCEAN]: 0.30,
      [TerrainType.PLAINS]: 0.30,
      [TerrainType.FOREST]: 0.20,
      [TerrainType.HILLS]: 0.10,
      [TerrainType.MARSH]: 0.10
    }
  }),
  [MapTypes.DRY]: new MapType({
    id: MapTypes.DRY,
    name: 'Dry',
    description: 'Arid terrain, with lots of deserts.',
    waterCutoff: 0,
    terrainDistribution: {
      [TerrainType.OCEAN]: 0.30,
      [TerrainType.PLAINS]: 0.15,
      [TerrainType.DESERT]: 0.40,
      [TerrainType.HILLS]: 0.10,
      [TerrainType.MOUNTAINS]: 0.05
    }
  })
};

// Default map type
export const MAP_TYPE_DEFAULT = MapTypes.CONTINENTS;

/**
 * Generate map terrain based on map type and position
 * @param {string} mapType - The map type ID from MapTypes
 * @param {THREE.Vector3} position - Normalized position vector on the planet
 * @param {function(): number} randomFloat - A function that returns a random float [0,1) for seeded randomness.
 * @returns {string|null} - Terrain type ID or null for default handling
 */
export function generateMapTerrain(mapType, position, randomFloat) {
  const mapConfig = MapRegistry[mapType];
  
  if (!mapConfig) return null;
  
  // Extract coordinates
  const { x, y, z } = position;
  
  // Create noise using the position
  const noiseX = Math.sin(x * 10) * Math.cos(z * 8) * 0.1;
  const noiseY = Math.cos(y * 12) * Math.sin(x * 9) * 0.1;
  const noise = noiseX + noiseY;
  
  // Get the terrain distribution
  const distribution = mapConfig.terrainDistribution;
  
  // Continent-based approach
  if (mapType === MapTypes.CONTINENTS) {
    // Use simplex-like noise to create continents
    const continentVal = (Math.sin(x * 2.5) * Math.cos(z * 2.5) + Math.cos(y * 3)) * 0.5;
    
    if (continentVal < -0.2) return TerrainType.OCEAN;
    if (continentVal < -0.1) return TerrainType.OCEAN;
    if (continentVal < 0.1) return TerrainType.PLAINS;
    if (continentVal < 0.2 && noise > 0) return TerrainType.FOREST;
    if (continentVal < 0.3 && noise < 0) return TerrainType.HILLS;
    if (continentVal >= 0.3) return TerrainType.MOUNTAINS;
  }
  
  // Pangaea approach
  if (mapType === MapTypes.PANGAEA) {
    // Create one large landmass centered around one side of the planet
    const distFromCenter = Math.sqrt(x * x + z * z);
    
    if (x < -0.5 && distFromCenter > 0.7) return TerrainType.OCEAN;
    if (distFromCenter > 0.85) return TerrainType.OCEAN;
    if (distFromCenter > 0.8) return TerrainType.OCEAN;
    
    // Interior terrain varies based on latitude (y)
    if (y > 0.7) return TerrainType.TUNDRA;
    if (y < -0.7) return TerrainType.TUNDRA;
    if (Math.abs(y) < 0.2 && noise > 0) return TerrainType.DESERT;
    if (noise > 0.05) return TerrainType.FOREST;
    if (noise < -0.05) return TerrainType.HILLS;
    if (Math.abs(noise) > 0.08) return TerrainType.MOUNTAINS;
    
    return TerrainType.PLAINS;
  }
  
  // Archipelago approach
  if (mapType === MapTypes.ARCHIPELAGO) {
    // Create many small islands
    const islandNoise = (Math.sin(x * 20) * Math.cos(z * 20) + Math.sin(y * 20) * Math.cos(x * 20)) * 0.5;
    
    if (islandNoise < 0.3) return TerrainType.OCEAN;
    if (islandNoise < 0.35) return TerrainType.OCEAN;
    
    // Island interiors vary
    if (islandNoise < 0.4) return TerrainType.PLAINS;
    if (islandNoise < 0.45) return TerrainType.FOREST;
    return TerrainType.HILLS;
  }
  
  // Apply terrain distribution weighted randomization for other map types
  // This is a simplified implementation - real games would use more deterministic approaches
  const roll = randomFloat(); // Use the passed randomFloat function
  let cumulativeChance = 0;
  
  for (const [terrain, chance] of Object.entries(distribution)) {
    cumulativeChance += chance;
    if (roll < cumulativeChance) {
      return terrain;
    }
  }
  
  // Fallback
  return TerrainType.PLAINS;
} 