import * as THREE from 'three';
import { GlobeCameraController } from './GlobeCameraController.js';
import { TileCameraController } from './TileCameraController.js';

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
    // Set the initial camera mode to 'globe' (viewing the whole globe)
    this.cameraMode = 'globe'; // 'globe' or 'tile'
    // Store the target tile (if in tile mode)
    this.tileTarget = null;
    // Create a controller for globe view
    this.globeController = new GlobeCameraController(globeModel);
    // Create a controller for tile view
    this.tileController = new TileCameraController(globeModel, globeRadius);
  }

  /**
   * Set the camera mode to either 'globe' or 'tile'.
   * @param {'globe'|'tile'} mode - The desired camera mode.
   * @param {THREE.Vector3|null} tileCenter - The center of the tile to focus on (if in tile mode).
   */
  setMode(mode, tileCenter = null) {
    this.cameraMode = mode;
    this.tileTarget = (mode === 'tile' && tileCenter) ? tileCenter.clone() : null;
    // Enable or disable orbit controls based on mode
    if (this.orbitControls) {
      this.orbitControls.enabled = (mode === 'globe');
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
    this.globeController.animateToGlobe(onComplete);
  }

  /**
   * Animate the camera to focus on a specific tile.
   * @param {{latitude: number, longitude: number}} tile - The tile to focus on.
   * @param {Function} [onComplete] - Optional callback when animation finishes.
   */
  animateToTile(tile, onComplete = () => {}) {
    // Switch to tile mode and set the target tile
    this.setMode('tile', this.tileController.latLonToWorld(tile.latitude, tile.longitude));
    // Delegate the animation to the tile controller
    this.tileController.animateToTile(tile, onComplete);
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