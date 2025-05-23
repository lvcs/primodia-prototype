import { describe, it, expect, beforeEach } from 'vitest';
import { SeedableRandom } from '@/game/core/random';

describe('SeedableRandom', () => {
  let rng;

  describe('Constructor and Seed Handling', () => {
    it('should handle numeric seeds', () => {
      rng = new SeedableRandom(12345);
      expect(rng.seed).toBe(12345);
    });

    it('should handle string seeds consistently', () => {
      const rng1 = new SeedableRandom('test-seed');
      const rng2 = new SeedableRandom('test-seed');
      expect(rng1.seed).toBe(rng2.seed);
    });

    it('should handle zero seed by using default', () => {
      rng = new SeedableRandom(0);
      expect(rng.seed).toBe(19831108); // Default value
    });

    it('should handle negative seeds by taking absolute value', () => {
      rng = new SeedableRandom(-12345);
      expect(rng.seed).toBe(12345);
    });

    it('should handle undefined seed with default', () => {
      rng = new SeedableRandom(undefined);
      expect(rng.seed).toBe(19831108);
    });
  });

  describe('Deterministic Generation', () => {
    beforeEach(() => {
      rng = new SeedableRandom(42);
    });

    it('should generate deterministic float sequences', () => {
      const sequence1 = Array.from({ length: 10 }, () => rng.nextFloat());
      
      // Reset with same seed
      rng = new SeedableRandom(42);
      const sequence2 = Array.from({ length: 10 }, () => rng.nextFloat());
      
      expect(sequence1).toEqual(sequence2);
    });

    it('should generate floats in range [0, 1)', () => {
      for (let i = 0; i < 100; i++) {
        const value = rng.nextFloat();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('should generate deterministic integer sequences', () => {
      const sequence1 = Array.from({ length: 10 }, () => rng.nextInt(1, 100));
      
      // Reset with same seed
      rng = new SeedableRandom(42);
      const sequence2 = Array.from({ length: 10 }, () => rng.nextInt(1, 100));
      
      expect(sequence1).toEqual(sequence2);
    });

    it('should generate integers in specified range', () => {
      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(10, 20);
        expect(value).toBeGreaterThanOrEqual(10);
        expect(value).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('Array Shuffling', () => {
    beforeEach(() => {
      rng = new SeedableRandom(123);
    });

    it('should shuffle arrays deterministically', () => {
      const arr1 = [1, 2, 3, 4, 5];
      const arr2 = [1, 2, 3, 4, 5];
      
      rng.shuffleArray(arr1);
      
      // Reset and shuffle again
      rng = new SeedableRandom(123);
      rng.shuffleArray(arr2);
      
      expect(arr1).toEqual(arr2);
    });

    it('should preserve array length', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const originalLength = arr.length;
      
      rng.shuffleArray(arr);
      
      expect(arr).toHaveLength(originalLength);
    });

    it('should preserve all elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const originalElements = [...arr];
      
      rng.shuffleArray(arr);
      
      expect(arr.sort()).toEqual(originalElements.sort());
    });
  });

  describe('Distribution Properties', () => {
    beforeEach(() => {
      rng = new SeedableRandom(999);
    });

    it('should produce reasonably uniform float distribution', () => {
      const samples = Array.from({ length: 10000 }, () => rng.nextFloat());
      const buckets = new Array(10).fill(0);
      
      samples.forEach(value => {
        const bucket = Math.floor(value * 10);
        buckets[Math.min(bucket, 9)]++;
      });
      
      // Each bucket should have roughly 1000 samples (±200 for statistical variance)
      buckets.forEach(count => {
        expect(count).toBeGreaterThan(800);
        expect(count).toBeLessThan(1200);
      });
    });
  });
}); 