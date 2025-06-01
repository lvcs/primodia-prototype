import { create } from 'zustand';

import {
  PLANET_TILES_DEFAULT,
  PLANET_JITTER_DEFAULT,
  PLANET_TECHTONIC_PLATES_DEFAULT,
  PLANET_ELEVATION_BIAS_DEFAULT,
  PLANET_DRAW_MODES,
  PLANET_VIEW_MODE_DEFAULT,
  PLANET_DRAW_ALGORITHM,
  PLANET_TILE_OUTLINES,
  PLANET_RADIUS
} from '@config';

const initialWorldSettings = {
  drawMode: PLANET_DRAW_MODES.VORONOI,
  algorithm: PLANET_DRAW_ALGORITHM,
  numPoints: PLANET_TILES_DEFAULT,
  jitter: PLANET_JITTER_DEFAULT,
  outlineVisible: PLANET_TILE_OUTLINES,
  numPlates: PLANET_TECHTONIC_PLATES_DEFAULT,
  viewMode: PLANET_VIEW_MODE_DEFAULT,
  elevationBias: PLANET_ELEVATION_BIAS_DEFAULT,
  planetRadius: PLANET_RADIUS,
};

export const useWorldStore = create((set, get) => ({
  ...initialWorldSettings,

  // Actions to update settings
  setDrawMode: (drawMode) => set({ drawMode }),
  setAlgorithm: (algorithm) => set({ algorithm }),
  setNumPoints: (numPoints) => set({ numPoints }),
  setJitter: (jitter) => set({ jitter }),
  setOutlineVisible: (outlineVisible) => set({ outlineVisible }),
  setNumPlates: (numPlates) => set({ numPlates }),
  setViewMode: (viewMode) => set({ viewMode }),
  setElevationBias: (elevationBias) => set({ elevationBias }),
  setPlanetRadius: () => {},

  // Getters
  getDrawMode: () => get().drawMode,
  getAlgorithm: () => get().algorithm,
  getNumPoints: () => get().numPoints,
  getJitter: () => get().jitter,
  getOutlineVisible: () => get().outlineVisible,
  getNumPlates: () => get().numPlates,
  getViewMode: () => get().viewMode,
  getElevationBias: () => get().elevationBias,
  getPlanetRadius: () => get().planetRadius,
})); 