import SeedableRandom from '@utils/SeedableRandom.js'; // Corrected relative path

class RandomServiceController {
  constructor() {
    this.prng = null;
    this._defaultSeed = Date.now();
  }

  initialize(seed) {
    const effectiveSeed = seed === undefined ? this._defaultSeed : seed;
    this.prng = new SeedableRandom(effectiveSeed);
    this._defaultSeed = effectiveSeed;
    // console.log(`RandomService initialized with seed: ${effectiveSeed}`);
  }

  _ensureInitialized() {
    if (!this.prng) {
      this.initialize();
    }
  }

  nextFloat() {
    this._ensureInitialized();
    return this.prng.nextFloat();
  }

  shuffleArray(array) {
    this._ensureInitialized();
    this.prng.shuffleArray(array);
  }

  getCurrentSeed() {
    return this.prng ? this.prng.seed : undefined;
  }
}

const RandomService = new RandomServiceController();
export default RandomService; 