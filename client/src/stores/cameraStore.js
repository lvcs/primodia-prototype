import { create } from 'zustand';
import * as THREE from 'three';
import { CAMERA_FOV, CAMERA_NEAR_PLANE, CAMERA_FAR_PLANE, GLOBE_RADIUS } from '@config/gameConfig';
import { CAMERA_VIEWS, DEFAULT_ANIMATION_DURATION_MS, DEFAULT_EASING_CURVE } from '@config/cameraConfig'; // Assuming these are needed for reset or view modes

// Initial state, also used for reset
const getDefaultCameraState = () => ({
  target: new THREE.Vector3(0, 0, 0),
  position: new THREE.Vector3(0, GLOBE_RADIUS * 0.5, GLOBE_RADIUS * 2.5), // Default initial position
  up: new THREE.Vector3(0, 1, 0),
  viewMode: 'globe', // Default view mode
  isAnimating: false,
  fov: CAMERA_FOV,
  near: CAMERA_NEAR_PLANE,
  far: CAMERA_FAR_PLANE,
});

const useCameraStore = create((set, get) => ({
  ...getDefaultCameraState(),

  // Actions to update state
  // These actions primarily update the store. The synchronization to OrbitControls
  // will be handled by a separate mechanism (e.g., useEffect in a component or if OrbitControls instance is made available here)
  setTarget: (target) => set({ target: new THREE.Vector3().copy(target) }),
  setPosition: (position) => set({ position: new THREE.Vector3().copy(position) }),
  setUpVector: (up) => set({ up: new THREE.Vector3().copy(up) }),
  setViewMode: (viewMode) => {
    const viewConfig = CAMERA_VIEWS[viewMode];
    if (viewConfig) {
      set({
        viewMode,
        // Optionally, update target/position based on viewConfig if provided
        // For now, just sets the mode. API layer will handle transitions.
        isAnimating: false, // Reset animation state on view mode change
      });
    } else {
      console.warn(`CameraStore: Unknown viewMode "${viewMode}"`);
    }
  },
  setAnimating: (isAnimating) => set({ isAnimating }),
  setFov: (fov) => set({ fov }),
  setNearFarPlanes: ({ near, far }) => set({ near, far }),

  // Action to update store from OrbitControls' state
  syncFromOrbitControls: (position, target, up) => {
    set({
      position: new THREE.Vector3().copy(position),
      target: new THREE.Vector3().copy(target),
      up: new THREE.Vector3().copy(up),
    });
  },

  // Reset camera to a default or specified state
  resetCamera: (initialState) => {
    const defaults = getDefaultCameraState();
    const newState = { ...defaults, ...initialState }; // Merge provided state with defaults
    set(newState);
    // This should also trigger an update to OrbitControls to reflect the reset state.
  },

  // Getter for convenience, though direct subscription to properties is preferred for React components
  getCameraState: () => ({
    target: get().target.clone(),
    position: get().position.clone(),
    up: get().up.clone(),
    viewMode: get().viewMode,
    isAnimating: get().isAnimating,
    fov: get().fov,
    near: get().near,
    far: get().far,
  }),
}));

export { useCameraStore, getDefaultCameraState }; 