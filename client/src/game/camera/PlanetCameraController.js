import * as THREE from 'three';
import { BaseCameraController } from './BaseCameraController.js';
import { CAMERA_VIEWS } from '@config/cameraConfig.js';

const PLANET_CONFIG = CAMERA_VIEWS.planet;

/**
 * Controls the camera when viewing the entire planet.
 * Inherits common camera logic from BaseCameraController.
 */
export class PlanetCameraController extends BaseCameraController {
  /**
   * Create a controller for planet view.
   * @param {THREE.Camera} threeJsCamera - The camera object from Three.js.
   * @param {number} planetRadius - The radius of the planet.
   */
  constructor(threeJsCamera, planetRadius) {
    // Call the parent class constructor to set up the camera and planet radius
    super(threeJsCamera, planetRadius);
  }

  _performPlanetAnimationStep(startPos, endPos, startZoom, endZoom, duration, easing, startTime, onComplete) {
    const elapsed = Date.now() - startTime;
    let progress = Math.min(elapsed / duration, 1);
    const eased = easing(progress);

    // Animate position along the direction
    const pos = startPos.clone().lerp(endPos, eased);
    this.threeJsCamera.position.copy(pos);

    // Animate zoom
    this.threeJsCamera.zoom = startZoom + (endZoom - startZoom) * eased;
    this.threeJsCamera.updateProjectionMatrix();

    // Always look at the center
    this.threeJsCamera.lookAt(0, 0, 0);

    if (progress < 1) {
      requestAnimationFrame(() => this._performPlanetAnimationStep(startPos, endPos, startZoom, endZoom, duration, easing, startTime, onComplete));
    } else {
      this.threeJsCamera.position.copy(endPos);
      this.threeJsCamera.zoom = endZoom;
      this.threeJsCamera.updateProjectionMatrix();
      this.threeJsCamera.lookAt(0, 0, 0);
      if (onComplete) onComplete();
    }
  }

  /**
   * Animate the camera to the planet view.
   * Only change the distance from the center along the current direction, always look at 0,0,0.
   * @param {Function} [onComplete] - Optional callback when animation finishes.
   */
  animateToPlanet(onComplete = () => {}) {
    // Get current direction from center to camera
    const currentPos = this.threeJsCamera.position.clone();
    const direction = currentPos.clone().normalize();
    const targetDistance = PLANET_CONFIG.defaultPosition.y; // Use y as the distance from center
    const endPos = direction.multiplyScalar(targetDistance);
    const startPos = this.threeJsCamera.position.clone();
    const startZoom = this.threeJsCamera.zoom;
    const endZoom = 1.0;
    const duration = PLANET_CONFIG.animation?.durationMs || 1000;
    const easing = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const startTime = Date.now();

    this._performPlanetAnimationStep(startPos, endPos, startZoom, endZoom, duration, easing, startTime, onComplete);
  }

  /**
   * Get the tilt angle of the camera relative to the planet center.
   * The tilt is how much the camera is angled from looking straight down/up.
   * @returns {number} The tilt angle in degrees.
   */
  getTilt() {
    const pos = this.threeJsCamera.position;
    const target = new THREE.Vector3(0, 0, 0);
    const dir = target.clone().sub(pos).normalize();
    const tiltRad = Math.acos(dir.y);
    return THREE.MathUtils.radToDeg(tiltRad);
  }
} 