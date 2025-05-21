import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useCameraStore } from '@stores/cameraStore';
import { 
  DEFAULT_ANIMATION_DURATION_MS, 
  DEFAULT_EASING_CURVE,
  CAMERA_VIEWS
} from '@config/cameraConfig';
import {
  CAMERA_FOV,
  CAMERA_NEAR_PLANE,
  CAMERA_FAR_PLANE,
  CAMERA_MIN_DISTANCE_FROM_CENTER,
  CAMERA_MAX_DISTANCE_FROM_CENTER,
  GLOBE_RADIUS
} from '@config/gameConfig';
import { animate } from './animationUtils';

// Private module state
let camera = null;
let controls = null;
let canvasEl = null;

/**
 * Initializes the camera system with Three.js camera and OrbitControls
 * @param {HTMLCanvasElement} canvasElement - The canvas element for rendering
 * @param {Object} initialWorldConfig - World configuration object with radius
 * @returns {Object} - The camera and controls instances
 */
export function initializeCameraSystem(canvasElement, initialWorldConfig) {
  if (!canvasElement) {
    throw new Error('Canvas element is required to initialize camera system');
  }

  canvasEl = canvasElement;
  
  // Get initial camera state from store
  const cameraState = useCameraStore.getState();
  const aspectRatio = canvasElement.clientWidth / canvasElement.clientHeight;
  
  // Create and configure camera
  camera = new THREE.PerspectiveCamera(
    cameraState.fov || CAMERA_FOV,
    aspectRatio,
    cameraState.near || CAMERA_NEAR_PLANE,
    cameraState.far || CAMERA_FAR_PLANE
  );
  
  // Create and configure controls
  controls = new OrbitControls(camera, canvasElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = CAMERA_MIN_DISTANCE_FROM_CENTER;
  controls.maxDistance = CAMERA_MAX_DISTANCE_FROM_CENTER;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI;
  
  // Set initial position from store or default
  camera.position.copy(cameraState.position || new THREE.Vector3(0, 0, CAMERA_VIEWS.globe.defaultPosition.y));
  controls.target.copy(cameraState.target || new THREE.Vector3(0, 0, 0));
  camera.up.copy(cameraState.up || new THREE.Vector3(0, 1, 0));
  
  // Initial update of controls
  controls.update();
  
  // Setup two-way synchronization between controls and store
  
  // Controls to Store: When user interacts with OrbitControls
  controls.addEventListener('change', () => {
    useCameraStore.getState().syncFromOrbitControls({
      position: controls.object.position.clone(),
      target: controls.target.clone(),
      up: controls.object.up.clone()
    });
  });
  
  // Store to Controls: Subscribe to store changes
  const unsubscribe = useCameraStore.subscribe((state, prevState) => {
    // Only update controls if changes came from somewhere other than controls themselves
    // and if we're not currently animating
    if (!state.isAnimating && 
        (!state.position.equals(prevState.position) || 
         !state.target.equals(prevState.target) || 
         !state.up.equals(prevState.up))) {
      
      // Update controls properties
      controls.object.position.copy(state.position);
      controls.target.copy(state.target);
      controls.object.up.copy(state.up);
      controls.update();
    }
  });
  
  return { camera, controls };
}

/**
 * Changes the camera look-at target
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} z - Z coordinate
 * @param {boolean} animate - Whether to animate the transition
 * @param {number} durationMs - Animation duration in milliseconds
 * @param {Function} easing - Easing function for animation
 * @param {Function} onComplete - Callback after animation completes
 * @returns {Promise<void>}
 */
export function lookAt(x, y, z, animate = true, durationMs, easing, onComplete) {
  if (!controls) return Promise.reject(new Error('Camera system not initialized'));
  
  const target = new THREE.Vector3(x, y, z);
  
  if (!animate) {
    controls.target.copy(target);
    controls.update();
    useCameraStore.getState().setTarget(target);
    if (onComplete) onComplete();
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    const startTarget = controls.target.clone();
    const duration = durationMs || DEFAULT_ANIMATION_DURATION_MS;
    const easingFn = easing || DEFAULT_EASING_CURVE;
    
    useCameraStore.getState().setAnimating(true);
    
    animate({
      duration,
      easing: easingFn,
      onUpdate: (progress) => {
        controls.target.lerpVectors(startTarget, target, progress);
        controls.update();
      },
      onComplete: () => {
        useCameraStore.getState().setAnimating(false);
        useCameraStore.getState().setTarget(target);
        if (onComplete) onComplete();
        resolve();
      }
    });
  });
}

/**
 * Gets the current look-at target
 * @returns {Object} - {x, y, z} coordinates
 */
export function getLookAt() {
  if (!controls) return { x: 0, y: 0, z: 0 };
  
  return {
    x: controls.target.x,
    y: controls.target.y,
    z: controls.target.z
  };
}

/**
 * Gets the current camera position
 * @returns {Object} - {x, y, z} coordinates
 */
export function getCameraPosition() {
  if (!camera) return { x: 0, y: 0, z: 0 };
  
  return {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z
  };
}

/**
 * Sets the camera distance from target
 * @param {number} distance - The distance from target
 * @param {boolean} animate - Whether to animate the transition
 * @param {number} durationMs - Animation duration in milliseconds
 * @param {Function} easing - Easing function for animation
 * @param {Function} onComplete - Callback after animation completes
 * @returns {Promise<void>}
 */
export function setDistance(distance, animate = true, durationMs, easing, onComplete) {
  if (!controls || !camera) return Promise.reject(new Error('Camera system not initialized'));
  
  const direction = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
  const targetPosition = new THREE.Vector3().copy(controls.target).add(direction.multiplyScalar(distance));
  
  if (!animate) {
    camera.position.copy(targetPosition);
    controls.update();
    useCameraStore.getState().setPosition(targetPosition);
    if (onComplete) onComplete();
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    const startPosition = camera.position.clone();
    const duration = durationMs || DEFAULT_ANIMATION_DURATION_MS;
    const easingFn = easing || DEFAULT_EASING_CURVE;
    
    useCameraStore.getState().setAnimating(true);
    
    animate({
      duration,
      easing: easingFn,
      onUpdate: (progress) => {
        camera.position.lerpVectors(startPosition, targetPosition, progress);
        controls.update();
      },
      onComplete: () => {
        useCameraStore.getState().setAnimating(false);
        useCameraStore.getState().setPosition(targetPosition);
        if (onComplete) onComplete();
        resolve();
      }
    });
  });
}

/**
 * Gets the current distance from camera to target
 * @returns {number} - The distance
 */
export function getDistance() {
  if (!controls) return 0;
  return controls.getDistance();
}

/**
 * Checks if the camera is currently animating
 * @returns {boolean} - Whether the camera is animating
 */
export function isAnimating() {
  return useCameraStore.getState().isAnimating;
}

/**
 * Converts latitude and longitude to XYZ coordinates
 * @param {number} latitude - Latitude in degrees
 * @param {number} longitude - Longitude in degrees
 * @param {number} radius - Radius for the coordinates (defaults to GLOBE_RADIUS)
 * @returns {Object} - {x, y, z} coordinates
 */
export function latitudeLongitudeToXYZ(latitude, longitude, radius = GLOBE_RADIUS) {
  const phi = (90 - latitude) * (Math.PI / 180);
  const theta = (longitude + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return { x, y, z };
}

/**
 * Sets the camera view mode
 * @param {string} mode - The view mode (e.g., 'globe', 'tile')
 * @param {boolean} animate - Whether to animate the transition
 * @param {number} durationMs - Animation duration in milliseconds
 * @param {Function} easing - Easing function for animation
 * @param {Function} onComplete - Callback after animation completes
 * @returns {Promise<void>}
 */
export function setViewMode(mode, animate = true, durationMs, easing, onComplete) {
  if (!controls || !camera) return Promise.reject(new Error('Camera system not initialized'));
  
  const viewConfig = CAMERA_VIEWS[mode];
  if (!viewConfig) return Promise.reject(new Error(`Invalid view mode: ${mode}`));
  
  const targetPosition = new THREE.Vector3().copy(viewConfig.defaultPosition);
  const targetTarget = new THREE.Vector3(0, 0, 0); // Usually looking at center
  
  if (!animate) {
    camera.position.copy(targetPosition);
    controls.target.copy(targetTarget);
    controls.update();
    
    useCameraStore.getState().setViewMode(mode);
    useCameraStore.getState().setPosition(targetPosition);
    useCameraStore.getState().setTarget(targetTarget);
    
    if (onComplete) onComplete();
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const duration = durationMs || viewConfig.animation?.durationMs || DEFAULT_ANIMATION_DURATION_MS;
    const easingFn = easing || viewConfig.animation?.easing || DEFAULT_EASING_CURVE;
    
    useCameraStore.getState().setAnimating(true);
    useCameraStore.getState().setViewMode(mode);
    
    animate({
      duration,
      easing: easingFn,
      onUpdate: (progress) => {
        camera.position.lerpVectors(startPosition, targetPosition, progress);
        controls.target.lerpVectors(startTarget, targetTarget, progress);
        controls.update();
      },
      onComplete: () => {
        useCameraStore.getState().setAnimating(false);
        useCameraStore.getState().setPosition(targetPosition);
        useCameraStore.getState().setTarget(targetTarget);
        if (onComplete) onComplete();
        resolve();
      }
    });
  });
}

/**
 * Gets the current camera view mode
 * @returns {string} - The view mode
 */
export function getViewMode() {
  return useCameraStore.getState().viewMode;
}

/**
 * Focuses the camera on a specific latitude and longitude
 * @param {number} latitude - Latitude in degrees
 * @param {number} longitude - Longitude in degrees
 * @param {number} distance - Distance from the point
 * @param {boolean} animate - Whether to animate the transition
 * @param {number} durationMs - Animation duration in milliseconds
 * @param {Function} easing - Easing function for animation
 * @param {Function} onComplete - Callback after animation completes
 * @returns {Promise<void>}
 */
export function focusOnLatLong(latitude, longitude, distance, animate = true, durationMs, easing, onComplete) {
  const point = latitudeLongitudeToXYZ(latitude, longitude);
  
  return new Promise((resolve) => {
    lookAt(point.x, point.y, point.z, animate, durationMs, easing)
      .then(() => setDistance(distance, animate, durationMs, easing))
      .then(() => {
        if (onComplete) onComplete();
        resolve();
      });
  });
}

/**
 * Gets the camera instance
 * @returns {THREE.PerspectiveCamera|null} - The camera instance
 */
export function getCameraInstance() {
  return camera;
}

/**
 * Gets the controls instance
 * @returns {OrbitControls|null} - The controls instance
 */
export function getControlsInstance() {
  return controls;
} 