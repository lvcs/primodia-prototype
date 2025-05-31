// Techtonics Feature API
export { generatePlates } from './platesGenerator.js';
export { default as Plate } from './Plate.js';

/**
 * Convert hex color to RGB array with values 0-1
 * @param {number} hex - Hex color value
 * @returns {Array<number>} RGB array with values 0-1
 */
function hexToRgbArray(hex) {
  return [ ((hex>>16)&255)/255, ((hex>>8)&255)/255, (hex&255)/255 ];
}

/**
 * Apply tectonic plate colors to mesh tiles
 * @param {Object} mainMesh - The main planet mesh
 * @param {Object} colorsAttr - The color attribute of the mesh geometry
 * @param {Object} tileIds - The tile ID attribute of the mesh geometry
 */
export function applyPlateColors(mainMesh, colorsAttr, tileIds) {
  const tilePlate = mainMesh.userData.tilePlate || {};
  const plateColors = mainMesh.userData.plateColors || {};

  for(let i = 0; i < tileIds.count; i++) {
    const tileId = tileIds.array[i];
    const plateId = tilePlate[tileId];
    const hex = plateColors[plateId] || 0xffffff;
    const rgb = hexToRgbArray(hex);
    
    colorsAttr.array[i * 3] = rgb[0];
    colorsAttr.array[i * 3 + 1] = rgb[1];
    colorsAttr.array[i * 3 + 2] = rgb[2];
  }
} 