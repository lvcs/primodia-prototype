export default class MoistureLevel {
  /**
   * @param {Object} opts
   * @param {string} opts.id Unique identifier (e.g., 'ARID') - Optional, can be derived or removed if not used
   * @param {string} opts.name Descriptive name (e.g., 'Arid')
   * @param {number} opts.color Hex color code
   * @param {number} opts.minMoisture The minimum moisture value (inclusive, 0-1) for this level.
   */
  constructor({ id, name, color, minMoisture }) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.minMoisture = minMoisture;
  }
} 