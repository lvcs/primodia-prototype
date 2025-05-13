export default class Tile {
  /**
   * @param {Object} opts
   * @param {number|string} opts.id unique numeric id
   * @param {import('./TerrainType.js').default} opts.terrain TerrainType instance
   * @param {number} opts.lat latitude in degrees
   * @param {number} opts.lon longitude in degrees
   * @param {number[]} opts.neighbors adjacent tile ids
   * @param {number} opts.elevation elevation (-1.0 .. +1.0)
   * @param {number} opts.plate tectonic plate id
   * @param {number} opts.moisture moisture level (0..1)
   * @param {number} opts.temperature temperature level (0..1)
   */
  constructor({ id, terrain, lat, lon, neighbors = [], elevation = 0, plate = 0, moisture = 0, temperature = 0 }) {
    this.id = id;
    this.terrain = terrain;
    this.lat = lat;
    this.lon = lon;
    this.name = '';
    this.neighbors = neighbors;
    this.elevation = elevation;
    this.plate = plate;
    this.moisture = moisture;
    this.temperature = temperature;
  }
} 