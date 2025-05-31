import { planetSettings } from '@game/world/planetVoronoi.js';

/**
 * Calculate RGB color for elevation value
 * @param {number} elevationValue - The elevation value to convert to color
 * @returns {Array<number>} RGB array with values 0-1
 */
export function getElevationColor(elevationValue) {
  const elev = elevationValue + planetSettings.elevationBias;
  const oceanHex = [
    0x0a0033, 0x0b003a, 0x0c0040, 0x0d0047, 0x0e004d, 0x0f0054, 0x10005a, 0x110061, 0x120067, 0x13006e,
    0x140074, 0x15007b, 0x160081, 0x170088, 0x18008e, 0x190095, 0x1a009b, 0x1b00a2, 0x1c00a8, 0x1d00af
  ];
  const landHex = [
    0xfff9e5, 0xfff3cc, 0xffecb2, 0xffe699, 0xffe080, 0xffb366, 0xff804d, 0xff4d33, 0xff1a1a, 0xf21616,
    0xe61212, 0xd90e0e, 0xcc0a0a, 0xbf0606, 0xb20202, 0xa60000, 0x990000, 0x7a0000, 0x5c0000, 0x3d0000
  ];
  
  if (elev < 0) {
    const idx = Math.max(0, Math.min(19, Math.floor((elev + 1) / (1 / 20))));
    const h = oceanHex[idx];
    return [((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255];
  } else {
    const idx = Math.max(0, Math.min(19, Math.floor(elev / (1 / 20))));
    const h = landHex[idx];
    return [((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255];
  }
}

/**
 * Apply elevation colors to mesh tiles
 * @param {Object} mainMesh - The main planet mesh
 * @param {Object} colorsAttr - The color attribute of the mesh geometry
 * @param {Object} tileIds - The tile ID attribute of the mesh geometry
 */
export function applyElevationColors(mainMesh, colorsAttr, tileIds) {
  for(let i = 0; i < tileIds.count; i++) {
    const tileId = tileIds.array[i];
    const elevation = mainMesh.userData.tileElevation ? mainMesh.userData.tileElevation[tileId] : 0;
    const rgb = getElevationColor(elevation);
    
    colorsAttr.array[i * 3] = rgb[0];
    colorsAttr.array[i * 3 + 1] = rgb[1];
    colorsAttr.array[i * 3 + 2] = rgb[2];
  }
} 