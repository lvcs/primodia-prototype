export default class TemperatureLevel {
  /**
   * @param {Object} opts
   * @param {string} opts.id Unique identifier (e.g., 'VERY_COLD')
   * @param {string} opts.name Descriptive name (e.g., 'Very Cold')
   * @param {number} opts.color Hex color code
   * @param {number} opts.threshold The upper bound (exclusive for next, inclusive for this) of the normalized temperature (0-1) this level represents.
   *                                 For example, if threshold is 0.1, this level applies for temps < 0.1.
   */
  constructor({ id, name, color, threshold }) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.threshold = threshold; // Represents the value UP TO which this color applies
  }
} 