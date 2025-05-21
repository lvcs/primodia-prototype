import * as THREE from 'three';
import { throttle } from 'lodash';
import { TileCameraController } from './TileCameraController.js';
import { CAMERA_VIEWS } from '@config/cameraConfig.js';
import { useCameraStore } from '@stores';

const ORBIT_CONTROLS_CHANGE_THROTTLE_MS = 100; // Throttle updates from orbit controls



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
    // Create a controller for tile view
    this.tileController = new TileCameraController(threeJsCamera, globeRadius);

    
    // Restore state from UI store or use default
    const { viewMode, position /*, zoom, tilt, target */ } = useCameraStore.getState();
    this.cameraMode = viewMode;
    // this.tileTarget = target; // tileTarget is set by setMode or animateToTile
    if (position) this.threeJsCamera.position.set(position.x, position.y, position.z);
    

    // Listen to orbitControls changes to update the store
    if (this.orbitControls) {
      this.throttledUpdateStoreFromOrbitControls = throttle(() => {
        // We call _updateCameraStoreState without explicitDistance, 
        // so it calculates distance from current orbitControls state.
        this._updateCameraStoreState(); 
      }, ORBIT_CONTROLS_CHANGE_THROTTLE_MS);

      this.orbitControls.addEventListener('change', this.throttledUpdateStoreFromOrbitControls);
    }
  }

  _updateCameraStoreState(targetCenter = null, explicitDistance = null) {
    const cameraStore = useCameraStore.getState();
    const position = this.threeJsCamera.position;
    cameraStore.setPosition({ x: position.x, y: position.y, z: position.z });

    let currentDistance;
    if (this.orbitControls && typeof this.orbitControls.getDistance === 'function') {
      currentDistance = this.orbitControls.getDistance();
    } else {
      // Fallback: calculate distance from camera position to orbitControls target (usually 0,0,0 for globe)
      currentDistance = this.threeJsCamera.position.distanceTo(this.orbitControls.target || new THREE.Vector3(0,0,0));
    }

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
      this._updateCameraStoreState(null, CAMERA_VIEWS.globe.defaultPosition.y); // Globe view, use defined constant
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
    animateToTileAlt(tile, () => {
      // Update UI store with new camera state
      this._updateCameraStoreState(tileCenter, CAMERA_VIEWS.tile.defaultDistance); // Tile view, use defined constant
      if (onComplete) onComplete();
    });
  }

  /**
   * Get the current tilt angle of the camera (how much it is angled from straight up/down).
   * @returns {number} The tilt angle in degrees.
   */
  getTilt() {
    return this.baseController.getTilt();
  }
} 

