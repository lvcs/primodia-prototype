import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useCameraStore, getDefaultCameraState } from '@stores/cameraStore';
import * as GameConfig from '@config/gameConfig'; // For CAMERA_MIN_DISTANCE_FACTOR, etc.
import { CAMERA_VIEWS, DEFAULT_ANIMATION_DURATION_MS, DEFAULT_EASING_CURVE } from '@config/cameraConfig';

let managedCamera = null;
let managedControls = null;
let unsubscribeFromStore = null;
let isApplyingStoreToControls = false; // Flag to prevent feedback loops

// Define handleControlsChange in module scope
const handleControlsChange = () => {
  if (isApplyingStoreToControls || !managedControls) return; // Prevent feedback loop & ensure controls exist

  useCameraStore.getState().syncFromOrbitControls(
    managedControls.object.position, // camera.position
    managedControls.target,          // controls.target
    managedControls.object.up        // camera.up
  );
};

// Function to apply store state to controls and camera
function applyStateToControls(state) {
  if (managedControls && managedCamera) {
    let needsUpdate = false;
    isApplyingStoreToControls = true; // Set flag before applying changes

    // Sync target
    if (!managedControls.target.equals(state.target)) {
      managedControls.target.copy(state.target);
      needsUpdate = true;
    }

    // Sync position
    // Only update controls' position if it's different AND we are not in the middle of a controls-driven update
    // This helps prevent fighting between store updates and OrbitControls internal updates.
    if (!managedControls.object.position.equals(state.position)) {
      managedControls.object.position.copy(state.position);
      needsUpdate = true;
    }

    // Sync up vector
    if (!managedCamera.up.equals(state.up)) {
      managedCamera.up.copy(state.up);
      // OrbitControls updates its internal up representation during .update()
      // if the camera's up vector has changed.
      needsUpdate = true;
    }

    // Sync FOV, near, far for PerspectiveCamera
    if (managedCamera.fov !== state.fov) {
      managedCamera.fov = state.fov;
      managedCamera.updateProjectionMatrix();
    }
    if (managedCamera.near !== state.near || managedCamera.far !== state.far) {
      managedCamera.near = state.near;
      managedCamera.far = state.far;
      managedCamera.updateProjectionMatrix();
    }

    if (needsUpdate) {
      managedControls.update();
    }
    isApplyingStoreToControls = false; // Clear flag after applying changes
  }
}

/**
 * @file camera.js
 * @description This module provides a functional API for controlling the camera system.
 */

/**
 * Initializes the camera system, creating and configuring the THREE.PerspectiveCamera
 * and OrbitControls instances. It also sets up two-way synchronization between
 * these instances and the cameraStore.
 *
 * @param {HTMLCanvasElement} canvasElement - The canvas element for OrbitControls.
 * @param {object} initialWorldConfig - Configuration for the world, e.g., radius for setting control limits.
 * @returns {{ camera: THREE.PerspectiveCamera, controls: OrbitControls }} The created camera and controls instances.
 */
export const initializeCameraSystem = (canvasElement, initialWorldConfig) => {
  if (managedCamera || managedControls) {
    console.warn('Camera system already initialized. Re-initializing may lead to issues. Please ensure cleanup of previous instances if this is intended.');
    // Cleanup previous instances and subscriptions if any
    if (unsubscribeFromStore) {
      unsubscribeFromStore();
      unsubscribeFromStore = null;
    }
    if (managedControls) {
      managedControls.removeEventListener('change', handleControlsChange); // Now handleControlsChange is defined in an accessible scope
      managedControls.dispose();
      managedControls = null;
    }
    managedCamera = null; // Assuming camera is managed with controls
  }

  const initialStoreState = useCameraStore.getState();

  // 1. Create PerspectiveCamera
  // Ensure canvasElement has valid dimensions for aspect ratio
  const aspectRatio = (canvasElement && canvasElement.clientWidth > 0 && canvasElement.clientHeight > 0)
    ? canvasElement.clientWidth / canvasElement.clientHeight
    : window.innerWidth / window.innerHeight; // Fallback or default

  managedCamera = new THREE.PerspectiveCamera(
    initialStoreState.fov,
    aspectRatio,
    initialStoreState.near,
    initialStoreState.far
  );
  managedCamera.position.copy(initialStoreState.position);
  managedCamera.up.copy(initialStoreState.up);
  // Set initial lookAt for the camera itself, though OrbitControls will manage this primarily.
  managedCamera.lookAt(initialStoreState.target);


  // 2. Create OrbitControls
  if (!canvasElement) {
    console.error("initializeCameraSystem: canvasElement is null or undefined. OrbitControls cannot be initialized.");
    return { camera: managedCamera, controls: null }; // Return early or throw error
  }
  managedControls = new OrbitControls(managedCamera, canvasElement);

  // 3. Configure OrbitControls
  managedControls.enableDamping = true;
  managedControls.dampingFactor = 0.05; // A common default
  managedControls.enablePan = true; // Requirement: "The CameraOrbitControls should allow panning (disabled in old code)" - PRD007
  // Pan speed can be adjusted if necessary: managedControls.panSpeed = 0.5; (default is 1)

  const worldRadius = initialWorldConfig && typeof initialWorldConfig.radius === 'number'
    ? initialWorldConfig.radius
    : GameConfig.GLOBE_RADIUS; // Fallback to default globe radius

  managedControls.minDistance = worldRadius * GameConfig.CAMERA_MIN_DISTANCE_FACTOR;
  managedControls.maxDistance = worldRadius * GameConfig.CAMERA_MAX_DISTANCE_FACTOR;

  managedControls.minPolarAngle = 0; // Default: 0
  managedControls.maxPolarAngle = Math.PI; // Default: Math.PI (allows looking from below)

  // Set initial position and target on controls from store state
  // The camera's position is already set. OrbitControls will use this.
  managedControls.target.copy(initialStoreState.target);
  managedControls.update(); // Crucial to apply initial target and make controls aware of camera's position

  // 4. Controls to Store Sync
  // The handleControlsChange function is now defined at module scope.
  managedControls.addEventListener('change', handleControlsChange);

  // 5. Store to Controls Sync
  // Subscribe to store changes.
  // The `applyStateToControls` function will be called when the store changes.
  if (unsubscribeFromStore) { // Clean up any potential old subscription
      unsubscribeFromStore();
  }
  unsubscribeFromStore = useCameraStore.subscribe(
    (currentState, prevState) => {
      // Optimization: Check if relevant parts of the state have changed
      // This basic check can be expanded if needed.
      if (
        !currentState.position.equals(prevState.position) ||
        !currentState.target.equals(prevState.target) ||
        !currentState.up.equals(prevState.up) ||
        currentState.fov !== prevState.fov ||
        currentState.near !== prevState.near ||
        currentState.far !== prevState.far
      ) {
        applyStateToControls(currentState);
      }
    }
  );

  // Apply the initial store state to ensure controls are perfectly in sync from the start.
  // This is important if subscribe doesn't fire immediately with the current state.
  applyStateToControls(initialStoreState);

  console.log('Camera system initialized.', { camera: managedCamera, controls: managedControls });
  return { camera: managedCamera, controls: managedControls };
};

export function getCameraInstance() {
  return managedCamera;
}

export function getControlsInstance() {
  return managedControls;
}

// Phase 2: Basic API Implementation

export function getLookAt() {
  return useCameraStore.getState().target; // Returns a THREE.Vector3 instance from the store
}

export function getCameraPosition() {
  return useCameraStore.getState().position; // Returns a THREE.Vector3 instance from the store
}

export function getDistance() {
  if (managedControls) {
    return managedControls.getDistance();
  }
  // Fallback or error if controls not initialized - though they should be if API is used post-init
  console.warn('getDistance called before OrbitControls initialized or available.');
  const state = useCameraStore.getState();
  return state.position.distanceTo(state.target);
}

export function getViewMode() {
  return useCameraStore.getState().viewMode;
}

export function isAnimating() {
  return useCameraStore.getState().isAnimating;
}

export function latitudeLongitudeToXYZ(latitude, longitude, radius = GameConfig.GLOBE_RADIUS) {
  const latRad = THREE.MathUtils.degToRad(latitude);
  const lonRad = THREE.MathUtils.degToRad(longitude);

  // Standard formula: Y up, Z forward from X=0, Long=0 point
  // X = R * cos(lat) * sin(lon)
  // Y = R * sin(lat)
  // Z = R * cos(lat) * cos(lon)
  // Three.js globe usually has Y as polar axis, X towards (lat=0,lon=0), Z towards (lat=0,lon=90)
  // If Longitude=0 is +X axis, Longitude=90 is +Z axis (right-handed system)
  // X = R * cos(lat) * cos(lon) 
  // Y = R * sin(lat)
  // Z = R * cos(lat) * sin(lon) <-- this is often seen if +Z is lon=90deg

  // Assuming standard geographic to Cartesian: X towards prime meridian, Y towards north pole, Z towards 90deg East.
  // However, Three.js default sphere geometry might have different conventions if not explicitly handled.
  // Let's use a common convention which places (lat=0, lon=0) on +X axis, (lat=90,lon=0) on +Y axis.
  const x = radius * Math.cos(latRad) * Math.cos(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.sin(lonRad); // For lon=0 to be along X, lon=90 along Z

  return new THREE.Vector3(x, y, z);
}

// TODO: Implement other camera API functions (lookAt, setDistance, etc.)
// These functions will typically call actions on useCameraStore, and the
// store-to-controls sync will handle updating the OrbitControls instance.

export function lookAt(x, y, z, animate = false, duration = 1000, easing = null) {
  const targetPosition = new THREE.Vector3(x, y, z);
  if (!managedControls) {
    console.warn('lookAt called before OrbitControls initialized. Updating store directly.');
    useCameraStore.getState().setTarget(targetPosition);
    // Potentially update camera position as well if OrbitControls would have done so.
    // For now, just setting target. If camera needs to re-orient, that's more complex without controls.
    return;
  }

  if (!animate) {
    managedControls.target.copy(targetPosition);
    managedControls.update(); // This will trigger the 'change' event and sync to store.
  } else {
    // Animation logic will be added in a subsequent step (Phase 3)
    // For now, deferring actual animation implementation.
    // Placeholder: Set target and update store, then controls will eventually sync.
    console.log(`Animation for lookAt to (${x},${y},${z}) over ${duration}ms requested (not yet implemented).`);
    // Directly setting target for now, animation to be added.
    managedControls.target.copy(targetPosition);
    managedControls.update(); 
    // Or, if we want the store to be the source of truth first:
    // useCameraStore.getState().setTarget(targetPosition);
    // The store subscription in initializeCameraSystem will then call applyStateToControls.
  }
}

export function setDistance(distance, animate = false, duration = 1000, easing = null) {
  if (!managedControls || !managedCamera) {
    console.warn('setDistance called before OrbitControls or Camera initialized. Cannot calculate new position.');
    // Potentially update a 'desiredDistance' in store if that makes sense for your logic.
    return;
  }

  // Calculate the new camera position based on the current target and the new distance.
  // The camera should move along the line connecting the current camera position and the target.
  const direction = new THREE.Vector3();
  direction.subVectors(managedCamera.position, managedControls.target).normalize();
  const newPosition = new THREE.Vector3();
  newPosition.copy(managedControls.target).addScaledVector(direction, distance);

  if (!animate) {
    managedControls.object.position.copy(newPosition);
    managedControls.update(); // This will trigger the 'change' event and sync to store.
  } else {
    // Animation logic will be added in a subsequent step (Phase 3)
    console.log(`Animation for setDistance to ${distance} over ${duration}ms requested (not yet implemented).`);
    // Directly setting position for now, animation to be added.
    managedControls.object.position.copy(newPosition);
    managedControls.update();
    // Or, if we want the store to be the source of truth first:
    // useCameraStore.getState().setPosition(newPosition);
    // The store subscription will then update controls.
  }
}

export function setViewMode(mode, animate = false, duration = null, easing = null) {
  const viewConfig = CAMERA_VIEWS[mode];
  if (!viewConfig) {
    console.warn(`setViewMode: Unknown view mode "${mode}"`);
    return;
  }

  if (!managedControls || !managedCamera) {
    console.warn('setViewMode called before OrbitControls or Camera initialized.');
    // Update store directly, controls will pick up on next sync if they get initialized later.
    useCameraStore.getState().setViewMode(mode);
    // Note: This won't apply position/target/up from viewConfig without controls.
    return;
  }

  // Determine animation parameters
  const animDuration = duration !== null ? duration : (viewConfig.animation?.durationMs || DEFAULT_ANIMATION_DURATION_MS);
  const animEasing = easing !== null ? easing : (viewConfig.animation?.easing || DEFAULT_EASING_CURVE);

  // Target state from viewConfig (adapt as needed based on actual viewConfig structure)
  // This is a placeholder for how you might derive target, position, up from viewConfig
  // For example, if viewConfig provides a specific target, position, or up vector:
  const newTarget = viewConfig.defaultTarget ? new THREE.Vector3().copy(viewConfig.defaultTarget) : managedControls.target.clone(); // Keep current target if not specified
  let newPosition;
  // Example: if viewConfig has a fixed position or a distance/direction
  if (viewConfig.defaultPosition) {
    newPosition = new THREE.Vector3().copy(viewConfig.defaultPosition);
  } else if (typeof viewConfig.defaultDistance === 'number') {
    const direction = new THREE.Vector3().subVectors(managedCamera.position, managedControls.target).normalize();
    newPosition = new THREE.Vector3().copy(managedControls.target).addScaledVector(direction, viewConfig.defaultDistance);
  } else {
    newPosition = managedCamera.position.clone(); // Keep current position if not specified
  }
  const newUp = viewConfig.defaultUp ? new THREE.Vector3().copy(viewConfig.defaultUp) : managedCamera.up.clone(); // Keep current up if not specified


  if (!animate) {
    if (viewConfig.defaultTarget) managedControls.target.copy(newTarget);
    if (newPosition) managedControls.object.position.copy(newPosition);
    if (viewConfig.defaultUp) managedCamera.up.copy(newUp); // Also update camera.up
    
    managedControls.update(); // Syncs to store via 'change' event
    useCameraStore.getState().setViewMode(mode); // Update the mode in the store
  } else {
    console.log(`Animation for setViewMode to "${mode}" over ${animDuration}ms requested (not yet implemented).`);
    // Animation logic placeholder
    // For now, directly set and update store
    if (viewConfig.defaultTarget) managedControls.target.copy(newTarget);
    if (newPosition) managedControls.object.position.copy(newPosition);
    if (viewConfig.defaultUp) managedCamera.up.copy(newUp);

    managedControls.update();
    useCameraStore.getState().setViewMode(mode);
    // Future: useCameraStore.getState().setAnimating(true);
    // Animate controls.target, controls.object.position, camera.up
    // On complete: useCameraStore.getState().setAnimating(false);
  }
}

export function focusOnLatLong(latitude, longitude, distance, animate = false, duration = 1000, easing = null) {
  const targetPosition = latitudeLongitudeToXYZ(latitude, longitude, GameConfig.GLOBE_RADIUS); // Assuming target is on the globe surface

  // First, lookAt the target position.
  // If animating, the lookAt animation should complete before setDistance animation starts, or they should be coordinated.
  // For simplicity without full animation lib, we can do them sequentially if animating, or instantly if not.

  if (!animate) {
    lookAt(targetPosition.x, targetPosition.y, targetPosition.z, false);
    setDistance(distance, false);
  } else {
    // Placeholder for sequenced or combined animation
    console.log(`Animation for focusOnLatLong to (${latitude},${longitude}), distance ${distance} over ${duration}ms requested (not yet implemented).`);
    // For now, apply them sequentially without true animation coordination.
    // A proper animation system would handle this more gracefully.
    lookAt(targetPosition.x, targetPosition.y, targetPosition.z, true, duration / 2, easing); // Split duration for example
    // Ideally, setDistance would be called in the onComplete callback of lookAt animation.
    // Without that, this is a rough approximation.
    setTimeout(() => {
        setDistance(distance, true, duration / 2, easing);
    }, duration / 2); // Example of a simple delay, not robust animation chaining.

    // A more robust approach for non-animated during animation development:
    // lookAt(targetPosition.x, targetPosition.y, targetPosition.z, false);
    // setDistance(distance, false);
    // console.warn("Animation for focusOnLatLong not fully implemented, applying instant changes.");
  }
  // Note: The PLAN mentions chaining. A true chain would involve promises or callbacks from animated functions.
  // The current implementation of lookAt/setDistance animation placeholders would need to be expanded for this.
}

// TODO: Implement camera API functions as per PLAN.md and Requirements.md 