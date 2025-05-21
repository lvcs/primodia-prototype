import { create } from 'zustand';

import { CAMERA_VIEWS } from '@config/cameraParameters';

// Default state for each view
const getDefaultState = (view = 'globe') => {
  const config = CAMERA_VIEWS[view] || CAMERA_VIEWS.globe;
  return {
    camera: null,
    viewMode: view,
    position: null, // { x, y, z } or null
    zoom: config.defaultZoom,
    tilt: config.defaultTilt, // Pitch (X-axis rotation)
    yaw: 0, // Y-axis rotation, default to 0
    roll: 0, // Z-axis rotation, default to 0
    target: null, // { x, y, z } or null
  };
};

export const useCameraStore = create((set, get) => ({
  ...getDefaultState(),
  camera: null,
  

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

  // Update yaw
  setYaw: (yaw) => set({ yaw }),

  // Update roll
  setRoll: (roll) => set({ roll }),

  // Update target
  setTarget: (target) => set({ target }),

  // Action to set multiple orientation parameters at once
  setOrientation: (orientationUpdate) => set((state) => ({
    tilt: orientationUpdate.tilt !== undefined ? orientationUpdate.tilt : state.tilt,
    yaw: orientationUpdate.yaw !== undefined ? orientationUpdate.yaw : state.yaw,
    roll: orientationUpdate.roll !== undefined ? orientationUpdate.roll : state.roll,
  })),

  // Restore full state (e.g., on view switch)
  restoreState: (state) => set({ ...state }),
})); 