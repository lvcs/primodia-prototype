import * as THREE from 'three';
import { throttle } from 'lodash';
import { PlanetCameraController } from './PlanetCameraController.js';
import { TileCameraController } from './TileCameraController.js';
import { CAMERA_VIEWS } from '@config/cameraConfig.js';
import { useCameraStore } from '@stores';

const ORBIT_CONTROLS_CHANGE_THROTTLE_MS = 100; // Throttle updates from orbit controls

/**
 * Camera manager that delegates to Planet and Tile controllers.
 * This class decides whether the camera should behave in 'planet' mode (viewing the whole planet)
 * or 'tile' mode (zoomed in on a specific tile/area), and delegates the actual camera movement
 * to the appropriate controller.
 */
export class Camera {
  /**
   * Create a Camera manager.
   * @param {THREE.Camera} threeJsCamera - The actual camera object from Three.js used to render the scene.
   * @param {THREE.Object3D} planetModel - The 3D model of the planet.
   * @param {Object} orbitControls - Controls for orbiting the camera around the planet.
   * @param {number} planetRadius - The radius of the planet.
   */
  constructor(threeJsCamera, planetModel, orbitControls, planetRadius) {
    // Store the camera object
    this.threeJsCamera = threeJsCamera;
    // Store the planet model
    this.planetModel = planetModel;
    // Store the controls for moving the camera
    this.orbitControls = orbitControls;
    // Store the planet's radius
    this.planetRadius = planetRadius;
    // Create a controller for planet view
    this.planetController = new PlanetCameraController(threeJsCamera, planetRadius);
    // Create a controller for tile view
    this.tileController = new TileCameraController(threeJsCamera, planetRadius);

    
    // Restore state from UI store or use default
    const { viewMode, position /*, zoom, tilt, target */ } = useCameraStore.getState();
    this.cameraMode = viewMode;
    // this.tileTarget = target; // tileTarget is set by setMode or animateToTile
    if (position) this.threeJsCamera.position.set(position.x, position.y, position.z);
    
    // Ensure PerspectiveCamera.zoom is 1. It's not for distance.
    if ('zoom' in this.threeJsCamera) {
        if (this.threeJsCamera.zoom !== 1) {
            this.threeJsCamera.zoom = 1;
            this.threeJsCamera.updateProjectionMatrix();
        }
    } else {
        // If it's not a PerspectiveCamera or CombinedCamera with a .zoom, this won't apply
        // but it's good practice to be aware.
    }

    // Optionally set tilt if needed

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

  // Method to clean up the event listener when Camera instance is no longer needed
  dispose() {
    if (this.orbitControls && this.throttledUpdateStoreFromOrbitControls) {
      this.orbitControls.removeEventListener('change', this.throttledUpdateStoreFromOrbitControls);
      this.throttledUpdateStoreFromOrbitControls.cancel(); // Cancel any pending throttled calls
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
      // Fallback: calculate distance from camera position to orbitControls target (usually 0,0,0 for planet)
      currentDistance = this.threeJsCamera.position.distanceTo(this.orbitControls.target || new THREE.Vector3(0,0,0));
    }

    if (explicitDistance !== null) {
      cameraStore.setZoom(explicitDistance); // Use explicitDistance for zoom
    } else {
      cameraStore.setZoom(currentDistance); // Use calculated/actual distance for zoom
    }

    cameraStore.setTilt(this.getTilt());
    if (targetCenter) {
      cameraStore.setTarget({ x: targetCenter.x, y: targetCenter.y, z: targetCenter.z });
    } else if (this.cameraMode === 'planet') { // Clear target if in planet mode and no specific target given
      cameraStore.setTarget(null);
    }
    // If in tile mode, the target should already be set by setMode or animateToTile's direct call before animation
  }

  /**
   * Set the camera mode to either 'planet' or 'tile'.
   * @param {'planet'|'tile'} mode - The desired camera mode.
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
   * Animate the camera to the planet view.
   * @param {Function} [onComplete] - Optional callback when animation finishes.
   */
  animateToPlanet(onComplete = () => {}) {
    // Switch to planet mode
    this.setMode('planet');
    // Delegate the animation to the planet controller
    this.planetController.animateToPlanet(() => {
      // Update UI store with new camera state
      this._updateCameraStoreState(null, CAMERA_VIEWS.planet.defaultPosition.y); // Planet view, use defined constant
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
      this._updateCameraStoreState(tileCenter, CAMERA_VIEWS.tile.defaultDistance); // Tile view, use defined constant
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
    // If in planet mode and the planet controller can provide the tilt, use it
    if (this.cameraMode === 'planet' && this.planetController.getTilt) {
      return this.planetController.getTilt();
    }
    // Default to 0 if tilt cannot be determined
    return 0;
  }
} 