// Functional Random Service with Mulberry32 PRNG
// Uses game store for seed persistence and functional programming patterns

import { useGameStore } from '@stores';
import { GAME_DEFAULT_SEED } from '@config';

/**
 * Internal utility: Process and validate the seed value
 * Converts any input into a valid numeric seed for Mulberry32
 * @param {number|string} seed - Raw seed input
 * @returns {number} Processed numeric seed (ready for storage and use)
 * @private
 */
const processSeed = (seed) => {
  let numericSeed;
  
  if (typeof seed === 'string') {
    // Simple string hash function
    numericSeed = Array.from(seed).reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
  } else if (typeof seed === 'number') {
    numericSeed = seed;
  } else {
    numericSeed = GAME_DEFAULT_SEED; // Default seed
  }
  
  // Ensure positive integer, non-zero for Mulberry32
  numericSeed = Math.abs(Math.floor(numericSeed));
  return numericSeed === 0 ? GAME_DEFAULT_SEED : numericSeed;
};

/**
 * Create and store a new seed for the random service
 * This processes the input and stores the ready-to-use seed in gameStore
 * @param {number|string} seed - The seed value (string will be hashed to number)
 * @returns {number} The processed seed that was stored
 */
const createNewSeed = (seed) => {
  console.warn(`createNewSeed called with seed: ${seed}`);
  const { setSeed, getSeed, setPrngSeed } = useGameStore.getState();
  const currentSeed = getSeed();
  const effectiveSeed = currentSeed === undefined ? Date.now() : currentSeed;
  const processedSeed = processSeed(effectiveSeed);
  console.warn(`New seed generated: ${processedSeed}`);
  setSeed(processedSeed);
  setPrngSeed(processedSeed);
  return processedSeed;
};

/**
 * Get the current processed seed from gameStore
 * @returns {number|null} Current processed seed ready for use
 */
const getSeed = () => {
  return useGameStore.getState().getSeed();
};

/**
 * Core Mulberry32 algorithm - generates next 32-bit integer and updates seed
 * @returns {number} 32-bit unsigned integer
 */
const nextInt32 = () => {
  const { getPrngSeed, setPrngSeed } = useGameStore.getState();
  let seed = getPrngSeed();
  
  if (seed === null || seed === undefined) {
    throw Error('Seed not initialized - call createNewSeed() first');
  }
  
  // Mulberry32 algorithm
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const result = ((t ^ (t >>> 14)) >>> 0);
  
  // Update PRNG seed in store for next call
  setPrngSeed(seed);
  
  return result;
};

/**
 * Generate random float between 0 (inclusive) and 1 (exclusive)
 * @returns {number} Float between 0 and 1
 */
const nextFloat = () => {
  return nextInt32() / 0x100000000; // Divide by 2^32
};

/**
 * Generate random integer within range [min, max] (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Integer between min and max
 */
const nextInt = (min, max) => {
  return Math.floor(nextFloat() * (max - min + 1)) + min;
};

/**
 * Shuffle array using Fisher-Yates algorithm (pure function)
 * @param {Array} array - Array to shuffle
 * @returns {Array} New shuffled array
 */
const shuffleArray = (array) => {
  const shuffled = [...array]; // Create copy to maintain purity
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = nextInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};

/**
 * Shuffle array in place (mutating version for compatibility)
 * @param {Array} array - Array to shuffle in place
 */
const shuffleArrayInPlace = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = nextInt(0, i);
    [array[i], array[j]] = [array[j], array[i]];
  }
};

// Export functional API - only public functions
export {
  createNewSeed,
  getSeed,
  nextFloat,
  nextInt,
  shuffleArray,
  shuffleArrayInPlace
}; 