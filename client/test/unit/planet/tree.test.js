import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shouldHaveTrees, addTreesToScene, clearTrees, TreeSystem } from '@/planet/tree';

// Mock Three.js with more complete implementations
vi.mock('three', () => ({
  CylinderGeometry: vi.fn(() => ({
    dispose: vi.fn(),
    attributes: { position: { count: 100 } },
  })),
  ConeGeometry: vi.fn(() => ({
    dispose: vi.fn(),
    attributes: { position: { count: 100 } },
  })),
  MeshLambertMaterial: vi.fn(() => ({
    dispose: vi.fn(),
  })),
  InstancedMesh: vi.fn(() => ({
    count: 0,
    setMatrixAt: vi.fn(),
    instanceMatrix: { needsUpdate: false },
    dispose: vi.fn(),
  })),
  Matrix4: vi.fn(() => ({
    compose: vi.fn(),
    multiply: vi.fn(),
  })),
  Vector3: vi.fn((x = 0, y = 0, z = 0) => ({
    x, y, z,
    set: vi.fn(),
    clone: vi.fn(() => ({ 
      multiplyScalar: vi.fn(() => ({ x: x * 2, y: y * 2, z: z * 2 })), 
      add: vi.fn(), 
      normalize: vi.fn(() => ({ x: x || 1, y: y || 0, z: z || 0 })) 
    })),
    normalize: vi.fn(function() { return this; }),
    multiplyScalar: vi.fn(function() { return this; }),
    add: vi.fn(function() { return this; }),
    cross: vi.fn(function() { return this; }),
    crossVectors: vi.fn(function() { return this; }),
  })),
  Quaternion: vi.fn(() => ({
    setFromUnitVectors: vi.fn(),
  })),
}));

// Mock scene store
vi.mock('@stores', () => ({
  useSceneStore: vi.fn(() => ({
    getState: () => ({
      getScene: () => ({
        add: vi.fn(),
        remove: vi.fn(),
      }),
    }),
  })),
}));

describe('Tree System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('shouldHaveTrees', () => {
    it('should return true for forest terrains', () => {
      expect(shouldHaveTrees('FOREST')).toBe(true);
      expect(shouldHaveTrees('TAIGA')).toBe(true);
      expect(shouldHaveTrees('JUNGLE')).toBe(true);
      expect(shouldHaveTrees('RAINFOREST')).toBe(true);
    });

    it('should return false for non-forest terrains', () => {
      expect(shouldHaveTrees('OCEAN')).toBe(false);
      expect(shouldHaveTrees('DESERT')).toBe(false);
      expect(shouldHaveTrees('SNOW')).toBe(false);
      expect(shouldHaveTrees('GRASSLAND')).toBe(false);
    });

    it('should handle undefined terrain', () => {
      expect(shouldHaveTrees(undefined)).toBe(false);
      expect(shouldHaveTrees(null)).toBe(false);
    });
  });

  describe('addTreesToScene', () => {
    const mockTiles = [
      {
        id: 1,
        terrainId: 'FOREST',
        center: { x: 1000, y: 0, z: 0 },
        area: 100000,
      },
      {
        id: 2,
        terrainId: 'TAIGA',
        center: { x: 0, y: 1000, z: 0 },
        area: 50000,
      },
    ];

    it('should handle empty tile array', () => {
      const result = addTreesToScene([]);
      expect(result.treeSystem).toBeNull();
      expect(result.stats).toBeNull();
    });

    it('should filter and process forest tiles', () => {
      const mixedTiles = [
        ...mockTiles,
        {
          id: 3,
          terrainId: 'OCEAN',
          center: { x: 0, y: 0, z: 1000 },
          area: 200000,
        },
      ];

      const result = addTreesToScene(mixedTiles);
      expect(result.treeSystem).toBeDefined();
      expect(result.stats).toBeDefined();
    });

    it('should calculate tree count based on area and density', () => {
      const result = addTreesToScene(mockTiles);
      expect(result.stats.totalTrees).toBeGreaterThan(0);
    });
  });

  describe('TreeSystem', () => {
    it('should initialize with estimated tree count', () => {
      TreeSystem.initialize(1000);
      expect(TreeSystem.isInitialized).toBe(true);
    });

    it('should dispose resources properly', () => {
      TreeSystem.initialize(100);
      TreeSystem.dispose();
      expect(TreeSystem.isInitialized).toBe(false);
    });

    it('should calculate memory usage', () => {
      TreeSystem.initialize(500);
      const memoryUsage = TreeSystem.estimateMemoryUsage();
      expect(typeof memoryUsage).toBe('number');
      expect(memoryUsage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearTrees', () => {
    it('should clear trees without throwing', () => {
      expect(() => clearTrees()).not.toThrow();
    });
  });
}); 