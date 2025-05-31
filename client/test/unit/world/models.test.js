import { describe, it, expect } from 'vitest';
import Tile from '@game/world/model/Tile';
import { TerrainType } from '@game/planet/terrain';
import WorldPlanet from '@game/world/model/WorldPlanet';
import { Plate } from '@game/planet/techtonics';
import * as THREE from 'three';

describe('World Model Classes', () => {
  describe('TerrainType', () => {
    it('should create a terrain type with required properties', () => {
      const terrain = new TerrainType({
        id: 'TEST_TERRAIN',
        name: 'Test Terrain',
        color: 0x00FF00,
      });

      expect(terrain.id).toBe('TEST_TERRAIN');
      expect(terrain.name).toBe('Test Terrain');
      expect(terrain.color).toBe(0x00FF00);
      expect(terrain.baseType).toBe('LAND'); // Default value
      expect(terrain.priority).toBe(100); // Default value
    });

    it('should handle optional properties correctly', () => {
      const terrain = new TerrainType({
        id: 'OCEAN',
        name: 'Ocean',
        color: 0x0000FF,
        baseType: 'WATER',
        priority: 0,
        minElevation: -1,
        maxElevation: -0.05,
        minMoisture: 0.8,
        maxMoisture: 1.0,
        requiresLake: false,
      });

      expect(terrain.baseType).toBe('WATER');
      expect(terrain.priority).toBe(0);
      expect(terrain.minElevation).toBe(-1);
      expect(terrain.maxElevation).toBe(-0.05);
      expect(terrain.minMoisture).toBe(0.8);
      expect(terrain.maxMoisture).toBe(1.0);
      expect(terrain.requiresLake).toBe(false);
    });

    it('should set default values for unspecified properties', () => {
      const terrain = new TerrainType({
        id: 'MINIMAL',
        name: 'Minimal',
        color: 0xFFFFFF,
      });

      expect(terrain.minElevation).toBe(-Infinity);
      expect(terrain.maxElevation).toBe(Infinity);
      expect(terrain.minMoisture).toBe(0);
      expect(terrain.maxMoisture).toBe(1);
      expect(terrain.minTemp).toBe(0);
      expect(terrain.maxTemp).toBe(1);
      expect(terrain.requiresLake).toBe(false);
    });
  });

  describe('Tile', () => {
    let testTerrain;

    beforeEach(() => {
      testTerrain = new TerrainType({
        id: 'GRASSLAND',
        name: 'Grassland',
        color: 0x88AA55,
      });
    });

    it('should create a tile with normalized center coordinates', () => {
      const tile = new Tile({
        id: 1,
        terrain: testTerrain,
        center: [1, 2, 3], // Will be normalized
        elevation: 0.5,
      });

      expect(tile.id).toBe(1);
      expect(tile.terrain).toBe(testTerrain);
      expect(tile.elevation).toBe(0.5);
      
      // Check that center is normalized (length should be 1)
      const length = Math.sqrt(
        tile.center[0] ** 2 + tile.center[1] ** 2 + tile.center[2] ** 2
      );
      expect(length).toBeCloseTo(1, 10);
    });

    it('should handle default values correctly', () => {
      const tile = new Tile({
        id: 2,
        terrain: testTerrain,
        center: [0, 0, 1],
      });

      expect(tile.neighbors).toEqual([]);
      expect(tile.area).toBe(0.0);
      expect(tile.elevation).toBe(0);
      expect(tile.plate).toBe(0);
      expect(tile.moisture).toBe(0);
      expect(tile.temperature).toBe(0);
      expect(tile.plateId).toBeNull();
      expect(tile.isOceanConnected).toBe(false);
    });

    it('should calculate latitude and longitude correctly', () => {
      // Test tile at north pole
      const northPoleTile = new Tile({
        id: 1,
        terrain: testTerrain,
        center: [0, 1, 0], // North pole
      });

      expect(northPoleTile.lat).toBeCloseTo(90, 1);
      expect(northPoleTile.latRad).toBeCloseTo(Math.PI / 2, 5);

      // Test tile at equator
      const equatorTile = new Tile({
        id: 2,
        terrain: testTerrain,
        center: [1, 0, 0], // On equator, prime meridian
      });

      expect(equatorTile.lat).toBeCloseTo(0, 1);
      expect(equatorTile.lon).toBeCloseTo(0, 1);
    });

    it('should handle invalid center coordinates gracefully', () => {
      const tile = new Tile({
        id: 3,
        terrain: testTerrain,
        center: null, // Invalid center
      });

      expect(tile.center).toEqual([0, 0, 0]);
    });

    it('should normalize center coordinates even when all zeros', () => {
      const tile = new Tile({
        id: 4,
        terrain: testTerrain,
        center: [0, 0, 0], // Will result in [0,0,0] after normalization
      });

      expect(tile.center).toEqual([0, 0, 0]);
    });
  });

  describe('WorldPlanet', () => {
    it('should create a planet with correct properties', () => {
      const planet = new WorldPlanet({
        drawMode: 'VORONOI',
        algorithm: 1,
        numTiles: 1000,
        jitter: 0.2,
        size: 6400,
      });

      expect(planet.drawMode).toBe('VORONOI');
      expect(planet.algorithm).toBe(1);
      expect(planet.numTiles).toBe(1000);
      expect(planet.jitter).toBe(0.2);
      expect(planet.size).toBe(6400);
      expect(planet.tiles).toBeInstanceOf(Map);
      expect(planet.tiles.size).toBe(0);
      expect(typeof planet.id).toBe('string');
    });

    it('should add and retrieve tiles correctly', () => {
      const planet = new WorldPlanet({
        drawMode: 'VORONOI',
        algorithm: 1,
        numTiles: 10,
        jitter: 0.1,
        size: 1000,
      });

      const terrain = new TerrainType({
        id: 'FOREST',
        name: 'Forest',
        color: 0x006600,
      });

      const tile = new Tile({
        id: 1,
        terrain,
        center: [1, 0, 0],
      });

      planet.addTile(tile);
      
      expect(planet.tiles.size).toBe(1);
      expect(planet.getTile(1)).toBe(tile);
      expect(planet.getTile(999)).toBeUndefined();
    });

    it('should calculate terrain statistics correctly', () => {
      const planet = new WorldPlanet({
        drawMode: 'VORONOI',
        algorithm: 1,
        numTiles: 10,
        jitter: 0.1,
        size: 1000,
      });

      const forestTerrain = new TerrainType({
        id: 'FOREST',
        name: 'Forest',
        color: 0x006600,
      });

      const oceanTerrain = new TerrainType({
        id: 'OCEAN',
        name: 'Ocean',
        color: 0x000066,
      });

      // Add multiple tiles
      planet.addTile(new Tile({ id: 1, terrain: forestTerrain, center: [1, 0, 0] }));
      planet.addTile(new Tile({ id: 2, terrain: forestTerrain, center: [0, 1, 0] }));
      planet.addTile(new Tile({ id: 3, terrain: oceanTerrain, center: [0, 0, 1] }));

      const stats = planet.terrainStats;
      
      expect(stats.FOREST).toBe(2);
      expect(stats.OCEAN).toBe(1);
      expect(stats.DESERT).toBeUndefined();
    });
  });

  describe('Plate', () => {
    it('should create a plate with required properties', () => {
      const plate = new Plate({
        id: 1,
        seedTileId: 100,
        center: [0.5, 0.3, 0.8],
        motion: [0.1, -0.2, 0.3],
      });

      expect(plate.id).toBe(1);
      expect(plate.seedTileId).toBe(100);
      expect(plate.center).toEqual([0.5, 0.3, 0.8]);
      expect(plate.motion).toEqual([0.1, -0.2, 0.3]);
      expect(plate.isOceanic).toBe(false); // Default
      expect(plate.baseElevation).toBe(0.0); // Default
    });

    it('should handle optional properties correctly', () => {
      const plate = new Plate({
        id: 2,
        seedTileId: 200,
        center: [1, 0, 0],
        motion: [0, 1, 0],
        isOceanic: true,
        baseElevation: -0.5,
      });

      expect(plate.isOceanic).toBe(true);
      expect(plate.baseElevation).toBe(-0.5);
    });

    it('should create continental and oceanic plates differently', () => {
      const continentalPlate = new Plate({
        id: 1,
        seedTileId: 100,
        center: [1, 0, 0],
        motion: [0, 0, 1],
        isOceanic: false,
        baseElevation: 0.3,
      });

      const oceanicPlate = new Plate({
        id: 2,
        seedTileId: 200,
        center: [0, 1, 0],
        motion: [1, 0, 0],
        isOceanic: true,
        baseElevation: -0.7,
      });

      expect(continentalPlate.isOceanic).toBe(false);
      expect(continentalPlate.baseElevation).toBe(0.3);
      expect(oceanicPlate.isOceanic).toBe(true);
      expect(oceanicPlate.baseElevation).toBe(-0.7);
    });
  });

  describe('Model Integration', () => {
    it('should work together in a complete scenario', () => {
      // Create terrain types
      const ocean = new TerrainType({
        id: 'OCEAN',
        name: 'Ocean',
        color: 0x000066,
        baseType: 'WATER',
        maxElevation: -0.05,
      });

      const forest = new TerrainType({
        id: 'FOREST',
        name: 'Forest',
        color: 0x006600,
        minMoisture: 0.5,
      });

      // Create planet
      const planet = new WorldPlanet({
        drawMode: 'VORONOI',
        algorithm: 1,
        numTiles: 100,
        jitter: 0.2,
        size: 6400,
      });

      // Create tiles
      const oceanTile = new Tile({
        id: 1,
        terrain: ocean,
        center: [1, 0, 0],
        elevation: -0.3,
        moisture: 0.9,
        isOceanConnected: true,
      });

      const forestTile = new Tile({
        id: 2,
        terrain: forest,
        center: [0, 1, 0],
        elevation: 0.2,
        moisture: 0.7,
        neighbors: [1],
      });

      // Create plates
      const oceanicPlate = new Plate({
        id: 1,
        seedTileId: 1,
        center: [1, 0, 0],
        motion: [0, 0.1, 0],
        isOceanic: true,
        baseElevation: -0.5,
      });

      // Add to planet
      planet.addTile(oceanTile);
      planet.addTile(forestTile);

      // Test relationships
      expect(planet.tiles.size).toBe(2);
      expect(forestTile.neighbors).toContain(oceanTile.id);
      expect(oceanTile.terrain.baseType).toBe('WATER');
      expect(forestTile.terrain.baseType).toBe('LAND');
      expect(oceanicPlate.seedTileId).toBe(oceanTile.id);

      // Test computed properties
      expect(oceanTile.lat).toBeCloseTo(0, 1); // On equator
      expect(forestTile.lat).toBeCloseTo(90, 1); // At north pole

      // Test terrain stats
      const stats = planet.terrainStats;
      expect(stats.OCEAN).toBe(1);
      expect(stats.FOREST).toBe(1);
    });
  });
}); 