import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createNewSeed, getSeed, nextFloat, nextInt, shuffleArray, shuffleArrayInPlace } from '@utils/random';
import { useGameStore } from '@stores';

// Mock the game store
vi.mock('@stores', () => ({
  useGameStore: {
    getState: vi.fn(() => ({
      getSeed: vi.fn(),
      setSeed: vi.fn(),
      getPrngSeed: vi.fn(),
      setPrngSeed: vi.fn()
    }))
  }
}));

describe('Random Utility Module', () => {
  let mockGameStore;

  beforeEach(() => {
    // Reset mocks before each test
    mockGameStore = {
      getSeed: vi.fn(),
      setSeed: vi.fn(),
      getPrngSeed: vi.fn(),
      setPrngSeed: vi.fn()
    };
    useGameStore.getState.mockReturnValue(mockGameStore);
  });

  describe('Seed Management', () => {
    it('should create and store a new seed', () => {
      mockGameStore.getSeed.mockReturnValue(undefined);
      mockGameStore.setPrngSeed.mockImplementation(() => {});
      mockGameStore.setSeed.mockImplementation(() => {});
      
      const result = createNewSeed(12345);
      
      expect(mockGameStore.setSeed).toHaveBeenCalled();
      expect(mockGameStore.setPrngSeed).toHaveBeenCalled();
      expect(typeof result).toBe('number');
    });

    it('should get current seed from store', () => {
      const testSeed = 54321;
      mockGameStore.getSeed.mockReturnValue(testSeed);
      
      const result = getSeed();
      
      expect(result).toBe(testSeed);
      expect(mockGameStore.getSeed).toHaveBeenCalled();
    });

    it('should handle string seeds by converting to numeric', () => {
      mockGameStore.getSeed.mockReturnValue(undefined);
      mockGameStore.setPrngSeed.mockImplementation(() => {});
      mockGameStore.setSeed.mockImplementation(() => {});
      
      const result = createNewSeed('test-seed');
      
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
      expect(mockGameStore.setSeed).toHaveBeenCalledWith(result);
    });
  });

  describe('Random Number Generation', () => {
    beforeEach(() => {
      // Setup a mock PRNG seed for testing
      let mockSeed = 123456789;
      mockGameStore.getPrngSeed.mockImplementation(() => mockSeed);
      mockGameStore.setPrngSeed.mockImplementation((newSeed) => {
        mockSeed = newSeed;
      });
    });

    it('should generate float values between 0 and 1', () => {
      const value1 = nextFloat();
      const value2 = nextFloat();
      
      expect(typeof value1).toBe('number');
      expect(typeof value2).toBe('number');
      expect(value1).toBeGreaterThanOrEqual(0);
      expect(value1).toBeLessThan(1);
      expect(value2).toBeGreaterThanOrEqual(0);
      expect(value2).toBeLessThan(1);
      expect(value1).not.toBe(value2); // Should be different due to PRNG state change
    });

    it('should generate integer values in range', () => {
      const value1 = nextInt(1, 6);
      const value2 = nextInt(10, 20);
      
      expect(Number.isInteger(value1)).toBe(true);
      expect(Number.isInteger(value2)).toBe(true);
      expect(value1).toBeGreaterThanOrEqual(1);
      expect(value1).toBeLessThanOrEqual(6);
      expect(value2).toBeGreaterThanOrEqual(10);
      expect(value2).toBeLessThanOrEqual(20);
    });

    it('should throw error when PRNG not initialized', () => {
      mockGameStore.getPrngSeed.mockReturnValue(null);
      
      expect(() => nextFloat()).toThrow('Seed not initialized - call createNewSeed() first');
    });

    it('should handle edge cases for integer generation', () => {
      const sameValue = nextInt(5, 5);
      expect(sameValue).toBe(5);
      
      const zeroRange = nextInt(0, 0);
      expect(zeroRange).toBe(0);
    });
  });

  describe('Array Shuffling', () => {
    beforeEach(() => {
      // Setup a working PRNG state
      let mockSeed = 987654321;
      mockGameStore.getPrngSeed.mockImplementation(() => mockSeed);
      mockGameStore.setPrngSeed.mockImplementation((newSeed) => {
        mockSeed = newSeed;
      });
    });

    it('should shuffle arrays in place', () => {
      const original = [1, 2, 3, 4, 5];
      const array = [...original];
      
      shuffleArrayInPlace(array);
      
      expect(array).toHaveLength(original.length);
      // Check that it contains the same elements
      expect(array.sort()).toEqual(original.sort());
    });

    it('should shuffle arrays and return new array', () => {
      const original = [1, 2, 3, 4, 5];
      
      const shuffled = shuffleArray(original);
      
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled).not.toBe(original); // Should be a new array
      expect(shuffled.sort()).toEqual(original.sort());
      expect(original).toEqual([1, 2, 3, 4, 5]); // Original should be unchanged
    });

    it('should handle empty arrays', () => {
      const emptyArray = [];
      const shuffledEmpty = shuffleArray(emptyArray);
      
      expect(shuffledEmpty).toEqual([]);
      expect(shuffledEmpty).not.toBe(emptyArray);
    });

    it('should handle single element arrays', () => {
      const singleElement = [42];
      const shuffledSingle = shuffleArray(singleElement);
      
      expect(shuffledSingle).toEqual([42]);
      expect(shuffledSingle).not.toBe(singleElement);
    });
  });

  describe('Consistency and Reproducibility', () => {
    it('should be consistent with same seed', () => {
      // Setup consistent seed
      let mockSeed = 12345;
      mockGameStore.getPrngSeed.mockImplementation(() => mockSeed);
      mockGameStore.setPrngSeed.mockImplementation((newSeed) => {
        mockSeed = newSeed;
      });
      
      // Reset seed to same value for both sequences
      mockSeed = 12345;
      const sequence1 = [nextFloat(), nextFloat(), nextFloat()];
      
      mockSeed = 12345;
      const sequence2 = [nextFloat(), nextFloat(), nextFloat()];
      
      expect(sequence1).toEqual(sequence2);
    });

    it('should produce different sequences with different seeds', () => {
      let mockSeed1 = 12345;
      let mockSeed2 = 54321;
      
      // First sequence
      mockGameStore.getPrngSeed.mockImplementation(() => mockSeed1);
      mockGameStore.setPrngSeed.mockImplementation((newSeed) => {
        mockSeed1 = newSeed;
      });
      const sequence1 = [nextFloat(), nextFloat()];
      
      // Second sequence with different seed
      mockGameStore.getPrngSeed.mockImplementation(() => mockSeed2);
      mockGameStore.setPrngSeed.mockImplementation((newSeed) => {
        mockSeed2 = newSeed;
      });
      const sequence2 = [nextFloat(), nextFloat()];
      
      expect(sequence1).not.toEqual(sequence2);
    });
  });

  describe('World Generation Integration Scenarios', () => {
    beforeEach(() => {
      // Setup a working PRNG state
      let mockSeed = 987654321;
      mockGameStore.getPrngSeed.mockImplementation(() => mockSeed);
      mockGameStore.setPrngSeed.mockImplementation((newSeed) => {
        mockSeed = newSeed;
      });
    });

    it('should support world generation workflow', () => {
      // Simulate a typical world generation flow
      createNewSeed('world-gen-test');
      
      // Simulate plate generation
      const numPlates = nextInt(4, 12);
      expect(numPlates).toBeGreaterThanOrEqual(4);
      expect(numPlates).toBeLessThanOrEqual(12);
      
      // Simulate tile assignment
      const tileIds = [1, 2, 3, 4, 5, 6, 7, 8];
      shuffleArrayInPlace(tileIds);
      expect(tileIds).toHaveLength(8);
      
      // Simulate terrain noise
      const terrainNoise = Array.from({ length: 5 }, () => nextFloat());
      expect(terrainNoise).toHaveLength(5);
      terrainNoise.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      });
    });

    it('should provide reproducible world generation', () => {
      const worldSeed = 'reproducible-world';
      
      // Generate world data first time
      createNewSeed(worldSeed);
      
      // Reset to consistent state for first generation
      let mockSeed = 555555;
      mockGameStore.getPrngSeed.mockImplementation(() => mockSeed);
      mockGameStore.setPrngSeed.mockImplementation((newSeed) => {
        mockSeed = newSeed;
      });
      
      const firstGeneration = {
        plateCount: nextInt(6, 10),
        terrainValues: Array.from({ length: 3 }, () => nextFloat()),
        shuffledIds: [1, 2, 3, 4]
      };
      shuffleArrayInPlace(firstGeneration.shuffledIds);
      
      // Reset to same state for second generation
      mockSeed = 555555;
      const secondGeneration = {
        plateCount: nextInt(6, 10),
        terrainValues: Array.from({ length: 3 }, () => nextFloat()),
        shuffledIds: [1, 2, 3, 4]
      };
      shuffleArrayInPlace(secondGeneration.shuffledIds);
      
      // Should be identical
      expect(firstGeneration.plateCount).toBe(secondGeneration.plateCount);
      expect(firstGeneration.terrainValues).toEqual(secondGeneration.terrainValues);
      expect(firstGeneration.shuffledIds).toEqual(secondGeneration.shuffledIds);
    });

    it('should handle complex generation patterns', () => {
      // Test multiple interleaved operations
      const results = [];
      
      for (let i = 0; i < 3; i++) {
        results.push({
          float: nextFloat(),
          int: nextInt(1, 100),
          shuffled: shuffleArray([1, 2, 3])
        });
      }
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.float).toBeGreaterThanOrEqual(0);
        expect(result.float).toBeLessThan(1);
        expect(result.int).toBeGreaterThanOrEqual(1);
        expect(result.int).toBeLessThanOrEqual(100);
        expect(result.shuffled).toHaveLength(3);
        expect(result.shuffled.sort()).toEqual([1, 2, 3]);
      });
    });
  });
}); 