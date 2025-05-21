import { create } from 'zustand';
import * as THREE from 'three';

import { 
  CAMERA_VIEWS, 
  GLOBE_VIEW_CAMERA_DISTANCE, 
  TILE_VIEW_CAMERA_DISTANCE 
} from '@config/cameraConfig';
import {
  CAMERA_FOV,
  CAMERA_NEAR_PLANE,
  CAMERA_FAR_PLANE,
  CAMERA_MIN_DISTANCE_FROM_CENTER,
  CAMERA_MAX_DISTANCE_FROM_CENTER
} from '@config/gameConfig';

// Helper to get default camera state
const getDefaultCameraState = (viewMode = 'globe') => {
  const defaultPosition = new THREE.Vector3(0, 0, 0);
  const defaultTarget = new THREE.Vector3(0, 0, 0);
  const defaultUp = new THREE.Vector3(0, 1, 0);
  
  switch (viewMode) {
    case 'tile':
      defaultPosition.set(0, 0, TILE_VIEW_CAMERA_DISTANCE);
      break;
    case 'globe':
    default:
      defaultPosition.set(0, 0, GLOBE_VIEW_CAMERA_DISTANCE);
      break;
  }
  
  return {
    position: defaultPosition,
    target: defaultTarget,
    up: defaultUp,
    viewMode,
    isAnimating: false,
    zoom: GLOBE_VIEW_CAMERA_DISTANCE, // Add default zoom value
    phi: 0, // Add default phi value
    theta: 0, // Add default theta value
    fov: CAMERA_FOV,
    near: CAMERA_NEAR_PLANE,
    far: CAMERA_FAR_PLANE
  };
};

const useCameraStore = create((set, get) => ({
  // State
  ...getDefaultCameraState('globe'),
  
  // Actions
  setTarget: (target) => set({ 
    target: target instanceof THREE.Vector3 ? target : new THREE.Vector3(target.x, target.y, target.z) 
  }),
  
  setPosition: (position) => set({ 
    position: position instanceof THREE.Vector3 ? position : new THREE.Vector3(position.x, position.y, position.z) 
  }),
  
  setUpVector: (up) => set({ 
    up: up instanceof THREE.Vector3 ? up : new THREE.Vector3(up.x, up.y, up.z) 
  }),
  
  setViewMode: (viewMode) => set({ viewMode }),
  
  setAnimating: (isAnimating) => set({ isAnimating }),

  // Add the missing setZoom method
  setZoom: (zoom) => set({ zoom }),

  // Add methods for phi and theta
  setPhi: (phi) => set({ phi }),
  setTheta: (theta) => set({ theta }),
  
  syncFromOrbitControls: ({ position, target, up }) => set({
    position: position instanceof THREE.Vector3 ? position : new THREE.Vector3(position.x, position.y, position.z),
    target: target instanceof THREE.Vector3 ? target : new THREE.Vector3(target.x, target.y, target.z),
    up: up instanceof THREE.Vector3 ? up : new THREE.Vector3(up.x, up.y, up.z)
  }),
  
  // Reset to defaults for a given view mode
  resetToDefaults: (viewMode = 'globe') => set(getDefaultCameraState(viewMode))
}));

export { useCameraStore }; 