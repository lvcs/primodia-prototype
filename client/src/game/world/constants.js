/**
 * Constants for the world generation
 * This file contains all the constants used in the world generation process.
 */

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

// Terrain colors
export const terrainColors = {
  [TerrainType.OCEAN]: 0x1a75b0,
  [TerrainType.PLAINS]: 0x91de6c,
  [TerrainType.FOREST]: 0x2e8b57,
  [TerrainType.HILLS]: 0xa0744e,
  [TerrainType.MOUNTAINS]: 0x8d8d8d,
  [TerrainType.DESERT]: 0xe8c17d,
  [TerrainType.TUNDRA]: 0xd9edee
};

// Resource markers
export const resourceMarkers = {
  [ResourceType.GRAIN]: { color: 0xffff00, symbol: '🌾' },
  [ResourceType.LIVESTOCK]: { color: 0xcd853f, symbol: '🐄' },
  [ResourceType.WOOD]: { color: 0x8b4513, symbol: '🌲' },
  [ResourceType.STONE]: { color: 0x696969, symbol: '⛰️' },
  [ResourceType.IRON]: { color: 0x708090, symbol: '⚒️' },
  [ResourceType.GOLD]: { color: 0xffd700, symbol: '💰' },
  [ResourceType.OIL]: { color: 0x000000, symbol: '🛢️' }
};

// This file has been split into terrain.js and resources.js.
// Please import from './terrain.js' or './resources.js' as appropriate. 