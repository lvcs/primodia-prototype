import SeedableRandom from '../../utils/SeedableRandom.js';

// Manages a single, globally accessible instance of a seedable pseudo-random number generator (PRNG).
// This ensures that all parts of the game that require randomness can use the same seeded sequence,
// allowing for reproducible game states, especially for map generation.

class RandomServiceController {
  constructor() {
    /** @type {SeedableRandom | null} */
    this.prng = null;
    this._defaultSeed = Date.now(); // Fallback seed if none provided during initialization.
  }

  /**
   * Initializes or re-initializes the PRNG with a specific seed.
   * If no seed is provided, a default seed (based on the current time at service instantiation) is used.
   * @param {number} [seed] - The seed to use. If undefined, the default or previously set seed is used.
   */
  initialize(seed) {
    const effectiveSeed = seed === undefined ? this._defaultSeed : seed;
    this.prng = new SeedableRandom(effectiveSeed);
    this._defaultSeed = effectiveSeed; // Store the seed used for this initialization
    console.log(`RandomService initialized with seed: ${effectiveSeed}`);
  }

  /**
   * Ensures the PRNG is initialized. If not, it initializes with the default seed.
   */
  _ensureInitialized() {
    if (!this.prng) {
      this.initialize(); // Initialize with default seed
    }
  }

  /**
   * Gets the next pseudo-random float from the PRNG.
   * @returns {number} A float between 0 (inclusive) and 1 (exclusive).
   */
  nextFloat() {
    this._ensureInitialized();
    return this.prng.nextFloat();
  }

  /**
   * Gets the next pseudo-random integer from the PRNG within a specified range.
   * @param {number} min - The minimum integer value (inclusive).
   * @param {number} max - The maximum integer value (inclusive).
   * @returns {number} An integer between min and max.
   */
  nextInt(min, max) {
    this._ensureInitialized();
    return this.prng.nextInt(min, max);
  }

  /**
   * Shuffles an array in place using the PRNG.
   * @param {Array<any>} array - The array to shuffle.
   */
  shuffleArray(array) {
    this._ensureInitialized();
    this.prng.shuffleArray(array);
  }

  /**
   * Gets the current seed being used by the PRNG.
   * @returns {number | undefined} The current seed, or undefined if not initialized.
   */
  getCurrentSeed() {
    return this.prng ? this.prng.seed : undefined;
  }
}

// Export a singleton instance of the service.
const RandomService = new RandomServiceController();
export default RandomService; 