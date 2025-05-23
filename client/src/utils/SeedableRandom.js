// Seedable pseudo-random number generator using the Mulberry32 algorithm.
// This allows for reproducible sequences of random numbers given the same initial seed.

export default class SeedableRandom {
  /**
   * Creates a new instance of the Mulberry32 PRNG.
   * @param {number} seed - The initial seed value. Must be a non-zero integer.
   *                        If 0 is provided, it defaults to a common arbitrary value.
   */
  constructor(seed) {
    // Convert any seed type to a stable number
    let numericSeed;
    
    // If seed is a string, convert it to a numeric hash
    if (typeof seed === 'string') {
      // Simple string hash function
      numericSeed = Array.from(seed).reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0);
      // console.log(`SeedableRandom: Converting string seed "${seed}" to numeric hash ${numericSeed}`);
    } else if (typeof seed === 'number') {
      numericSeed = seed;
    } else {
      // Default seed for undefined or other types
      numericSeed = 19831108;
      // console.warn(`SeedableRandom: Unexpected seed type ${typeof seed}, using default`);
    }
    
    // Ensure seed is a positive integer (Mulberry32 works best with positive integers)
    numericSeed = Math.abs(Math.floor(numericSeed));
    
    // Mulberry32 algorithm requires a non-zero seed.
    // If seed is 0, use a default non-zero value
    this.seed = numericSeed === 0 ? 19831108 : numericSeed;
    
    // console.log(`SeedableRandom: Initialized with final seed value: ${this.seed}`);
  }

  /**
   * Generates the next pseudo-random 32-bit integer in the sequence.
   * This is the core of the Mulberry32 algorithm.
   * @returns {number} A 32-bit unsigned integer.
   */
  _nextInt32() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0);
  }

  /**
   * Generates the next pseudo-random floating-point number between 0 (inclusive) and 1 (exclusive).
   * This is similar to Math.random().
   * @returns {number} A float between 0 and 1.
   */
  nextFloat() {
    return this._nextInt32() / 0x100000000; // Divide by 2^32
  }

  /**
   * Generates the next pseudo-random integer within a specified range [min, max] (inclusive).
   * @param {number} min - The minimum possible integer value.
   * @param {number} max - The maximum possible integer value.
   * @returns {number} An integer between min and max (inclusive).
   */
  nextInt(min, max) {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  /**
   * Shuffles an array in place using the Fisher-Yates algorithm and this PRNG.
   * @param {Array<any>} array - The array to shuffle.
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
  }
} 