import { generatePlanetGeometryGroup } from './planetSphereVoronoi.js';

export function generateWorld(config) {
  // For now, just pass through the config to the new generator
  return {
    meshGroup: generatePlanetGeometryGroup(config),
    cells: [], // Placeholder for compatibility
    hexes: [], // Placeholder for compatibility
    config
  };
} 