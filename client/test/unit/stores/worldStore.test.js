import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useWorldStore } from '@/world/worldStore';

// Mock the game functions to avoid complex dependencies
vi.mock('@game/game', () => ({
  requestPlanetRegeneration: vi.fn(),
  triggerPlanetColorUpdate: vi.fn(),
}));

describe('WorldStore', () => {
  afterEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state after each test
    useWorldStore.getState().resetWorldSettings();
  });

  describe('Initial State', () => {
    it('should have correct default values', () => {
      const store = useWorldStore.getState();
      expect(store.drawMode).toBe('voronoi'); // PLANET_DRAW_MODE.VORONOI
      expect(store.algorithm).toBe(1);
      expect(store.numPoints).toBe(1280); // PLANET_TILES_DEFAULT
      expect(store.jitter).toBe(0.5); // PLANET_JITTER_DEFAULT
      expect(store.outlineVisible).toBe(true);
      expect(store.viewMode).toBe('elevation'); // PLANET_VIEW_MODE_DEFAULT
    });
  });

  describe('Settings Updates', () => {
    it('should update drawMode and trigger regeneration', async () => {
      const { requestPlanetRegeneration } = await import('@game/game');
      
      useWorldStore.getState().setDrawMode('delaunay');
      
      expect(useWorldStore.getState().drawMode).toBe('delaunay');
      expect(requestPlanetRegeneration).toHaveBeenCalledWith(
        expect.objectContaining({ drawMode: 'delaunay' })
      );
    });

    it('should update numPoints and trigger regeneration', async () => {
      const { requestPlanetRegeneration } = await import('@game/game');
      
      useWorldStore.getState().setNumPoints(5000);
      
      expect(useWorldStore.getState().numPoints).toBe(5000);
      expect(requestPlanetRegeneration).toHaveBeenCalledWith(
        expect.objectContaining({ numPoints: 5000 })
      );
    });

    it('should update jitter and trigger regeneration', async () => {
      const { requestPlanetRegeneration } = await import('@game/game');
      
      useWorldStore.getState().setJitter(0.2);
      
      expect(useWorldStore.getState().jitter).toBe(0.2);
      expect(requestPlanetRegeneration).toHaveBeenCalledWith(
        expect.objectContaining({ jitter: 0.2 })
      );
    });

    it('should update numPlates and trigger regeneration', async () => {
      const { requestPlanetRegeneration } = await import('@game/game');
      
      useWorldStore.getState().setNumPlates(8);
      
      expect(useWorldStore.getState().numPlates).toBe(8);
      expect(requestPlanetRegeneration).toHaveBeenCalledWith(
        expect.objectContaining({ numPlates: 8 })
      );
    });
  });

  describe('Visual Updates (No Regeneration)', () => {
    it('should update outlineVisible and trigger color update only', async () => {
      const { requestPlanetRegeneration, triggerPlanetColorUpdate } = await import('@game/game');
      
      useWorldStore.getState().setOutlineVisible(false);
      
      expect(useWorldStore.getState().outlineVisible).toBe(false);
      expect(requestPlanetRegeneration).not.toHaveBeenCalled();
      expect(triggerPlanetColorUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ outlineVisible: false })
      );
    });

    it('should update viewMode and trigger color update only', async () => {
      const { requestPlanetRegeneration, triggerPlanetColorUpdate } = await import('@game/game');
      
      useWorldStore.getState().setViewMode('terrain');
      
      expect(useWorldStore.getState().viewMode).toBe('terrain');
      expect(requestPlanetRegeneration).not.toHaveBeenCalled();
      expect(triggerPlanetColorUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ viewMode: 'terrain' })
      );
    });

    it('should update elevationBias and trigger color update only', async () => {
      const { requestPlanetRegeneration, triggerPlanetColorUpdate } = await import('@game/game');
      
      useWorldStore.getState().setElevationBias(0.3);
      
      expect(useWorldStore.getState().elevationBias).toBe(0.3);
      expect(requestPlanetRegeneration).not.toHaveBeenCalled();
      expect(triggerPlanetColorUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ elevationBias: 0.3 })
      );
    });
  });

  describe('World Regeneration', () => {
    it('should regenerate with current settings and seed from gameStore', async () => {
      const { requestPlanetRegeneration, triggerPlanetColorUpdate } = await import('@game/game');
      
      // Set up some state
      useWorldStore.getState().setNumPoints(8000);
      vi.clearAllMocks(); // Clear the calls from setNumPoints
      
      useWorldStore.getState().regenerateWorldWithCurrentSettings();
      
      expect(requestPlanetRegeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          numPoints: 8000
        }),
        null // In test environment, gameStore seed is null
      );
      expect(triggerPlanetColorUpdate).toHaveBeenCalled();
    });
  });

  describe('State Reset', () => {
    it('should reset all settings to initial values', () => {
      // Modify some values
      useWorldStore.getState().setNumPoints(999);
      useWorldStore.getState().setJitter(0.9);
      useWorldStore.getState().setViewMode('plates');
      
      // Reset
      useWorldStore.getState().resetWorldSettings();
      
      // Check that values are back to defaults
      const store = useWorldStore.getState();
      expect(store.numPoints).toBe(1280); // PLANET_TILES_DEFAULT
      expect(store.jitter).toBe(0.5); // PLANET_JITTER_DEFAULT
      expect(store.viewMode).toBe('elevation'); // PLANET_VIEW_MODE_DEFAULT
    });
  });

  describe('State Consistency', () => {
    it('should maintain state consistency across multiple updates', async () => {
      const { requestPlanetRegeneration, triggerPlanetColorUpdate } = await import('@game/game');
      
      // Perform multiple updates
      useWorldStore.getState().setNumPoints(6000);
      useWorldStore.getState().setJitter(0.3);
      useWorldStore.getState().setViewMode('moisture');
      useWorldStore.getState().setOutlineVisible(false);
      
      // Check final state
      const store = useWorldStore.getState();
      expect(store.numPoints).toBe(6000);
      expect(store.jitter).toBe(0.3);
      expect(store.viewMode).toBe('moisture');
      expect(store.outlineVisible).toBe(false);
      
      // Check that appropriate functions were called
      expect(requestPlanetRegeneration).toHaveBeenCalledTimes(2); // numPoints and jitter
      expect(triggerPlanetColorUpdate).toHaveBeenCalledTimes(2); // viewMode and outlineVisible
    });

    it('should pass complete state to regeneration functions', async () => {
      const { requestPlanetRegeneration } = await import('@game/game');
      
      useWorldStore.getState().setNumPoints(7500);
      
      const lastCall = requestPlanetRegeneration.mock.calls[0];
      const passedSettings = lastCall[0]; // Settings are now the first parameter
      
      // Should include all current settings
      expect(passedSettings).toEqual(expect.objectContaining({
        drawMode: expect.any(String),
        algorithm: expect.any(Number),
        numPoints: 7500,
        jitter: expect.any(Number),
        outlineVisible: expect.any(Boolean),
        numPlates: expect.any(Number),
        viewMode: expect.any(String),
        elevationBias: expect.any(Number),
      }));
    });
  });
}); 