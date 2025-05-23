import { describe, it, expect, beforeEach, vi } from 'vitest';
import RandomService from '@/game/core/RandomService';

// Mock the SeedableRandom class
vi.mock('@/utils/SeedableRandom', () => {
  return {
    default: class MockSeedableRandom {
      constructor(seed) {
        this.seed = seed;
        this.callCount = 0;
      }

      nextFloat() {
        this.callCount++;
        // Return predictable values for testing
        return (this.callCount * 0.1) % 1;
      }

      nextInt(min, max) {
        const range = max - min + 1;
        return min + Math.floor(this.nextFloat() * range);
      }

      shuffleArray(array) {
        // Simple mock shuffle - just reverse the array
        array.reverse();
      }
    }
  };
});

describe('RandomService', () => {
  beforeEach(() => {
    // Reset the service state before each test
    RandomService.prng = null;
  });

  describe('Initialization', () => {
    it('should initialize with a seed', () => {
      RandomService.initialize('test-seed');
      
      expect(RandomService.prng).toBeTruthy();
      expect(RandomService.prng.seed).toBe('test-seed');
    });

    it('should use default seed when initialized without parameter', () => {
      RandomService.initialize();
      
      expect(RandomService.prng).toBeTruthy();
      expect(RandomService.prng.seed).toBeTruthy();
    });

    it('should handle numeric seeds', () => {
      RandomService.initialize(12345);
      
      expect(RandomService.prng).toBeTruthy();
      expect(RandomService.prng.seed).toBe(12345);
    });

    it('should replace existing PRNG when reinitialized', () => {
      RandomService.initialize('seed1');
      const firstPrng = RandomService.prng;
      
      RandomService.initialize('seed2');
      const secondPrng = RandomService.prng;
      
      expect(secondPrng).not.toBe(firstPrng);
      expect(secondPrng.seed).toBe('seed2');
    });
  });

  describe('Auto-initialization', () => {
    it('should auto-initialize when calling nextFloat without explicit init', () => {
      expect(RandomService.prng).toBeNull();
      
      const result = RandomService.nextFloat();
      
      expect(RandomService.prng).toBeTruthy();
      expect(typeof result).toBe('number');
    });

    it('should auto-initialize when calling nextInt without explicit init', () => {
      expect(RandomService.prng).toBeNull();
      
      const result = RandomService.nextInt(1, 10);
      
      expect(RandomService.prng).toBeTruthy();
      expect(typeof result).toBe('number');
    });

    it('should auto-initialize when calling shuffleArray without explicit init', () => {
      expect(RandomService.prng).toBeNull();
      
      const array = [1, 2, 3, 4, 5];
      RandomService.shuffleArray(array);
      
      expect(RandomService.prng).toBeTruthy();
      expect(array).not.toEqual([1, 2, 3, 4, 5]); // Should be modified
    });
  });

  describe('Random Number Generation', () => {
    beforeEach(() => {
      RandomService.initialize('consistent-seed');
    });

    it('should generate float values', () => {
      const value1 = RandomService.nextFloat();
      const value2 = RandomService.nextFloat();
      
      expect(typeof value1).toBe('number');
      expect(typeof value2).toBe('number');
      expect(value1).not.toBe(value2); // Should be different due to mock implementation
    });

    it('should generate integer values in range', () => {
      const value1 = RandomService.nextInt(1, 6);
      const value2 = RandomService.nextInt(10, 20);
      
      expect(Number.isInteger(value1)).toBe(true);
      expect(Number.isInteger(value2)).toBe(true);
      expect(value1).toBeGreaterThanOrEqual(1);
      expect(value1).toBeLessThanOrEqual(6);
      expect(value2).toBeGreaterThanOrEqual(10);
      expect(value2).toBeLessThanOrEqual(20);
    });

    it('should shuffle arrays in place', () => {
      const original = [1, 2, 3, 4, 5];
      const array = [...original];
      
      RandomService.shuffleArray(array);
      
      expect(array).toHaveLength(original.length);
      expect(array).not.toEqual(original); // Should be different due to mock shuffle
      expect(array.sort()).toEqual(original.sort()); // Should contain same elements
    });

    it('should be consistent with same seed', () => {
      RandomService.initialize('test-seed');
      const sequence1 = [
        RandomService.nextFloat(),
        RandomService.nextFloat(),
        RandomService.nextFloat()
      ];
      
      RandomService.initialize('test-seed');
      const sequence2 = [
        RandomService.nextFloat(),
        RandomService.nextFloat(),
        RandomService.nextFloat()
      ];
      
      expect(sequence1).toEqual(sequence2);
    });

    it('should produce different sequences with different seeds', () => {
      RandomService.initialize('seed-a');
      const sequenceA = [
        RandomService.nextFloat(),
        RandomService.nextFloat()
      ];
      
      RandomService.initialize('seed-b');
      const sequenceB = [
        RandomService.nextFloat(),
        RandomService.nextFloat()
      ];
      
      expect(sequenceA).not.toEqual(sequenceB);
    });
  });

  describe('Current Seed Access', () => {
    it('should return current seed when initialized', () => {
      RandomService.initialize('known-seed');
      
      expect(RandomService.getCurrentSeed()).toBe('known-seed');
    });

    it('should return undefined when not initialized', () => {
      expect(RandomService.getCurrentSeed()).toBeUndefined();
    });
  });

  describe('Service Integration', () => {
    it('should handle multiple operations in sequence', () => {
      RandomService.initialize(42);
      
      const float1 = RandomService.nextFloat();
      const int1 = RandomService.nextInt(1, 100);
      const array = [1, 2, 3, 4];
      RandomService.shuffleArray(array);
      const float2 = RandomService.nextFloat();
      
      expect(typeof float1).toBe('number');
      expect(typeof int1).toBe('number');
      expect(typeof float2).toBe('number');
      expect(array).toHaveLength(4);
    });

    it('should maintain state across calls', () => {
      RandomService.initialize('state-test');
      
      const firstCall = RandomService.nextFloat();
      const secondCall = RandomService.nextFloat();
      const thirdCall = RandomService.nextFloat();
      
      // Due to our mock implementation, each call should increment
      expect(firstCall).toBe(0.1);
      expect(secondCall).toBe(0.2);
      expect(thirdCall).toBe(0.3);
    });

    it('should handle edge cases gracefully', () => {
      RandomService.initialize('edge-test');
      
      // Test edge case integer ranges
      const singleValue = RandomService.nextInt(5, 5);
      expect(singleValue).toBe(5);
      
      // Test empty array shuffle
      const emptyArray = [];
      RandomService.shuffleArray(emptyArray);
      expect(emptyArray).toEqual([]);
      
      // Test single element array shuffle
      const singleArray = [42];
      RandomService.shuffleArray(singleArray);
      expect(singleArray).toEqual([42]);
    });
  });

  describe('World Generation Integration Scenarios', () => {
    it('should support world generation workflow', () => {
      // Simulate a typical world generation flow
      RandomService.initialize('world-gen-test');
      
      // Simulate plate generation
      const numPlates = RandomService.nextInt(4, 12);
      expect(numPlates).toBeGreaterThanOrEqual(4);
      expect(numPlates).toBeLessThanOrEqual(12);
      
      // Simulate tile assignment
      const tileIds = [1, 2, 3, 4, 5, 6, 7, 8];
      RandomService.shuffleArray(tileIds);
      expect(tileIds).toHaveLength(8);
      
      // Simulate terrain noise
      const terrainNoise = Array.from({ length: 5 }, () => RandomService.nextFloat());
      expect(terrainNoise).toHaveLength(5);
      terrainNoise.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      });
    });

    it('should provide reproducible world generation', () => {
      const worldSeed = 'reproducible-world';
      
      // Generate world data first time
      RandomService.initialize(worldSeed);
      const firstGeneration = {
        plateCount: RandomService.nextInt(6, 10),
        terrainValues: Array.from({ length: 3 }, () => RandomService.nextFloat()),
        shuffledIds: [1, 2, 3, 4]
      };
      RandomService.shuffleArray(firstGeneration.shuffledIds);
      
      // Generate world data second time with same seed
      RandomService.initialize(worldSeed);
      const secondGeneration = {
        plateCount: RandomService.nextInt(6, 10),
        terrainValues: Array.from({ length: 3 }, () => RandomService.nextFloat()),
        shuffledIds: [1, 2, 3, 4]
      };
      RandomService.shuffleArray(secondGeneration.shuffledIds);
      
      // Should be identical
      expect(firstGeneration.plateCount).toBe(secondGeneration.plateCount);
      expect(firstGeneration.terrainValues).toEqual(secondGeneration.terrainValues);
      expect(firstGeneration.shuffledIds).toEqual(secondGeneration.shuffledIds);
    });
  });
}); 