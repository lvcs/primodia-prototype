export default class Tile {
  /**
   * @param {Object} opts
   * @param {number|string} opts.id unique numeric id
   * @param {import('./TerrainType.js').default} opts.terrain TerrainType instance
   * @param {number} opts.lat latitude in degrees
   * @param {number} opts.lon longitude in degrees
   */
  constructor({ id, terrain, lat, lon }) {
    this.id = id;
    this.terrain = terrain;
    this.lat = lat;
    this.lon = lon;
    this.name = '';
  }
} 