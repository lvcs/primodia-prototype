export default class Plate {
  /**
   * @param {Object} opts
   * @param {number} opts.id plate id
   * @param {number} opts.seedTileId id of tile chosen as seed
   * @param {number[]} opts.center unit-planet center [x,y,z]
   * @param {number[]} opts.motion unit vector motion direction [x,y,z]
   * @param {boolean} opts.isOceanic whether the plate is primarily oceanic
   * @param {number} opts.baseElevation the base elevation of the plate
   */
  constructor({ id, seedTileId, center, motion, isOceanic = false, baseElevation = 0.0 }) {
    this.id = id;
    this.seedTileId = seedTileId;
    this.center = center; // [x,y,z]
    this.motion = motion; // [x,y,z]
    this.isOceanic = isOceanic;
    this.baseElevation = baseElevation;
  }
} 