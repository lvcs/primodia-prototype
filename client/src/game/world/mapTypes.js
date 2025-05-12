// Map types for world generation
import { TerrainType } from './terrain.js';

// MapType enum
export const MapType = {
  CONTINENTS: 'continents',
  PANGAEA: 'pangaea',
  FRACTAL: 'fractal',
  ARCHIPELAGO: 'archipelago',
  ISLAND_PLATES: 'island_plates',
  HIGHLANDS: 'highlands',
  LAKES: 'lakes',
  DRY: 'dry'
};

// Descriptive information about each map type
export const mapTypeInfo = {
  [MapType.CONTINENTS]: {
    name: 'Continents',
    description: 'Large landmasses separated by oceans.',
    terrainDistribution: {
      [TerrainType.OCEAN]: 0.65,
      [TerrainType.PLAINS]: 0.15,
      [TerrainType.FOREST]: 0.08,
      [TerrainType.HILLS]: 0.05,
      [TerrainType.MOUNTAINS]: 0.03,
      [TerrainType.DESERT]: 0.02,
      [TerrainType.TUNDRA]: 0.02
    }
  },
  [MapType.PANGAEA]: {
    name: 'Pangaea',
    description: 'One massive supercontinent.',
    terrainDistribution: {
      [TerrainType.OCEAN]: 0.40,
      [TerrainType.PLAINS]: 0.20,
      [TerrainType.FOREST]: 0.10,
      [TerrainType.HILLS]: 0.10,
      [TerrainType.MOUNTAINS]: 0.05,
      [TerrainType.DESERT]: 0.10,
      [TerrainType.TUNDRA]: 0.05
    }
  },
  [MapType.FRACTAL]: {
    name: 'Fractal',
    description: 'Semi-random landmasses with chaotic coastlines. Good for unpredictable games.',
    terrainDistribution: {
      [TerrainType.OCEAN]: 0.55,
      [TerrainType.PLAINS]: 0.15,
      [TerrainType.FOREST]: 0.08,
      [TerrainType.HILLS]: 0.08,
      [TerrainType.MOUNTAINS]: 0.05,
      [TerrainType.DESERT]: 0.05,
      [TerrainType.JUNGLE]: 0.04
    }
  },
  [MapType.ARCHIPELAGO]: {
    name: 'Archipelago',
    description: 'Lots of small islands.',
    terrainDistribution: {
      [TerrainType.OCEAN]: 0.80,
      [TerrainType.COAST]: 0.05,
      [TerrainType.PLAINS]: 0.05,
      [TerrainType.FOREST]: 0.03,
      [TerrainType.HILLS]: 0.03,
      [TerrainType.MOUNTAINS]: 0.02,
      [TerrainType.JUNGLE]: 0.02
    }
  },
  [MapType.ISLAND_PLATES]: {
    name: 'Island Plates',
    description: 'Mix of small-to-medium islands.',
    terrainDistribution: {
      [TerrainType.OCEAN]: 0.70,
      [TerrainType.COAST]: 0.08,
      [TerrainType.PLAINS]: 0.10,
      [TerrainType.FOREST]: 0.05,
      [TerrainType.HILLS]: 0.03,
      [TerrainType.MOUNTAINS]: 0.02,
      [TerrainType.JUNGLE]: 0.02
    }
  },
  [MapType.HIGHLANDS]: {
    name: 'Highlands',
    description: 'Mostly hills and mountains. Few seas.',
    terrainDistribution: {
      [TerrainType.OCEAN]: 0.25,
      [TerrainType.PLAINS]: 0.10,
      [TerrainType.HILLS]: 0.30,
      [TerrainType.MOUNTAINS]: 0.25,
      [TerrainType.TUNDRA]: 0.10
    }
  },
  [MapType.LAKES]: {
    name: 'Lakes',
    description: 'Tons of small inland lakes.',
    terrainDistribution: {
      [TerrainType.OCEAN]: 0.10,
      [TerrainType.COAST]: 0.20,
      [TerrainType.PLAINS]: 0.30,
      [TerrainType.FOREST]: 0.20,
      [TerrainType.HILLS]: 0.10,
      [TerrainType.MARSH]: 0.10
    }
  },
  [MapType.DRY]: {
    name: 'Dry',
    description: 'Arid terrain, with lots of deserts.',
    terrainDistribution: {
      [TerrainType.OCEAN]: 0.30,
      [TerrainType.PLAINS]: 0.15,
      [TerrainType.DESERT]: 0.40,
      [TerrainType.HILLS]: 0.10,
      [TerrainType.MOUNTAINS]: 0.05
    }
  }
};

// Default map type
export const defaultMapType = MapType.CONTINENTS;

// Map generation parameters for different map types
export const mapGenerationParams = {
  [MapType.CONTINENTS]: {
    continentCount: 5,
    continentSize: 0.2,
    noiseScale: 0.5,
    oceanLevel: 0.4
  },
  [MapType.PANGAEA]: {
    continentCount: 1,
    continentSize: 0.6,
    noiseScale: 0.6,
    oceanLevel: 0.35
  },
  [MapType.FRACTAL]: {
    fractalLayers: 5,
    fractalRoughness: 0.7,
    noiseScale: 0.4,
    oceanLevel: 0.45
  },
  [MapType.ARCHIPELAGO]: {
    islandCount: 50,
    islandSizeVariance: 0.3,
    noiseScale: 0.8,
    oceanLevel: 0.6
  },
  [MapType.ISLAND_PLATES]: {
    plateCount: 12,
    plateSizeVariance: 0.5,
    noiseScale: 0.6,
    oceanLevel: 0.5
  },
  [MapType.HIGHLANDS]: {
    mountainFrequency: 0.7,
    plateHeight: 0.8,
    noiseScale: 0.4,
    oceanLevel: 0.2
  },
  [MapType.LAKES]: {
    lakeFrequency: 0.8,
    lakeSize: 0.3,
    noiseScale: 0.7,
    oceanLevel: 0.4
  },
  [MapType.DRY]: {
    desertRatio: 0.7,
    noiseScale: 0.5,
    oceanLevel: 0.25,
    temperatureOffset: 0.3
  }
};

// Get map generation parameters based on map type
export function getMapParameters(mapType) {
  return mapGenerationParams[mapType] || mapGenerationParams[defaultMapType];
}

// Placeholder for future implementation of map generation algorithms
export function generateMapTerrain(mapType, pointPosition) {
  // This will be implemented later with more sophisticated algorithms
  // For now, returns the default terrain determination
  return null; // Returning null means use the default algorithm
} 