import * as THREE from 'three';
import { CAMERA_DEFAULT_ANIMATION_DURATION_MS, CAMERA_DEFAULT_EASING_CURVE } from '@config/cameraConfig';

/**
 * Base class for camera controllers.
 * Provides common logic for moving and animating the camera.
 */
export class BaseCameraController {
  /**
   * Create a base camera controller.
   * @param {THREE.Camera} threeJsCamera - The camera object from Three.js.
   * @param {number} planetRadius - The radius of the planet in kilometers (1 unit = 1 km).
   */
  constructor(threeJsCamera, planetRadius) {
    // Store the camera object
    this.threeJsCamera = threeJsCamera;
    // Store the planet's radius in kilometers
    this.planetRadius = planetRadius;
    // Store animation configuration
    this.config = {
      ANIMATION_DURATION_MS: CAMERA_DEFAULT_ANIMATION_DURATION_MS,
      EASING_CURVE: CAMERA_DEFAULT_EASING_CURVE,
    };
    // Track if the camera is currently animating
    this.isAnimating = false;
    // Store the animation frame ID for cancelling if needed
    this.animationFrameId = null;
  }

  _performAnimationStep(startPos, endPos, startTarget, endTarget, startUp, endUp, duration, easing, startTime, onUpdate, onComplete) {
    const elapsed = Date.now() - startTime;
    let progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    const pos = startPos.clone().lerp(endPos, easedProgress);
    const target = startTarget.clone().lerp(endTarget, easedProgress);
    const up = startUp.clone().lerp(endUp, easedProgress);

    if (onUpdate) onUpdate(pos, target, up);

    if (progress < 1) {
      this.animationFrameId = requestAnimationFrame(() => this._performAnimationStep(startPos, endPos, startTarget, endTarget, startUp, endUp, duration, easing, startTime, onUpdate, onComplete));
    } else {
      this.isAnimating = false;
      this.animationFrameId = null;
      if (onUpdate) onUpdate(endPos, endTarget, endUp); // Ensure final state
      if (onComplete) onComplete(true);
    }
  }

  /**
   * Convert latitude and longitude to a 3D position on the planet.
   * @param {number} latitude - The latitude in degrees.
   * @param {number} longitude - The longitude in degrees.
   * @returns {THREE.Vector3} The 3D position on the planet's surface.
   */
  latLonToWorld(latitude, longitude) {
    // Convert latitude and longitude from degrees to radians
    const latRad = THREE.MathUtils.degToRad(latitude);
    const lonRad = THREE.MathUtils.degToRad(longitude);
    // Calculate the x, y, z coordinates on the planet's surface
    const x = this.planetRadius * Math.cos(latRad) * Math.cos(lonRad);
    const y = this.planetRadius * Math.sin(latRad);
    const z = this.planetRadius * Math.cos(latRad) * Math.sin(lonRad);
    // Return the position as a Three.js Vector3 object
    return new THREE.Vector3(x, y, z);
  }

  /**
   * Animate the camera's position, target, and up vector smoothly over time.
   * @param {THREE.Vector3} startPos - Where the camera starts.
   * @param {THREE.Vector3} endPos - Where the camera should end up.
   * @param {THREE.Vector3} startTarget - What the camera is looking at at the start.
   * @param {THREE.Vector3} endTarget - What the camera should look at at the end.
   * @param {THREE.Vector3} startUp - The camera's up direction at the start.
   * @param {THREE.Vector3} endUp - The camera's up direction at the end.
   * @param {Function} onUpdate - Function called every frame to update the camera.
   * @param {Function} onComplete - Function called when the animation is finished.
   */
  animateCamera({ startPos, endPos, startTarget, endTarget, startUp, endUp, onUpdate, onComplete }) {
    // Record the time when the animation starts
    const startTime = Date.now();
    // Get the total duration for the animation
    const duration = this.config.ANIMATION_DURATION_MS;
    // Get the easing function for smooth animation
    const easing = this.config.EASING_CURVE;
    // Mark that the camera is animating
    this.isAnimating = true;

    this._performAnimationStep(startPos, endPos, startTarget, endTarget, startUp, endUp, duration, easing, startTime, onUpdate, onComplete);
  }
} 