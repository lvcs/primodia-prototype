import * as THREE from 'three';
import { MOISTURE_LEVELS, MOISTURE_DEFAULT_COLOR } from './moistureConfig.js';

/**
 * Gets the color for a given normalized moisture value.
 * @param {number} normalizedMoisture - A value between 0 and 1.
 * @returns {number} The hex color code for the moisture level.
 */
export function getColorForMoisture(normalizedMoisture) {
  if (normalizedMoisture === undefined || normalizedMoisture === null || isNaN(normalizedMoisture)) {
    return MOISTURE_DEFAULT_COLOR;
  }
  
  // MOISTURE_LEVELS are already sorted by minMoisture descending
  for (const level of MOISTURE_LEVELS) {
    if (normalizedMoisture >= level.minMoisture) {
      return level.color;
    }
  }
  
  // Fallback to the driest color if somehow no level is matched
  return MOISTURE_LEVELS[MOISTURE_LEVELS.length - 1].color;
}

/**
 * Apply moisture colors to mesh tiles
 * @param {Object} mainMesh - The main planet mesh
 * @param {Object} colorsAttr - The color attribute of the mesh geometry
 * @param {Object} tileIds - The tile ID attribute of the mesh geometry
 */
export function applyMoistureColors(mainMesh, colorsAttr, tileIds) {
  const tempColor = new THREE.Color();
  
  for(let i = 0; i < tileIds.count; i++) {
    const tileId = tileIds.array[i];
    const moisture = mainMesh.userData.tileMoisture ? mainMesh.userData.tileMoisture[tileId] : 0;
    
    tempColor.setHex(getColorForMoisture(moisture));
    const rgb = [tempColor.r, tempColor.g, tempColor.b];
    
    colorsAttr.array[i * 3] = rgb[0];
    colorsAttr.array[i * 3 + 1] = rgb[1];
    colorsAttr.array[i * 3 + 2] = rgb[2];
  }
}

// Re-export configuration for external access if needed
export { MOISTURE_LEVELS } from './moistureConfig.js'; 