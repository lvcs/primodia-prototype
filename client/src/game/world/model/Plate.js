export default class Plate {
  /**
   * @param {Object} opts
   * @param {number} opts.id plate id
   * @param {number} opts.seedTileId id of tile chosen as seed
   * @param {number[]} opts.center unit-sphere center [x,y,z]
   * @param {number[]} opts.motion unit vector motion direction [x,y,z]
   */
  constructor({ id, seedTileId, center, motion }) {
    this.id = id;
    this.seedTileId = seedTileId;
    this.center = center; // [x,y,z]
    this.motion = motion; // [x,y,z]
  }
} 