import * as THREE from 'three';
import { BaseCameraController } from './BaseCameraController.js';
import { CAMERA_VIEWS } from '@/config/cameraViewsConfig.js';

const GLOBE_CONFIG = CAMERA_VIEWS.globe;

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
   * Only change the distance from the center along the current direction, always look at 0,0,0.
   * @param {Function} [onComplete] - Optional callback when animation finishes.
   */
  animateToGlobe(onComplete = () => {}) {
    // Get current direction from center to camera
    const currentPos = this.threeJsCamera.position.clone();
    const direction = currentPos.clone().normalize();
    const targetDistance = GLOBE_CONFIG.defaultPosition.y; // Use y as the distance from center
    const endPos = direction.multiplyScalar(targetDistance);
    const startPos = this.threeJsCamera.position.clone();
    const startZoom = this.threeJsCamera.zoom;
    const endZoom = 1.0;
    const duration = GLOBE_CONFIG.animation?.durationMs || 1000;
    const easing = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const startTime = Date.now();
    const animateStep = () => {
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
        requestAnimationFrame(animateStep);
      } else {
        this.threeJsCamera.position.copy(endPos);
        this.threeJsCamera.zoom = endZoom;
        this.threeJsCamera.updateProjectionMatrix();
        this.threeJsCamera.lookAt(0, 0, 0);
        if (onComplete) onComplete();
      }
    };
    animateStep();
  }

  /**
   * Get the tilt angle of the camera relative to the globe center.
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