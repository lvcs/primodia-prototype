import { create } from 'zustand';
import { CAMERA_VIEWS } from '../config/cameraViewsConfig'; // Updated import path

// Default state for each view
const getDefaultState = (view = 'globe') => {
  const config = CAMERA_VIEWS[view] || CAMERA_VIEWS.globe;
  return {
    viewMode: view,
    position: null, // { x, y, z } or null
    zoom: config.defaultZoom,
    tilt: config.defaultTilt,
    target: null, // { x, y, z } or null
  };
};

export const useCameraUIStore = create((set, get) => ({
  ...getDefaultState(),

  // Switch view mode and reset to default for that view
  setViewMode: (view) => set((state) => ({
    ...getDefaultState(view),
  })),

  // Update camera position
  setPosition: (position) => set({ position }),

  // Update zoom
  setZoom: (zoom) => set({ zoom }),

  // Update tilt
  setTilt: (tilt) => set({ tilt }),

  // Update target
  setTarget: (target) => set({ target }),

  // Restore full state (e.g., on view switch)
  restoreState: (state) => set({ ...state }),
})); 