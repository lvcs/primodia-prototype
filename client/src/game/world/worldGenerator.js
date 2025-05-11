import * as THREE from 'three';
import { generateVoronoiSphere } from './voronoiSphere.js';
import { TerrainType, ResourceType } from './constants.js';
import { debug, error } from '../debug.js';

// Main function to generate the world
export function generateWorld(config) {
  try {
    debug('Starting world generation...');
    
    // Configure the number of cells based on detail level
    const numCells = getNumCellsForDetail(config.detail);
    
    // Create a complete config object
    const worldConfig = {
      ...config,
      numCells
    };
    
    // Generate the world using the Voronoi sphere generator
    debug('Calling Voronoi sphere generator...');
    const worldData = generateVoronoiSphere(worldConfig);
    
    // Validate the world data
    if (!worldData || !worldData.cells || !Array.isArray(worldData.cells)) {
      error('Invalid world data generated:', worldData);
      return {
        hexes: [],
        cells: [],
        config: worldConfig
      };
    }
    
    debug(`Generated world with ${worldData.cells.length} cells`);
    
    return {
      hexes: worldData.cells, // Keep compatibility with existing code
      cells: worldData.cells, // Add cells directly for newer code
      config: worldConfig
    };
  } catch (err) {
    error('Error generating world:', err);
    // Return a minimal valid structure
    return {
      hexes: [],
      cells: [],
      config: config
    };
  }
}

// Map detail level to number of cells
function getNumCellsForDetail(detail) {
  switch (detail) {
    case 0: return 150;
    case 1: return 300;
    case 2: return 500;
    case 3: return 1000;
    case 4: return 2000;
    default: return 500;
  }
}

// Export TerrainType and ResourceType to maintain backward compatibility
export { TerrainType, ResourceType };