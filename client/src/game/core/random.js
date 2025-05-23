// Centralized random number generator for the game
// Provides deterministic random sequences based on a seed

class SeedableRandom {
  constructor(seed) {
    let numericSeed;
    if (typeof seed === 'string') {
      numericSeed = Array.from(seed).reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
    } else if (typeof seed === 'number') {
      numericSeed = seed;
    } else {
      numericSeed = 19831108;
    }
    numericSeed = Math.abs(Math.floor(numericSeed));
    this.seed = numericSeed === 0 ? 19831108 : numericSeed;
  }

  _nextInt32() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  nextFloat() {
    return this._nextInt32() / 0x100000000;
  }

  nextInt(min, max) {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

function generateSeed() {
  return String(Date.now());
}

const Random = {
  prng: null,
  _currentSeed: undefined,

  initialize(seed = generateSeed()) {
    this.prng = new SeedableRandom(seed);
    this._currentSeed = seed;
  },

  _ensureInitialized() {
    if (!this.prng) {
      this.initialize();
    }
  },

  nextFloat() {
    this._ensureInitialized();
    return this.prng.nextFloat();
  },

  nextInt(min, max) {
    this._ensureInitialized();
    return this.prng.nextInt(min, max);
  },

  shuffleArray(array) {
    this._ensureInitialized();
    this.prng.shuffleArray(array);
  },

  getCurrentSeed() {
    return this._currentSeed;
  },
};

export { SeedableRandom, generateSeed };
export default Random;
