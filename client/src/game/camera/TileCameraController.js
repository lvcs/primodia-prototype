import * as THREE from 'three';
import { BaseCameraController } from './BaseCameraController.js';
import { CAMERA_VIEWS } from '@/config/cameraConfig.js';

const TILE_CONFIG = CAMERA_VIEWS.tile;

/**
 * Controls the camera when focusing on a specific tile (area) on the planet.
 * Inherits common camera logic from BaseCameraController.
 */
export class TileCameraController extends BaseCameraController {
  /**
   * Create a controller for tile view.
   * @param {THREE.Camera} threeJsCamera - The camera object from Three.js.
   * @param {number} planetRadius - The radius of the planet.
   */
  constructor(threeJsCamera, planetRadius) {
    // Call the parent class constructor to set up the camera and planet radius
    super(threeJsCamera, planetRadius);
  }

  /**
   * Animate the camera to focus on a specific tile (latitude/longitude) on the planet.
   * The camera will be a fixed distance from the planet center, at a fixed tilt, always looking at the tile.
   * @param {{latitude: number, longitude: number}} tile - The tile to focus on.
   * @param {Function} [onComplete] - Optional callback when animation finishes.
   */
  animateToTile(tile, onComplete = () => {}) {
    // 1. Get the tile's world position (on the surface)
    const tilePos = this.latLonToWorld(tile.latitude, tile.longitude);

    // 2. Get the direction from the planet center to the tile
    const direction = tilePos.clone().normalize();

    // 3. Set the camera position to be defaultDistance away from the center, along this direction
    const cameraDistance = TILE_CONFIG.defaultDistance;
    const cameraPos = direction.multiplyScalar(cameraDistance);

    // Store the camera's current position as the animation start
    const startPos = this.threeJsCamera.position.clone();
    // The camera should look at the planet center at the end
    const endPos = cameraPos.clone();
    const endTarget = new THREE.Vector3(0, 0, 0);
    // The camera's up direction should always be straight up (y-axis)
    const startUp = new THREE.Vector3(0, 1, 0);
    const endUp = new THREE.Vector3(0, 1, 0);
    // Animate the camera from its current state to the new state
    this.animateCamera({
      startPos,
      endPos,
      startTarget: endTarget,
      endTarget,
      startUp,
      endUp,
      onUpdate: (pos, target, up) => {
        // Update the camera's position
        this.threeJsCamera.position.copy(pos);
        // Update the camera's up direction
        this.threeJsCamera.up.copy(up);
        // Make the camera look at the target (planet center)
        this.threeJsCamera.lookAt(target);
        // Ensure the camera is not rotated around the y or z axes
        this.threeJsCamera.rotation.z = 0;
        this.threeJsCamera.rotation.y = 0;
        // Set the camera's zoom level if supported
        if ('zoom' in this.threeJsCamera) {
          this.threeJsCamera.zoom = 1.0;
          this.threeJsCamera.updateProjectionMatrix();
        }
      },
      onComplete,
      // Optionally, you could use TILE_CONFIG.animation.durationMs and easing here if animateCamera supports it
    });
  }

  /**
   * Get the tilt angle of the camera relative to the tile it is looking at.
   * The tilt is how much the camera is angled from looking straight down/up.
   * @returns {number} The tilt angle in degrees.
   */
  getTilt() {
    // Get the camera's current position
    const pos = this.threeJsCamera.position;
    // Get the direction the camera is looking in
    const target = this.threeJsCamera.getWorldDirection(new THREE.Vector3()).add(pos);
    // Calculate the direction vector from the camera to the target
    const dir = target.clone().sub(pos).normalize();
    // The tilt angle is the angle between this direction and the 'up' direction (y-axis)
    const tiltRad = Math.acos(dir.y);
    // Convert the tilt from radians to degrees for easier understanding
    return THREE.MathUtils.radToDeg(tiltRad);
  }
} 