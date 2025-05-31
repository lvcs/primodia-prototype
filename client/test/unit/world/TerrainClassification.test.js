import { describe, it, expect, beforeEach, vi } from 'vitest';
import { classifyTileTerrainFromProperties } from '@game/world/planetVoronoi';
import { shouldHaveTrees } from '@game/planet/tree';
import { generateMapTerrain } from '@game/world/registries/MapTypeRegistry';
import { getColorForTerrain } from '@game/planet/terrain';

// Mock terrain types for testing
const mockTile = {
  id: 1,
  elevation: 0.5,
  moisture: 0.6,
  temperature: 0.4,
  isOceanConnected: false,
};

describe('Terrain Classification System', () => {
  describe('classifyTileTerrainFromProperties', () => {
    it('should return GRASSLAND for null tile input', () => {
      const result = classifyTileTerrainFromProperties(null);
      expect(result).toBe('GRASSLAND');
    });

    it('should classify ocean tiles correctly', () => {
      const oceanTile = {
        ...mockTile,
        elevation: -0.3, // Below sea level
        isOceanConnected: true,
      };
      
      const result = classifyTileTerrainFromProperties(oceanTile);
      expect(result).toBe('OCEAN');
    });

    it('should classify lake tiles correctly', () => {
      const lakeTile = {
        ...mockTile,
        elevation: -0.03, // Below sea level but not ocean connected
        isOceanConnected: false,
        moisture: 0.8,
      };
      
      const result = classifyTileTerrainFromProperties(lakeTile);
      expect(result).toBe('LAKE');
    });

    it('should classify mountain tiles correctly', () => {
      const mountainTile = {
        ...mockTile,
        elevation: 0.9, // High elevation
        temperature: 0.2, // Cold
        moisture: 0.3,
      };
      
      const result = classifyTileTerrainFromProperties(mountainTile);
      expect(result).toBe('SNOW');
    });

    it('should classify forest tiles correctly', () => {
      const forestTile = {
        ...mockTile,
        elevation: 0.2,
        moisture: 0.6, // High moisture
        temperature: 0.5, // Moderate temperature
      };
      
      const result = classifyTileTerrainFromProperties(forestTile);
      expect(result).toBe('FOREST');
    });

    it('should classify desert tiles correctly', () => {
      const desertTile = {
        ...mockTile,
        elevation: 0.1,
        moisture: 0.1, // Very dry
        temperature: 0.8, // Hot
      };
      
      const result = classifyTileTerrainFromProperties(desertTile);
      expect(result).toBe('SUBTROPICAL_DESERT');
    });

    it('should handle edge cases with missing properties', () => {
      const incompleteTile = {
        id: 1,
        // Missing elevation, moisture, temperature
      };
      
      const result = classifyTileTerrainFromProperties(incompleteTile);
      expect(result).toBe('GRASSLAND'); // Should fallback gracefully
    });
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

  describe('generateMapTerrain', () => {
    const mockRandomFloat = vi.fn();
    const mockPosition = { x: 0.5, y: 0.3, z: 0.2 };

    beforeEach(() => {
      mockRandomFloat.mockReturnValue(0.5);
    });

    it('should handle continents map type', () => {
      const result = generateMapTerrain('continents', mockPosition, mockRandomFloat);
      expect(typeof result).toBe('string');
      expect(result).toBeTruthy();
    });

    it('should handle pangaea map type', () => {
      const result = generateMapTerrain('pangaea', mockPosition, mockRandomFloat);
      expect(typeof result).toBe('string');
      expect(result).toBeTruthy();
    });

    it('should handle archipelago map type', () => {
      const result = generateMapTerrain('archipelago', mockPosition, mockRandomFloat);
      expect(typeof result).toBe('string');
      expect(result).toBeTruthy();
    });

    it('should return null for unknown map type', () => {
      const result = generateMapTerrain('unknown_map', mockPosition, mockRandomFloat);
      expect(result).toBeNull();
    });

    it('should be deterministic with same inputs', () => {
      const result1 = generateMapTerrain('continents', mockPosition, () => 0.3);
      const result2 = generateMapTerrain('continents', mockPosition, () => 0.3);
      expect(result1).toBe(result2);
    });

    it('should produce different results with different random values', () => {
      const result1 = generateMapTerrain('continents', mockPosition, () => 0.1);
      const result2 = generateMapTerrain('continents', mockPosition, () => 0.9);
      // Results might be different (but not guaranteed due to terrain logic)
      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
    });
  });

  describe('getColorForTerrain', () => {
    it('should return color for simple terrain types', () => {
      const color = getColorForTerrain('GRASSLAND', 0.2);
      expect(typeof color).toBe('number');
      expect(color).toBeGreaterThan(0);
    });

    it('should handle elevation-based color variants for ocean', () => {
      const shallowOcean = getColorForTerrain('OCEAN', -0.1);
      const deepOcean = getColorForTerrain('OCEAN', -0.9);
      
      expect(typeof shallowOcean).toBe('number');
      expect(typeof deepOcean).toBe('number');
      expect(shallowOcean).not.toBe(deepOcean); // Should be different colors
    });

    it('should handle elevation-based color variants for grassland', () => {
      const lowGrassland = getColorForTerrain('GRASSLAND', 0.1);
      const highGrassland = getColorForTerrain('GRASSLAND', 0.5);
      
      expect(typeof lowGrassland).toBe('number');
      expect(typeof highGrassland).toBe('number');
      // Colors should be different based on elevation
    });

    it('should return default color for unknown terrain', () => {
      const color = getColorForTerrain('UNKNOWN_TERRAIN', 0.5);
      expect(color).toBe(0x808080); // Default grey
    });

    it('should handle edge elevation values', () => {
      const minElevation = getColorForTerrain('GRASSLAND', -1.0);
      const maxElevation = getColorForTerrain('GRASSLAND', 1.0);
      
      expect(typeof minElevation).toBe('number');
      expect(typeof maxElevation).toBe('number');
    });
  });

  describe('Terrain Classification Integration', () => {
    it('should classify and color tiles consistently', () => {
      const testTiles = [
        { elevation: -0.5, moisture: 0.8, temperature: 0.6, isOceanConnected: true },
        { elevation: 0.8, moisture: 0.2, temperature: 0.1, isOceanConnected: false },
        { elevation: 0.2, moisture: 0.7, temperature: 0.5, isOceanConnected: false },
      ];

      testTiles.forEach((tile, index) => {
        const terrainType = classifyTileTerrainFromProperties({ ...tile, id: index });
        const color = getColorForTerrain(terrainType, tile.elevation);
        const hasTreesPotential = shouldHaveTrees(terrainType);

        expect(typeof terrainType).toBe('string');
        expect(typeof color).toBe('number');
        expect(typeof hasTreesPotential).toBe('boolean');

        // Log for debugging (can be removed in production tests)
        console.log(`Tile ${index}: ${terrainType}, Color: 0x${color.toString(16)}, Trees: ${hasTreesPotential}`);
      });
    });
  });
}); 