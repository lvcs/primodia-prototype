import { generatePlanetGeometryGroup } from './planetSphereVoronoi.js';
import { TerrainType, ResourceType } from './constants.js'; // For re-exporting
import { debug, error } from '../debug.js';

/**
 * Main function to generate the world.
 * Adapts the game's configuration to what planetSphereVoronoi.js expects.
 * @param {Object} config - From game.js (radius, detail, etc.)
 * @returns {Object} - { meshGroup, cells (placeholder), config }
 */
export function generateWorld(config) {
  try {
    debug('RBG WorldGenerator | Starting world generation. Game Config:', config);

    // Translate game 'detail' to 'numPoints' and add other params expected by RedBlob-style generator
    const numPoints = getNumPointsForDetail(config.detail);
    const planetConfig = {
      radius: config.radius || 10,
      numPoints: numPoints,
      jitter: config.jitter || 0, // Assuming jitter might be added to config later
      algorithmId: config.algorithmId || 1, // Assuming algorithmId might be added
      drawMode: config.drawMode || 'voronoi', // Default to voronoi, or allow config from game
      // waterLevel, mountainLevel etc. will be used internally by planetSphereVoronoi for terrain later
    };

    debug('RBG WorldGenerator | Calling generatePlanetGeometryGroup with:', planetConfig);
    const planetAssets = generatePlanetGeometryGroup(planetConfig);

    if (!planetAssets || !planetAssets.meshGroup) {
      error('RBG WorldGenerator | Failed to get meshGroup from generatePlanetGeometryGroup');
      return { meshGroup: new THREE.Group(), cells: [], hexes: [], config: planetConfig };
    }

    // Pass through the generated assets. 'cells' will be a placeholder from planetSphereVoronoi for now.
    return {
      meshGroup: planetAssets.meshGroup,
      cells: planetAssets.cells,       // Placeholder from planetSphereVoronoi initially
      hexes: planetAssets.cells,       // For backward compatibility in game.js
      config: planetAssets.config,     // Config used by the generator
      // We might want to add back uniqueWorldVertices or other data here later from planetAssets
    };

  } catch (err) {
    error('RBG WorldGenerator | CRITICAL ERROR:', err);
    return { meshGroup: new THREE.Group(), cells: [], hexes: [], config };
  }
}

function getNumPointsForDetail(detail) {
  // This mapping can be adjusted based on performance and desired visual density
  switch (detail) {
    case 0: return 100;  // Low
    case 1: return 250;
    case 2: return 500;  // Default like before
    case 3: return 1000;
    case 4: return 2000; // High
    default: return 500;
  }
}

export { TerrainType, ResourceType }; // Re-export for compatibility 