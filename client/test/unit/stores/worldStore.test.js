import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useWorldStore } from '@/stores/worldStore';

// Mock the game functions to avoid complex dependencies
vi.mock('@game/game', () => ({
  requestPlanetRegeneration: vi.fn(),
  triggerPlanetColorUpdate: vi.fn(),
}));

describe('WorldStore', () => {
  let store;

  beforeEach(() => {
    // Get a fresh store instance for each test
    store = useWorldStore.getState();
    // Reset to initial state
    store.resetWorldSettings();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct default values', () => {
      expect(store.drawMode).toBe('VORONOI');
      expect(store.algorithm).toBe(1);
      expect(store.numPoints).toBe(12000); // PLANET_TILES_DEFAULT
      expect(store.jitter).toBe(0.2); // PLANET_JITTER_DEFAULT
      expect(store.outlineVisible).toBe(true);
      expect(store.viewMode).toBe('terrain'); // PLANET_VIEW_MODE_DEFAULT
      expect(typeof store.currentSeed).toBe('string');
    });

    it('should have a valid timestamp-based seed', () => {
      const seedValue = parseInt(store.currentSeed);
      expect(seedValue).toBeGreaterThan(0);
      expect(seedValue.toString()).toBe(store.currentSeed);
    });
  });

  describe('Settings Updates', () => {
    it('should update drawMode and trigger regeneration', () => {
      const { requestPlanetRegeneration } = require('@game/game');
      
      store.setDrawMode('DELAUNAY');
      
      expect(store.drawMode).toBe('DELAUNAY');
      expect(requestPlanetRegeneration).toHaveBeenCalledWith(
        undefined, 
        expect.objectContaining({ drawMode: 'DELAUNAY' })
      );
    });

    it('should update numPoints and trigger regeneration', () => {
      const { requestPlanetRegeneration } = require('@game/game');
      
      store.setNumPoints(5000);
      
      expect(store.numPoints).toBe(5000);
      expect(requestPlanetRegeneration).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ numPoints: 5000 })
      );
    });

    it('should update jitter and trigger regeneration', () => {
      const { requestPlanetRegeneration } = require('@game/game');
      
      store.setJitter(0.5);
      
      expect(store.jitter).toBe(0.5);
      expect(requestPlanetRegeneration).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ jitter: 0.5 })
      );
    });



    it('should update numPlates and trigger regeneration', () => {
      const { requestPlanetRegeneration } = require('@game/game');
      
      store.setNumPlates(8);
      
      expect(store.numPlates).toBe(8);
      expect(requestPlanetRegeneration).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ numPlates: 8 })
      );
    });
  });

  describe('Visual Updates (No Regeneration)', () => {
    it('should update outlineVisible and trigger color update only', () => {
      const { requestPlanetRegeneration, triggerPlanetColorUpdate } = require('@game/game');
      
      store.setOutlineVisible(false);
      
      expect(store.outlineVisible).toBe(false);
      expect(requestPlanetRegeneration).not.toHaveBeenCalled();
      expect(triggerPlanetColorUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ outlineVisible: false })
      );
    });

    it('should update viewMode and trigger color update only', () => {
      const { requestPlanetRegeneration, triggerPlanetColorUpdate } = require('@game/game');
      
      store.setViewMode('elevation');
      
      expect(store.viewMode).toBe('elevation');
      expect(requestPlanetRegeneration).not.toHaveBeenCalled();
      expect(triggerPlanetColorUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ viewMode: 'elevation' })
      );
    });

    it('should update elevationBias and trigger color update only', () => {
      const { requestPlanetRegeneration, triggerPlanetColorUpdate } = require('@game/game');
      
      store.setElevationBias(0.3);
      
      expect(store.elevationBias).toBe(0.3);
      expect(requestPlanetRegeneration).not.toHaveBeenCalled();
      expect(triggerPlanetColorUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ elevationBias: 0.3 })
      );
    });
  });

  describe('Seed Management', () => {
    it('should update currentSeed without triggering regeneration', () => {
      const { requestPlanetRegeneration, triggerPlanetColorUpdate } = require('@game/game');
      
      store.setCurrentSeed('test-seed-123');
      
      expect(store.currentSeed).toBe('test-seed-123');
      expect(requestPlanetRegeneration).not.toHaveBeenCalled();
      expect(triggerPlanetColorUpdate).not.toHaveBeenCalled();
    });

    it('should regenerate with current settings and seed', () => {
      const { requestPlanetRegeneration, triggerPlanetColorUpdate } = require('@game/game');
      
      // Set up some state
      store.setCurrentSeed('test-seed');
      store.setNumPoints(8000);
      vi.clearAllMocks(); // Clear the calls from setNumPoints
      
      store.regenerateWorldWithCurrentSettings();
      
      expect(requestPlanetRegeneration).toHaveBeenCalledWith(
        'test-seed',
        expect.objectContaining({
          currentSeed: 'test-seed',
          numPoints: 8000
        })
      );
      expect(triggerPlanetColorUpdate).toHaveBeenCalled();
    });

    it('should regenerate with explicit seed parameter', () => {
      const { requestPlanetRegeneration } = require('@game/game');
      
      store.regenerateWorldWithCurrentSettings('explicit-seed');
      
      expect(requestPlanetRegeneration).toHaveBeenCalledWith(
        'explicit-seed',
        expect.any(Object)
      );
    });
  });

  describe('State Reset', () => {
    it('should reset all settings to initial values', () => {
      // Modify some values
      store.setNumPoints(999);
      store.setJitter(0.9);
      store.setViewMode('plates');
      store.setCurrentSeed('modified-seed');
      
      // Reset
      store.resetWorldSettings();
      
      // Check that values are back to defaults
      expect(store.numPoints).toBe(12000);
      expect(store.jitter).toBe(0.2);
      expect(store.viewMode).toBe('terrain');
      expect(store.currentSeed).not.toBe('modified-seed');
      expect(typeof store.currentSeed).toBe('string');
    });
  });

  describe('State Consistency', () => {
    it('should maintain state consistency across multiple updates', () => {
      const { requestPlanetRegeneration, triggerPlanetColorUpdate } = require('@game/game');
      
      // Perform multiple updates
      store.setNumPoints(6000);
      store.setJitter(0.3);
      store.setViewMode('moisture');
      store.setOutlineVisible(false);
      
      // Check final state
      expect(store.numPoints).toBe(6000);
      expect(store.jitter).toBe(0.3);
      expect(store.viewMode).toBe('moisture');
      expect(store.outlineVisible).toBe(false);
      
      // Check that appropriate functions were called
      expect(requestPlanetRegeneration).toHaveBeenCalledTimes(2); // numPoints and jitter
      expect(triggerPlanetColorUpdate).toHaveBeenCalledTimes(2); // viewMode and outlineVisible
    });

    it('should pass complete state to regeneration functions', () => {
      const { requestPlanetRegeneration } = require('@game/game');
      
      store.setNumPoints(7500);
      
      const lastCall = requestPlanetRegeneration.mock.calls[0];
      const passedSettings = lastCall[1];
      
      // Should include all current settings
      expect(passedSettings).toEqual(expect.objectContaining({
        drawMode: store.drawMode,
        algorithm: store.algorithm,
        numPoints: 7500,
        jitter: store.jitter,
        outlineVisible: store.outlineVisible,
        numPlates: store.numPlates,
        viewMode: store.viewMode,
        elevationBias: store.elevationBias,
        currentSeed: store.currentSeed,
      }));
    });
  });
}); 