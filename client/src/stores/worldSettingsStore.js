import { create } from 'zustand';
import zukeeper from 'zukeeper';

import {
  DEFAULT_NUMBER_OF_GLOBE_TILES,
  DEFAULT_JITTER,
  DEFAULT_TECHTONIC_PLATES,
  DEFAULT_ELEVATION_BIAS,
  DrawMode,
  defaultMapType,
  DEFAULT_VIEW_MODE
} from '@config/gameConstants';

// Import the actual game functions
import { requestPlanetRegeneration, triggerPlanetColorUpdate } from '@game/game';

// --- End Game Logic Imports ---

// Generate a default seed based on the current timestamp
const generateDefaultSeed = () => String(Date.now());

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
  currentSeed: generateDefaultSeed(), // Use a timestamp-based seed by default
};

export const useWorldSettingsStore = create(zukeeper((set, get) => ({
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
  setCurrentSeed: (currentSeed) => {
    set({ currentSeed });
    // Regeneration with new seed is typically explicit via a button
  },
  regenerateWorldWithCurrentSettings: (seed) => {
    // If seed is provided, it overrides currentSeed for this regeneration only
    // The store's currentSeed is updated via setCurrentSeed if a specific seed input is used
    const settings = get();
    console.log('regenerateWorldWithCurrentSettings - Regenerating world with seed:', seed || settings.currentSeed, 'and settings:', settings);
    requestPlanetRegeneration(seed || settings.currentSeed, settings);
    triggerPlanetColorUpdate(settings); // Often needed after regeneration
  },

  // Full reset action (optional)
  resetWorldSettings: () => set(initialWorldSettings),
}))); 