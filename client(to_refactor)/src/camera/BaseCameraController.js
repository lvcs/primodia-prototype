import * as THREE from 'three';
import { ANIMATION_DURATION_MS, EASING_CURVE } from './cameraConfig';

/**
 * Base class for camera controllers.
 * Provides common logic for moving and animating the camera.
 */
export class BaseCameraController {
  /**
   * Create a base camera controller.
   * @param {THREE.Camera} threeJsCamera - The camera object from Three.js.
   * @param {number} globeRadius - The radius of the globe in kilometers (1 unit = 1 km).
   */
  constructor(threeJsCamera, globeRadius) {
    // Store the camera object
    this.threeJsCamera = threeJsCamera;
    // Store the globe's radius in kilometers
    this.globeRadius = globeRadius;
    // Store animation configuration
    this.config = {
      ANIMATION_DURATION_MS,
      EASING_CURVE,
    };
    // Track if the camera is currently animating
    this.isAnimating = false;
    // Store the animation frame ID for cancelling if needed
    this.animationFrameId = null;
  }

  /**
   * Convert latitude and longitude to a 3D position on the globe.
   * @param {number} latitude - The latitude in degrees.
   * @param {number} longitude - The longitude in degrees.
   * @returns {THREE.Vector3} The 3D position on the globe's surface.
   */
  latLonToWorld(latitude, longitude) {
    // Convert latitude and longitude from degrees to radians
    const latRad = THREE.MathUtils.degToRad(latitude);
    const lonRad = THREE.MathUtils.degToRad(longitude);
    // Calculate the x, y, z coordinates on the globe's surface
    const x = this.globeRadius * Math.cos(latRad) * Math.cos(lonRad);
    const y = this.globeRadius * Math.sin(latRad);
    const z = this.globeRadius * Math.cos(latRad) * Math.sin(lonRad);
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
    // Define the function that will be called every animation frame
    const animateStep = () => {
      // Calculate how much time has passed since the animation started
      const elapsed = Date.now() - startTime;
      // Calculate the progress as a value between 0 (start) and 1 (end)
      let progress = Math.min(elapsed / duration, 1);
      // Apply the easing function to make the animation feel smooth
      const easedProgress = easing(progress);
      // Interpolate (blend) between the start and end positions
      const pos = startPos.clone().lerp(endPos, easedProgress);
      // Interpolate between the start and end targets
      const target = startTarget.clone().lerp(endTarget, easedProgress);
      // Interpolate between the start and end up vectors
      const up = startUp.clone().lerp(endUp, easedProgress);
      // Call the onUpdate function to update the camera's state
      if (onUpdate) onUpdate(pos, target, up);
      // If the animation is not finished, request the next animation frame
      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animateStep);
      } else {
        // Animation is finished
        this.isAnimating = false;
        this.animationFrameId = null;
        // Ensure the camera is set to the final state
        if (onUpdate) onUpdate(endPos, endTarget, endUp);
        // Call the onComplete callback if provided
        if (onComplete) onComplete(true);
      }
    };
    // Start the animation
    this.animationFrameId = requestAnimationFrame(animateStep);
  }
} 