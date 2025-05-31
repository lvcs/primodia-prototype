import { create } from 'zustand';

import {
  PLANET_TILES_DEFAULT,
  PLANET_JITTER_DEFAULT,
  PLANET_TECHTONIC_PLATES_DEFAULT,
  PLANET_ELEVATION_BIAS_DEFAULT,
  PLANET_DRAW_MODE,
  MAP_TYPE_DEFAULT,
  PLANET_VIEW_MODE_DEFAULT
} from '@config';

// Import the actual game functions
import { requestPlanetRegeneration, triggerPlanetColorUpdate } from '@game/game';
import { useGameStore } from '@stores';

// --- End Game Logic Imports ---

const initialWorldSettings = {
  drawMode: PLANET_DRAW_MODE.VORONOI,
  algorithm: 1, // Default from old planetSettings
  numPoints: PLANET_TILES_DEFAULT,
  jitter: PLANET_JITTER_DEFAULT,
  mapType: MAP_TYPE_DEFAULT,
  outlineVisible: true, // Default from old planetSettings
  numPlates: PLANET_TECHTONIC_PLATES_DEFAULT,
  viewMode: PLANET_VIEW_MODE_DEFAULT, // Default from old planetSettings
  elevationBias: PLANET_ELEVATION_BIAS_DEFAULT,
};

export const useWorldStore = create((set, get) => ({
  ...initialWorldSettings,

  // Actions to update settings
  setDrawMode: (drawMode) => {
    set({ drawMode });
    const settings = get();
    console.log('setDrawMode - passing settings to requestPlanetRegeneration');
    requestPlanetRegeneration(undefined, settings);
  },
  setAlgorithm: (algorithm) => {
    set({ algorithm });
    const settings = get();
    console.log('setAlgorithm - passing settings to requestPlanetRegeneration');
    requestPlanetRegeneration(undefined, settings);
  },
  setNumPoints: (numPoints) => {
    console.log('Store: setNumPoints called with value:', numPoints);
    set({ numPoints });
    const settings = get();
    console.log('Store: After update, numPoints in state is:', settings.numPoints);
    console.log('setNumPoints - passing settings to requestPlanetRegeneration');
    requestPlanetRegeneration(undefined, settings);
  },
  setJitter: (jitter) => {
    set({ jitter });
    const settings = get();
    console.log('setJitter - passing settings to requestPlanetRegeneration');
    requestPlanetRegeneration(undefined, settings);
  },
  setMapType: (mapType) => {
    set({ mapType });
    const settings = get();
    console.log('setMapType - passing settings to requestPlanetRegeneration');
    requestPlanetRegeneration(undefined, settings);
  },
  setOutlineVisible: (outlineVisible) => {
    set({ outlineVisible });
    const settings = get();
    console.log('setOutlineVisible - passing settings to triggerPlanetColorUpdate');
    triggerPlanetColorUpdate(settings);
  },
  setNumPlates: (numPlates) => {
    set({ numPlates });
    const settings = get();
    console.log('setNumPlates - passing settings to requestPlanetRegeneration');
    requestPlanetRegeneration(undefined, settings);
  },
  setViewMode: (viewMode) => {
    set({ viewMode });
    const settings = get();
    console.log('setViewMode - passing settings to triggerPlanetColorUpdate');
    triggerPlanetColorUpdate(settings);
  },
  setElevationBias: (elevationBias) => {
    set({ elevationBias });
    const settings = get();
    console.log('setElevationBias - passing settings to triggerPlanetColorUpdate');
    triggerPlanetColorUpdate(settings);
  },
  regenerateWorldWithCurrentSettings: () => {
    // Get seed from gameStore instead of local state
    const seed = useGameStore.getState().seed;
    const settings = get();
    console.log('regenerateWorldWithCurrentSettings - Regenerating world with seed:', seed, 'and settings:', settings);
    requestPlanetRegeneration(seed, settings);
    triggerPlanetColorUpdate(settings); // Often needed after regeneration
  },

  // Full reset action (optional)
  resetWorldSettings: () => set(initialWorldSettings),
})); 