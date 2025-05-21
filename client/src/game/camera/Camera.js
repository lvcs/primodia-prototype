import * as THREE from 'three';
import { GlobeCameraController } from './GlobeCameraController.js';
import { TileCameraController } from './TileCameraController.js';
import { CAMERA_VIEWS } from '@config/cameraParameters.js';
import { useCameraStore } from '@stores';

/**
 * Camera manager that delegates to Globe and Tile controllers.
 * This class decides whether the camera should behave in 'globe' mode (viewing the whole globe)
 * or 'tile' mode (zoomed in on a specific tile/area), and delegates the actual camera movement
 * to the appropriate controller.
 */
export class Camera {
  /**
   * Create a Camera manager.
   * @param {THREE.Camera} threeJsCamera - The actual camera object from Three.js used to render the scene.
   * @param {THREE.Object3D} globeModel - The 3D model of the globe.
   * @param {Object} orbitControls - Controls for orbiting the camera around the globe.
   * @param {number} globeRadius - The radius of the globe.
   */
  constructor(threeJsCamera, globeModel, orbitControls, globeRadius) {
    // Store the camera object
    this.threeJsCamera = threeJsCamera;
    // Store the globe model
    this.globeModel = globeModel;
    // Store the controls for moving the camera
    this.orbitControls = orbitControls;
    // Store the globe's radius
    this.globeRadius = globeRadius;
    // Create a controller for globe view
    this.globeController = new GlobeCameraController(threeJsCamera, globeRadius);
    // Create a controller for tile view
    this.tileController = new TileCameraController(threeJsCamera, globeRadius);

    // Restore state from UI store or use default
    const { viewMode, position, zoom, tilt, target } = useCameraStore.getState();
    this.cameraMode = viewMode;
    this.tileTarget = target;
    if (position) this.threeJsCamera.position.set(position.x, position.y, position.z);
    if (zoom && 'zoom' in this.threeJsCamera) {
      this.threeJsCamera.zoom = zoom;
      this.threeJsCamera.updateProjectionMatrix();
    }
    // Optionally set tilt if needed
  }

  _updateCameraStoreState(targetCenter = null, explicitZoom = null) {
    const cameraStore = useCameraStore.getState();
    const position = this.threeJsCamera.position;
    cameraStore.setPosition({ x: position.x, y: position.y, z: position.z });

    if (explicitZoom !== null && 'zoom' in this.threeJsCamera) {
      cameraStore.setZoom(explicitZoom);
    } else if ('zoom' in this.threeJsCamera) { // Fallback if no explicit zoom given
      cameraStore.setZoom(this.threeJsCamera.zoom);
    }

    cameraStore.setTilt(this.getTilt());
    if (targetCenter) {
      cameraStore.setTarget({ x: targetCenter.x, y: targetCenter.y, z: targetCenter.z });
    } else if (this.cameraMode === 'globe') { // Clear target if in globe mode and no specific target given
      cameraStore.setTarget(null);
    }
    // If in tile mode, the target should already be set by setMode or animateToTile's direct call before animation
  }

  /**
   * Set the camera mode to either 'globe' or 'tile'.
   * @param {'globe'|'tile'} mode - The desired camera mode.
   * @param {THREE.Vector3|null} tileCenter - The center of the tile to focus on (if in tile mode).
   */
  setMode(mode, tileCenter = null) {
    // Set the camera mode
    this.cameraMode = mode;
    // If in tile mode and a tile center is provided, store a copy of it; otherwise, clear the tile target
    this.tileTarget = (mode === 'tile' && tileCenter) ? tileCenter.clone() : null;
    useCameraStore.getState().setViewMode(mode);
    if (mode === 'tile' && tileCenter) {
      useCameraStore.getState().setTarget({ x: tileCenter.x, y: tileCenter.y, z: tileCenter.z });
    } else {
      useCameraStore.getState().setTarget(null);
    }
  }

  /**
   * Animate the camera to the globe view.
   * @param {Function} [onComplete] - Optional callback when animation finishes.
   */
  animateToGlobe(onComplete = () => {}) {
    // Switch to globe mode
    this.setMode('globe');
    // Delegate the animation to the globe controller
    this.globeController.animateToGlobe(() => {
      // Update UI store with new camera state
      this._updateCameraStoreState(null, 1.0); // Globe view, explicit zoom 1.0
      if (onComplete) onComplete();
    });
  }

  /**
   * Animate the camera to focus on a specific tile.
   * @param {{latitude: number, longitude: number}} tile - The tile to focus on.
   * @param {Function} [onComplete] - Optional callback when animation finishes.
   */
  animateToTile(tile, onComplete = () => {}) {
    // Switch to tile mode and set the target tile
    const tileCenter = this.tileController.latLonToWorld(tile.latitude, tile.longitude);
    this.setMode('tile', tileCenter);
    // Delegate the animation to the tile controller
    this.tileController.animateToTile(tile, () => {
      // Update UI store with new camera state
      this._updateCameraStoreState(tileCenter, 1.0); // Tile view, explicit zoom 1.0
      if (onComplete) onComplete();
    });
  }

  /**
   * Get the current tilt angle of the camera (how much it is angled from straight up/down).
   * @returns {number} The tilt angle in degrees.
   */
  getTilt() {
    // If in tile mode and the tile controller can provide the tilt, use it
    if (this.cameraMode === 'tile' && this.tileController.getTilt) {
      return this.tileController.getTilt();
    }
    // If in globe mode and the globe controller can provide the tilt, use it
    if (this.cameraMode === 'globe' && this.globeController.getTilt) {
      return this.globeController.getTilt();
    }
    // Default to 0 if tilt cannot be determined
    return 0;
  }
} 