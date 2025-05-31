import * as THREE from 'three';
import { TEMPERATURE_LEVELS, TEMPERATURE_DEFAULT_COLOR } from './temperatureConfig.js';

// Re-export config for external access
export { TEMPERATURE_LEVELS, TEMPERATURE_DEFAULT_COLOR };

/**
 * Gets the color for a given normalized temperature value.
 * @param {number} normalizedTemp - Temperature value between 0 (coldest) and 1 (hottest).
 * @returns {number} Hex color code.
 */
export function getColorForTemperature(normalizedTemp) {
  for (const level of TEMPERATURE_LEVELS) {
    if (normalizedTemp < level.threshold) {
      return level.color;
    }
  }
  return TEMPERATURE_LEVELS[TEMPERATURE_LEVELS.length - 1].color; // Fallback to the hottest color if somehow above all thresholds
}

/**
 * Apply temperature colors to mesh tiles
 * @param {Object} mainMesh - The main planet mesh
 * @param {Object} colorsAttr - The color attribute of the mesh geometry
 * @param {Object} tileIds - The tile ID attribute of the mesh geometry
 * @param {Object} worldData - The world data containing planet information
 */
export function applyTemperatureColors(mainMesh, colorsAttr, tileIds, worldData) {
  const tempColor = new THREE.Color();
  
  for(let i = 0; i < tileIds.count; i++) {
    const tileId = tileIds.array[i];
    const tileData = worldData?.planet?.getTile(tileId);
    
    if (tileData && tileData.temperature !== undefined) {
      tempColor.setHex(getColorForTemperature(tileData.temperature));
      const rgb = [tempColor.r, tempColor.g, tempColor.b];
      
      colorsAttr.array[i * 3] = rgb[0];
      colorsAttr.array[i * 3 + 1] = rgb[1];
      colorsAttr.array[i * 3 + 2] = rgb[2];
    } else {
      // Default gray color for missing temperature data
      tempColor.setHex(TEMPERATURE_DEFAULT_COLOR);
      const rgb = [tempColor.r, tempColor.g, tempColor.b];
      
      colorsAttr.array[i * 3] = rgb[0];
      colorsAttr.array[i * 3 + 1] = rgb[1];
      colorsAttr.array[i * 3 + 2] = rgb[2];
    }
  }
} 