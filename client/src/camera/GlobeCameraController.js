import * as THREE from 'three';
import { BaseCameraController } from './BaseCameraController.js';

/**
 * Controls the camera when viewing the entire globe.
 * Inherits common camera logic from BaseCameraController.
 */
export class GlobeCameraController extends BaseCameraController {
  /**
   * Create a controller for globe view.
   * @param {THREE.Camera} threeJsCamera - The camera object from Three.js.
   * @param {number} globeRadius - The radius of the globe.
   */
  constructor(threeJsCamera, globeRadius) {
    // Call the parent class constructor to set up the camera and globe radius
    super(threeJsCamera, globeRadius);
  }

  /**
   * Animate the camera to the globe view.
   * This is a placeholder (stub) function for now.
   * @param {Function} [onComplete] - Optional callback when animation finishes.
   */
  animateToGlobe(onComplete = () => {}) {
    // This is where you would add animation logic to move the camera to a globe view.
    // For now, it just calls the onComplete callback immediately.
    if (onComplete) onComplete(true);
  }

  /**
   * Get the tilt angle of the camera relative to the globe center.
   * The tilt is how much the camera is angled from looking straight down/up.
   * @returns {number} The tilt angle in degrees.
   */
  getTilt() {
    // Get the camera's current position in 3D space
    const pos = this.threeJsCamera.position;
    // The target is the center of the globe (0,0,0)
    const target = new THREE.Vector3(0, 0, 0);
    // Calculate the direction from the camera to the globe center
    const dir = target.clone().sub(pos).normalize();
    // The tilt angle is the angle between this direction and the 'up' direction (y-axis)
    const tiltRad = Math.acos(dir.y);
    // Convert the tilt from radians to degrees for easier understanding
    return THREE.MathUtils.radToDeg(tiltRad);
  }
} 