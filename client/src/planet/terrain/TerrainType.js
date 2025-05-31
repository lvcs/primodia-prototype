export default class TerrainType {
  /**
   * @param {Object} opts
   * @param {string} opts.id - Unique string identifier, e.g. 'OCEAN'
   * @param {string} opts.name - Human readable name
   * @param {number|Object} opts.color - Color definition (hex number or object with variants)
   * @param {string} opts.baseType - Base terrain category: 'WATER', 'LAND', 'ICE'
   * @param {number} opts.priority - Priority for terrain classification (lower = higher priority)
   * @param {number} [opts.minElevation] - Minimum elevation requirement
   * @param {number} [opts.maxElevation] - Maximum elevation requirement
   * @param {number} [opts.minTemp] - Minimum temperature requirement (0-1)
   * @param {number} [opts.maxTemp] - Maximum temperature requirement (0-1)
   * @param {number} [opts.minMoisture] - Minimum moisture requirement (0-1)
   * @param {number} [opts.maxMoisture] - Maximum moisture requirement (0-1)
   * @param {boolean} [opts.requiresLake] - Whether this terrain requires lake proximity
   */
  constructor({
    id,
    name,
    color,
    baseType,
    priority,
    minElevation = -Infinity,
    maxElevation = Infinity,
    minTemp = 0,
    maxTemp = 1,
    minMoisture = 0,
    maxMoisture = 1,
    requiresLake = false
  }) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.baseType = baseType;
    this.priority = priority;
    this.minElevation = minElevation;
    this.maxElevation = maxElevation;
    this.minTemp = minTemp;
    this.maxTemp = maxTemp;
    this.minMoisture = minMoisture;
    this.maxMoisture = maxMoisture;
    this.requiresLake = requiresLake;
  }

  /**
   * Check if this terrain type matches the given conditions
   * @param {Object} conditions
   * @param {number} conditions.elevation - Elevation value
   * @param {number} conditions.temperature - Temperature value (0-1)
   * @param {number} conditions.moisture - Moisture value (0-1)
   * @param {boolean} [conditions.hasLake] - Whether tile has lake proximity
   * @returns {boolean}
   */
  matches({ elevation, temperature, moisture, hasLake = false }) {
    // Check elevation bounds
    if (elevation < this.minElevation || elevation > this.maxElevation) {
      return false;
    }

    // Check temperature bounds
    if (temperature < this.minTemp || temperature > this.maxTemp) {
      return false;
    }

    // Check moisture bounds
    if (moisture < this.minMoisture || moisture > this.maxMoisture) {
      return false;
    }

    // Check lake requirement
    if (this.requiresLake && !hasLake) {
      return false;
    }

    return true;
  }
} 