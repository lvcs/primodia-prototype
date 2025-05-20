export default class TerrainType {
  /**
   * @param {Object} opts
   * @param {string} opts.id        Unique string identifier, e.g. 'OCEAN'
   * @param {string} opts.name      Human readable name
   * @param {number} opts.color     Hex color (0xRRGGBB)
   * @param {string|null} [opts.icon=null] Optional icon path / sprite key
   * @param {string} [opts.baseType] Basic classification (e.g., 'WATER', 'LAND', 'ICE', 'SPECIAL')
   * @param {number} [opts.priority] For ordering classification rules (lower numbers checked first)
   * @param {number} [opts.minElevation] Normalized elevation (-1 to 1)
   * @param {number} [opts.maxElevation] Normalized elevation (-1 to 1)
   * @param {number} [opts.minMoisture] Normalized moisture (0 to 1)
   * @param {number} [opts.maxMoisture] Normalized moisture (0 to 1)
   * @param {number} [opts.minTemp] Normalized temperature (0 to 1)
   * @param {number} [opts.maxTemp] Normalized temperature (0 to 1)
   * @param {boolean} [opts.requiresLake] If true, this biome only applies if identified as a lake area
   */
  constructor({
    id, name, color, icon = null,
    baseType = 'LAND',
    priority = 100,
    minElevation = -Infinity, maxElevation = Infinity,
    minMoisture = 0, maxMoisture = 1,
    minTemp = 0, maxTemp = 1,
    requiresLake = false
  }) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.icon = icon;
    this.baseType = baseType;
    this.priority = priority;
    this.minElevation = minElevation;
    this.maxElevation = maxElevation;
    this.minMoisture = minMoisture;
    this.maxMoisture = maxMoisture;
    this.minTemp = minTemp;
    this.maxTemp = maxTemp;
    this.requiresLake = requiresLake;
  }
} 