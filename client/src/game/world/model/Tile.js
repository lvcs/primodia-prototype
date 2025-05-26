import * as THREE from 'three';

// All area values are now in km² and all distances in km (1 unit = 1 km, 1 unit^2 = 1 km^2)

export default class Tile {
  /**
   * @param {Object} opts
   * @param {number|string} opts.id unique numeric id
   * @param {import('./TerrainType.js').default} opts.terrain TerrainType instance
   * @param {import('three').Vector3} opts.center Cartesian centroid on unit planet
   * @param {number[]} opts.neighbors adjacent tile ids
   * @param {number} opts.elevation elevation (-1.0 .. +1.0)
   * @param {number} opts.plate tectonic plate id
   * @param {number} opts.moisture moisture level (0..1)
   * @param {number} opts.temperature temperature level (0..1)
   * @param {number} opts.area Default area to 0.0
   */
  constructor({
    id,
    terrain,
    center,
    neighbors = [],
    area = 0.0,
    elevation = 0,
    plate = 0,
    moisture = 0,
    temperature = 0
  }) {
    this.id = id;
    this.terrain = terrain;
    if(center && Array.isArray(center)){
      const len = Math.hypot(center[0], center[1], center[2]) || 1;
      this.center = [ center[0]/len, center[1]/len, center[2]/len ];
    } else {
      this.center = [0,0,0];
    }
    this.name = '';
    this.neighbors = neighbors;
    this.elevation = elevation;
    this.plate = plate;
    this.moisture = moisture;
    this.temperature = temperature;
    this.area = area;
    this.plateId = null;
    this.isOceanConnected = false;
  }

  /**
   * Latitude in radians derived from center.y
   * @returns {number}
   */
  get latRad() {
    return Math.asin(this.center[1]);
  }

  /**
   * Longitude in radians derived from center.x/z
   * @returns {number}
   */
  get lonRad() {
    return Math.atan2(this.center[2], this.center[0]);
  }

  /**
   * Latitude in degrees.
   * @returns {number}
   */
  get lat() {
    return THREE.MathUtils.radToDeg(this.latRad);
  }

  /**
   * Longitude in degrees.
   * @returns {number}
   */
  get lon() {
    return THREE.MathUtils.radToDeg(this.lonRad);
  }
} 