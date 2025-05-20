import { create } from 'zustand';
import {
  DEFAULT_NUMBER_OF_GLOBE_TILES,
  DEFAULT_JITTER,
  DEFAULT_TECHTONIC_PLATES,
  DEFAULT_ELEVATION_BIAS,
  DrawMode,
  defaultMapType,
  DEFAULT_VIEW_MODE
} from '../config/gameConstants';

// Import the actual game functions instead of using mocks
import { requestPlanetRegeneration, triggerPlanetColorUpdate } from '../game/game.js';

// --- End Game Logic Imports ---

const initialWorldSettings = {
  drawMode: DrawMode.VORONOI,
  algorithm: 1, // Default from old sphereSettings
  numPoints: DEFAULT_NUMBER_OF_GLOBE_TILES,
  jitter: DEFAULT_JITTER,
  mapType: defaultMapType,
  outlineVisible: true, // Default from old sphereSettings
  numPlates: DEFAULT_TECHTONIC_PLATES,
  viewMode: DEFAULT_VIEW_MODE, // Default from old sphereSettings
  elevationBias: DEFAULT_ELEVATION_BIAS,
  currentSeed: '12345', // Initial mock seed, can be updated
};

export const useWorldSettingsStore = create((set, get) => ({
  ...initialWorldSettings,

  // Actions to update settings
  setDrawMode: (drawMode) => {
    set({ drawMode });
    requestPlanetRegeneration();
  },
  setAlgorithm: (algorithm) => {
    set({ algorithm });
    requestPlanetRegeneration();
  },
  setNumPoints: (numPoints) => {
    set({ numPoints });
    requestPlanetRegeneration();
  },
  setJitter: (jitter) => {
    set({ jitter });
    requestPlanetRegeneration();
  },
  setMapType: (mapType) => {
    set({ mapType });
    requestPlanetRegeneration();
  },
  setOutlineVisible: (outlineVisible) => {
    set({ outlineVisible });
    triggerPlanetColorUpdate();
  },
  setNumPlates: (numPlates) => {
    set({ numPlates });
    requestPlanetRegeneration();
  },
  setViewMode: (viewMode) => {
    set({ viewMode });
    triggerPlanetColorUpdate();
  },
  setElevationBias: (elevationBias) => {
    set({ elevationBias });
    triggerPlanetColorUpdate();
  },
  setCurrentSeed: (currentSeed) => {
    set({ currentSeed });
    // Regeneration with new seed is typically explicit via a button
    // requestPlanetRegeneration(currentSeed); // Or handle in UI component
  },
  regenerateWorldWithCurrentSettings: (seed) => {
    // If seed is provided, it overrides currentSeed for this regeneration only
    // The store's currentSeed is updated via setCurrentSeed if a specific seed input is used
    const settings = get();
    console.log('Store Action: Regenerating world with seed:', seed || settings.currentSeed, 'and settings:', settings);
    requestPlanetRegeneration(seed || settings.currentSeed);
    triggerPlanetColorUpdate(); // Often needed after regeneration
  },

  // Full reset action (optional)
  resetWorldSettings: () => set(initialWorldSettings),
})); 