import { create } from 'zustand';
import * as THREE from 'three';

import { CAMERA_VIEWS, GLOBE_VIEW_CAMERA_DISTANCE, TILE_VIEW_CAMERA_DISTANCE } from '@config/cameraConfig';

// Helper to get default camera parameters based on view mode
const getDefaultCameraParams = (viewMode = 'globe') => {
  // TODO: Define specific phi, theta, zoom for each view mode in cameraConfig.js
  // For now, using some placeholders.
  switch (viewMode) {
    case 'tile':
      return {
        zoom: TILE_VIEW_CAMERA_DISTANCE !== undefined ? TILE_VIEW_CAMERA_DISTANCE : 50,
        phi: Math.PI / 4, // Example: 45 degrees
        theta: 0,
        target: new THREE.Vector3(0, 0, 0), // Or a specific default target for tile view
      };
    case 'globe':
    default:
      return {
        zoom: GLOBE_VIEW_CAMERA_DISTANCE !== undefined ? GLOBE_VIEW_CAMERA_DISTANCE : 150,
        phi: Math.PI / 2, // Equatorial
        theta: 0, // Default orientation
        target: new THREE.Vector3(0, 0, 0),
      };
  }
};

const useCameraStore = create((set, get) => ({
  // REQ-CAM-R-001: Definitive state
  ...getDefaultCameraParams('globe'), // Initialize with default globe view params
  viewMode: 'globe',
  isAnimating: false,

  // REQ-CAM-R-002: Actions to update state variables
  setZoom: (zoom) => set({ zoom }),
  setTarget: (target) => set({ target: new THREE.Vector3().copy(target) }),
  setPhi: (phi) => set({ phi }),
  setTheta: (theta) => set({ theta }),
  setRotation: ({ phi, theta }) => set(state => {
    const newPhi = phi !== undefined ? phi : state.phi;
    const newTheta = theta !== undefined ? theta : state.theta;
    return { phi: newPhi, theta: newTheta };
  }),
  setIsAnimating: (isAnimating) => set({ isAnimating }),

  setViewMode: (viewMode) => set((state) => {
    const defaultParams = getDefaultCameraParams(viewMode);
    return {
      viewMode,
      ...defaultParams, // Reset zoom, phi, theta, target to defaults for the new mode
      isAnimating: false, // Reset animation state on view mode change
    };
  }),

  // --- Helper getters ---
  getOrientation: () => ({
    phi: get().phi,
    theta: get().theta,
  }),

  getPositionState: () => ({
    zoom: get().zoom,
    target: get().target.clone(),
    phi: get().phi,
    theta: get().theta,
  }),

  // --- Deprecated actions/state (to be removed after confirming they are not used elsewhere) ---
  // setPosition: (position) => console.warn('setPosition is deprecated'),
  // setTilt: (tilt) => console.warn('setTilt is deprecated'),
  // setYaw: (yaw) => console.warn('setYaw is deprecated'),
  // setRoll: (roll) => console.warn('setRoll is deprecated'),
  // setOrientation: (orientationUpdate) => console.warn('setOrientation (old) is deprecated'),
  // restoreState: (state) => console.warn('restoreState is deprecated'),
}));

export default useCameraStore; 