// Centralized random number generator for the game
// Provides deterministic random sequences based on a seed

function SeedableRandom(seed) {
  let numericSeed;
  if (typeof seed === 'string') {
    numericSeed = Array.from(seed).reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0);
  } else if (typeof seed === 'number') {
    numericSeed = seed;
  } else {
    numericSeed = 19831108;
  }

  numericSeed = Math.abs(Math.floor(numericSeed));
  const initialSeed = numericSeed === 0 ? 19831108 : numericSeed;
  let state = initialSeed;

  function nextInt32() {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  function nextFloat() {
    return nextInt32() / 0x100000000;
  }

  function nextInt(min, max) {
    return Math.floor(nextFloat() * (max - min + 1)) + min;
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = nextInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  return {
    get seed() {
      return initialSeed;
    },
    nextFloat,
    nextInt,
    shuffleArray,
  };
}

function generateSeed() {
  return String(Date.now());
}

function createRandomService() {
  let prng = null;
  let currentSeed;

  function initialize(seed = generateSeed()) {
    prng = SeedableRandom(seed);
    currentSeed = seed;
  }

  function ensureInitialized() {
    if (!prng) {
      initialize();
    }
  }

  return {
    get prng() {
      return prng;
    },
    set prng(value) {
      prng = value;
    },
    initialize,
    nextFloat() {
      ensureInitialized();
      return prng.nextFloat();
    },
    nextInt(min, max) {
      ensureInitialized();
      return prng.nextInt(min, max);
    },
    shuffleArray(array) {
      ensureInitialized();
      prng.shuffleArray(array);
    },
    getCurrentSeed() {
      return currentSeed;
    },
  };
}

const Random = createRandomService();

export { SeedableRandom, generateSeed, createRandomService };
export default Random;
