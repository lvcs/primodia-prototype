// Unified Random Service with built-in Mulberry32 PRNG
// Combines seedable random generation with singleton service pattern

class RandomServiceController {
  constructor() {
    this._seed = null;
    this._defaultSeed = Date.now();
  }

  /**
   * Initialize the random service with a seed
   * @param {number|string} seed - The seed value
   */
  initialize(seed) {
    const effectiveSeed = seed === undefined ? this._defaultSeed : seed;
    this._seed = this._processSeed(effectiveSeed);
    this._defaultSeed = this._seed;
    // console.log(`RandomService initialized with seed: ${this._seed}`);
  }

  /**
   * Process and validate the seed value
   * @param {number|string} seed - Raw seed input
   * @returns {number} Processed numeric seed
   */
  _processSeed(seed) {
    let numericSeed;
    
    if (typeof seed === 'string') {
      // Simple string hash function
      numericSeed = Array.from(seed).reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0);
    } else if (typeof seed === 'number') {
      numericSeed = seed;
    } else {
      numericSeed = 19831108; // Default seed
    }
    
    // Ensure positive integer, non-zero for Mulberry32
    numericSeed = Math.abs(Math.floor(numericSeed));
    return numericSeed === 0 ? 19831108 : numericSeed;
  }

  _ensureInitialized() {
    if (this._seed === null) {
      this.initialize();
    }
  }

  /**
   * Core Mulberry32 algorithm - generates next 32-bit integer
   * @returns {number} 32-bit unsigned integer
   */
  _nextInt32() {
    let t = (this._seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0);
  }

  /**
   * Generate random float between 0 (inclusive) and 1 (exclusive)
   * @returns {number} Float between 0 and 1
   */
  nextFloat() {
    this._ensureInitialized();
    return this._nextInt32() / 0x100000000; // Divide by 2^32
  }

  /**
   * Generate random integer within range [min, max] (inclusive)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Integer between min and max
   */
  nextInt(min, max) {
    this._ensureInitialized();
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  /**
   * Shuffle array in place using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   */
  shuffleArray(array) {
    this._ensureInitialized();
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Get current seed value
   * @returns {number|undefined} Current seed
   */
  getCurrentSeed() {
    return this._seed;
  }
}

const RandomService = new RandomServiceController();
export default RandomService; 