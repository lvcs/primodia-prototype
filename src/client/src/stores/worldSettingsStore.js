import { create } from 'zustand';
import {
  DEFAULT_NUMBER_OF_GLOBE_TILES,
  DEFAULT_JITTER,
  DEFAULT_TECHTONIC_PLATES,
  DEFAULT_ELEVATION_BIAS,
  // We need to import DrawMode and defaultMapType if they are not defined locally
} from '../../config/gameConstants'; // Adjust path as necessary

// --- Mock/Placeholder Game Logic Imports (to be replaced by actual game logic calls) ---
// These would ideally be imported from their actual locations or handled by a central game service.

// Duplicating DrawMode and defaultMapType here for now, should come from game logic files
const DrawMode = {
  POINTS: 'points',
  DELAUNAY: 'delaunay',
  VORONOI: 'voronoi',
  CENTROID: 'centroid'
};
const defaultMapType = 'continents';
const DEFAULT_VIEW_MODE = 'elevation';

const requestPlanetRegeneration = (/* seed */) => {
  // This function will eventually call the actual game logic.
  // The store actions will pass the current state of sphereSettings.
  console.log('Store Action: Requesting planet regeneration with current settings.');
};

const triggerPlanetColorUpdate = () => {
  // This function will eventually call the actual game logic.
  console.log('Store Action: Triggering planet color update with current settings.');
};
// --- End Mock/Placeholder Game Logic Imports ---

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