import MoistureLevel from '../model/MoistureLevel.js';

// Define moisture levels with corresponding colors and names
// These should be ordered by minMoisture DESCENDING for the getClosestMoistureLevel logic to work correctly.
export const MoistureLevels = [
  new MoistureLevel({ minMoisture: 0.9, color: 0x000030, name: 'Saturated' }),
  new MoistureLevel({ minMoisture: 0.8, color: 0x0C0F6E, name: 'Extremely Humid' }),
  new MoistureLevel({ minMoisture: 0.7, color: 0x262EB3, name: 'Very Humid' }),
  new MoistureLevel({ minMoisture: 0.6, color: 0x4551D7, name: 'Humid' }),
  new MoistureLevel({ minMoisture: 0.5, color: 0x6172E6, name: 'Semi-Humid' }),
  new MoistureLevel({ minMoisture: 0.4, color: 0x7E8EEE, name: 'Semi-Arid' }),
  new MoistureLevel({ minMoisture: 0.3, color: 0x98ADE2, name: 'Arid' }),
  new MoistureLevel({ minMoisture: 0.2, color: 0xC6D4F1, name: 'Very Arid' }),
  new MoistureLevel({ minMoisture: 0.1, color: 0xE2EAFD, name: 'Extremely Arid' }),
  new MoistureLevel({ minMoisture: 0.0, color: 0xEDE6BC, name: 'Parched' }) 
];

/**
 * Gets the color for a given normalized moisture value.
 * @param {number} normalizedMoisture - A value between 0 and 1.
 * @returns {number} The hex color code for the moisture level.
 */
export function getColorForMoisture(normalizedMoisture) {
  // console.log(`getColorForMoisture called with: ${normalizedMoisture}`); // DEBUG LINE - Commented out
  if (normalizedMoisture === undefined || normalizedMoisture === null || isNaN(normalizedMoisture)) {
    // console.log(`Moisture undefined/NaN, returning grey.`); // DEBUG LINE - Commented out
    return 0x808080; // Default grey for undefined or invalid moisture
  }
  // MoistureLevels are already sorted by minMoisture descending
  for (const level of MoistureLevels) {
    if (normalizedMoisture >= level.minMoisture) {
      // console.log(`Matched level: ${level.name} (min: ${level.minMoisture}), returning color 0x${level.color.toString(16)}`); // DEBUG LINE - Commented out
      return level.color;
    }
  }
  // Fallback to the driest color if somehow no level is matched (e.g., negative moisture, though it should be clamped)
  // console.log(`No level matched, returning driest color: 0x${MoistureLevels[MoistureLevels.length - 1].color.toString(16)}`); // DEBUG LINE - Commented out
  return MoistureLevels[MoistureLevels.length - 1].color; 
} 