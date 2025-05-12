export default class TerrainType {
  /**
   * @param {Object} opts
   * @param {string} opts.id        Unique string identifier, e.g. 'OCEAN'
   * @param {string} opts.name      Human readable name
   * @param {number} opts.color     Hex color (0xRRGGBB)
   * @param {string|null} [opts.icon=null] Optional icon path / sprite key
   */
  constructor({ id, name, color, icon = null }) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.icon = icon;
  }
} 