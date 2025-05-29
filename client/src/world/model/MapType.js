export default class MapType {
  /**
   * @param {Object} opts
   * @param {string} opts.id        Unique string identifier, e.g. 'CONTINENTS'
   * @param {string} opts.name      Human readable name
   * @param {string} opts.description Description of the map type
   * @param {Object} opts.terrainDistribution Distribution of terrain types
   */
  constructor({ id, name, description, terrainDistribution }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.terrainDistribution = terrainDistribution;
  }
} 