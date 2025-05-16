import * as THREE from 'three';

/**
 * Controls the globe rotation when focusing on a specific tile (area) on the globe.
 * The camera always looks at (0,0,0); the globe is rotated so the tile center is at (0,0,globeRadius).
 */
export class TileCameraController {
  /**
   * @param {THREE.Object3D} planetGroup - The globe mesh/group to control.
   * @param {number} globeRadius - The radius of the globe.
   */
  constructor(planetGroup, globeRadius) {
    this.planetGroup = planetGroup;
    this.globeRadius = globeRadius;
    this.rotationX = planetGroup ? planetGroup.rotation.x : 0;
    this.rotationY = planetGroup ? planetGroup.rotation.y : 0;
  }

  /**
   * Convert latitude and longitude to a 3D position on the globe's surface.
   * @param {number} latitude - The latitude in degrees.
   * @param {number} longitude - The longitude in degrees.
   * @returns {THREE.Vector3} The 3D position on the globe's surface.
   */
  latLonToWorld(latitude, longitude) {
    const latRad = THREE.MathUtils.degToRad(latitude);
    const lonRad = THREE.MathUtils.degToRad(longitude);
    const x = this.globeRadius * Math.cos(latRad) * Math.cos(lonRad);
    const y = this.globeRadius * Math.sin(latRad);
    const z = this.globeRadius * Math.cos(latRad) * Math.sin(lonRad);
    return new THREE.Vector3(x, y, z);
  }

  /**
   * Animate the globe rotation so the tile at (latitude, longitude) is at (0,0,globeRadius).
   * @param {{latitude: number, longitude: number}} tile - The tile to focus on.
   * @param {Function} [onComplete] - Optional callback when rotation finishes.
   */
  animateToTile(tile, onComplete = () => {}) {
    console.log('Animating to tile:', tile);
    if (!this.planetGroup) return;
    // Compute the world position of the tile center
    const tilePos = this.latLonToWorld(tile.latitude, tile.longitude).normalize();
    // The target position is (0,0,1) (normalized)
    const target = new THREE.Vector3(0, 0, 1);
    // Compute the quaternion that rotates tilePos to target
    const targetQuat = new THREE.Quaternion().setFromUnitVectors(tilePos, target);
    const startQuat = this.planetGroup.quaternion.clone();
    const duration = 500; // ms
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      this.planetGroup.quaternion.copy(startQuat).slerp(targetQuat, t);
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this.planetGroup.quaternion.copy(targetQuat);
        this.rotationX = this.planetGroup.rotation.x;
        this.rotationY = this.planetGroup.rotation.y;
        if (onComplete) onComplete(true);
      }
    };
    requestAnimationFrame(animate);
  }

  /**
   * Get the tilt angle of the camera relative to the tile it is looking at.
   * For now, always returns 0 since camera always looks at 0,0,0.
   * @returns {number}
   */
  getTilt() {
    return 0;
  }
} 