import * as THREE from 'three';
import { ANIMATION_DURATION_MS, EASING_CURVE } from './cameraConfig';

/**
 * Manages camera operations including orbiting, animating to specific tiles (by rotating the globe),
 * and adjusting camera tilt.
 */
export class Camera {
  /**
   * Initializes the Camera helper.
   * @param {THREE.PerspectiveCamera} threeJsCamera - The main application camera.
   * @param {THREE.Group} globeModel - The 3D model of the globe.
   * @param {THREE.OrbitControls} orbitControls - The OrbitControls instance managing camera interaction.
   * @param {number} globeRadius - The radius of the globe model.
   */
  constructor(threeJsCamera, globeModel, orbitControls, globeRadius) {
    this.threeJsCamera = threeJsCamera;
    this.globeModel = globeModel;
    this.orbitControls = orbitControls;
    this.globeRadius = globeRadius;
    this.isAnimating = false;
    this.animationFrameId = null;
    this.currentOnComplete = null; // Callback for when animation finishes or is interrupted

    // Stores the state of OrbitControls before a globe animation starts, to restore them after.
    this.initialOrbitControlsState = {
        enableRotate: true,
        enablePan: true,
        enableZoom: true
    };

    this.config = {
      ANIMATION_DURATION_MS,
      EASING_CURVE,
    };

    // No additional rig structure required at this stage.
  }

  /**
   * Converts latitude and longitude coordinates to a 3D world position on the surface of the globe.
   * Assumes the globe is centered at the origin.
   * @param {number} latitude - Latitude in degrees.
   * @param {number} longitude - Longitude in degrees.
   * @returns {THREE.Vector3} The corresponding 3D vector in world space.
   */
  latLonToWorld(latitude, longitude) {
    const latRad = THREE.MathUtils.degToRad(latitude);
    const lonRad = THREE.MathUtils.degToRad(longitude);
    // Standard spherical to Cartesian conversion:
    // Y is up, X is to the right (at 0 longitude), Z is towards the viewer (at 0 longitude, 0 latitude before camera rotation).
    // Globe model might have its 0 longitude aligned with +X or +Z depending on texture mapping.
    const x = this.globeRadius * Math.cos(latRad) * Math.cos(lonRad);
    const y = this.globeRadius * Math.sin(latRad);
    const z = this.globeRadius * Math.cos(latRad) * Math.sin(lonRad);
    return new THREE.Vector3(x, y, z);
  }

  /**
   * Animates the GLO MODEL to rotate so that the specified tile faces the camera.
   * The camera itself does not change its orbit parameters (distance, polar angle, azimuthal angle) during this animation,
   * but OrbitControls are temporarily disabled for rotation/pan to prevent interference.
   * @param {{latitude: number, longitude: number}} tile - Object containing latitude and longitude of the target tile.
   * @param {function(boolean)} [onComplete] - Optional callback function that is called when the animation completes.
   *                                         It receives `true` if completed successfully, `false` if interrupted.
   */
  animateTo(tile, onComplete = () => {}) {
    if (!this.globeModel || !this.threeJsCamera || !this.orbitControls) {
      console.error('[Camera.animateTo] Essential components (globe, camera, controls) are not set.');
      if (typeof onComplete === 'function') onComplete(false);
      return;
    }
    if (!tile || typeof tile.latitude === 'undefined' || typeof tile.longitude === 'undefined') {
      console.error('[Camera.animateTo] Invalid tile data provided.', tile);
      if (typeof onComplete === 'function') onComplete(false);
      return;
    }

    // If an animation is already in progress, cancel it and notify its onComplete callback.
    if (this.isAnimating && this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      if (this.currentOnComplete) {
        this.currentOnComplete(false); // Indicate interruption
      }
      // Restore OrbitControls to their state before this interrupted animation began.
      this.orbitControls.enableRotate = this.initialOrbitControlsState.enableRotate;
      this.orbitControls.enablePan = this.initialOrbitControlsState.enablePan;
    }
    
    this.isAnimating = true;
    // Store the current state of OrbitControls interaction capabilities.
    this.initialOrbitControlsState.enableRotate = this.orbitControls.enableRotate;
    this.initialOrbitControlsState.enablePan = this.orbitControls.enablePan;
    // this.initialOrbitControlsState.enableZoom = this.orbitControls.enableZoom; // Zoom is not disabled

    // Disable OrbitControls rotation and panning during the globe animation.
    // Zoom is allowed to continue if it was enabled.
    this.orbitControls.enableRotate = false;
    this.orbitControls.enablePan = false;

    this.currentOnComplete = onComplete;

    const startQuaternion = this.globeModel.quaternion.clone();

    // 1. Calculate the vector from the globe's center to the target tile in the globe's local coordinate system.
    const tileVecLocal = this.latLonToWorld(tile.latitude, tile.longitude).normalize();

    // 2. Calculate the target line of sight: a vector from the globe's center pointing towards the camera's current position.
    // This represents the direction the tile should face in world space after rotation.
    const targetLineOfSightWorld = this.threeJsCamera.position.clone().sub(this.globeModel.position).normalize();

    // 3. Calculate the target quaternion for the globe model.
    // This quaternion represents the rotation needed to align `tileVecLocal` (the point on the globe)
    // with `targetLineOfSightWorld` (the direction towards the camera).
    let endQuaternion = new THREE.Quaternion().setFromUnitVectors(tileVecLocal, targetLineOfSightWorld);

    // Handle potential NaN result from setFromUnitVectors if vectors are nearly opposite (180 degrees).
    if (isNaN(endQuaternion.x) || isNaN(endQuaternion.y) || isNaN(endQuaternion.z) || isNaN(endQuaternion.w)) {
      console.warn("[Camera.animateTo] Quaternion NaN. Correcting for 180-degree opposition.");
      // Define a fallback rotation axis. If tileVecLocal is aligned with (0,1,0), use (1,0,0) instead.
      let rotationAxis = (Math.abs(tileVecLocal.y) > 0.99) ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      // Create an axis perpendicular to tileVecLocal for the 180-degree rotation.
      const perpendicularAxis = new THREE.Vector3().crossVectors(tileVecLocal, rotationAxis).normalize();
      // If the cross product resulted in a zero vector (e.g., tileVecLocal was also aligned with the chosen rotationAxis),
      // pick a guaranteed non-collinear axis.
      if (perpendicularAxis.lengthSq() < 0.001) { 
        if (Math.abs(tileVecLocal.x) < 0.9) perpendicularAxis.set(1,0,0);
        else if (Math.abs(tileVecLocal.y) < 0.9) perpendicularAxis.set(0,1,0);
        else perpendicularAxis.set(0,0,1);
      }
      endQuaternion.setFromAxisAngle(perpendicularAxis, Math.PI); // Rotate 180 degrees around the perpendicular axis.
    }
    
    const startTime = Date.now();

    const animateStep = () => {
      const elapsed = Date.now() - startTime;
      let progress = Math.min(elapsed / this.config.ANIMATION_DURATION_MS, 1);
      const easedProgress = this.config.EASING_CURVE(progress);

      // Spherically interpolate the globeModel's quaternion from its start to the end orientation.
      // @TODO improve the globe animation so it follows straight line, not the weird curvature
      this.globeModel.quaternion.copy(startQuaternion).slerp(endQuaternion, easedProgress);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animateStep);
      } else {
        this.globeModel.quaternion.copy(endQuaternion); // Ensure final state is accurately set.
        
        // Restore OrbitControls interaction capabilities to their pre-animation state.
        this.orbitControls.enableRotate = this.initialOrbitControlsState.enableRotate;
        this.orbitControls.enablePan = this.initialOrbitControlsState.enablePan;
        // this.orbitControls.enableZoom = this.initialOrbitControlsState.enableZoom; // Zoom was not changed
        
        this.orbitControls.update(); // Sync OrbitControls with any (minor) camera changes if globe moved under it.
        
        this.isAnimating = false;
        this.animationFrameId = null;
        if (this.currentOnComplete) {
          this.currentOnComplete(true); // Notify successful completion.
          this.currentOnComplete = null;
        }
      }
    };

    this.animationFrameId = requestAnimationFrame(animateStep);
  }

  /**
   * Stops any ongoing globe animation initiated by `animateTo`.
   * Restores OrbitControls interaction and calls the onComplete callback with `false`.
   */
  stopAnimation() {
    if (this.isAnimating && this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.isAnimating = false;
      this.animationFrameId = null;
      
      if (this.orbitControls) {
        // Restore OrbitControls interaction capabilities.
        this.orbitControls.enableRotate = this.initialOrbitControlsState.enableRotate;
        this.orbitControls.enablePan = this.initialOrbitControlsState.enablePan;
        // this.orbitControls.enableZoom = this.initialOrbitControlsState.enableZoom;
        this.orbitControls.update();
      }

      if (this.currentOnComplete) {
        this.currentOnComplete(false); // Indicate interruption/non-completion.
        this.currentOnComplete = null; 
      }
    }
  }

  /**
   * Sets the CAMERA's tilt (polar angle) relative to the OrbitControls target.
   * A tilt of 0 degrees means the camera looks straight down at the target.
   * A positive tilt (e.g., 45-80 degrees) means the camera looks from an oblique angle, towards the horizon.
   * This method directly manipulates the camera's position and updates OrbitControls.
   * It does NOT rotate the globe model.
   * @param {number} tiltDegrees - The desired camera tilt in degrees (0-89, where 0 is top-down).
   */
  setTilt(tiltDegrees) {
    if (!this.threeJsCamera || !this.orbitControls) {
      console.error('[Camera.setTilt] Camera or OrbitControls not available.');
      return;
    }

    const clampedTiltDeg = Math.max(0, Math.min(tiltDegrees, 89));
    const targetPolarAngleRad = THREE.MathUtils.degToRad(clampedTiltDeg);

    const offset = new THREE.Vector3().subVectors(this.threeJsCamera.position, this.orbitControls.target);
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(offset);
    spherical.phi = targetPolarAngleRad;
    spherical.makeSafe();

    const newOffset = new THREE.Vector3().setFromSpherical(spherical);
    const newPosition = new THREE.Vector3().copy(this.orbitControls.target).add(newOffset);

    this.threeJsCamera.position.copy(newPosition);
    this.threeJsCamera.up.set(0,1,0);
    this.threeJsCamera.lookAt(this.orbitControls.target);
    this.orbitControls.update();
  }

  /**
   * Gets the CAMERA's current tilt (polar angle) in degrees.
   * 0 degrees means looking straight down. Positive values indicate tilt towards the horizon.
   * @returns {number} The current tilt in degrees.
   */
  getTilt() {
    if (!this.orbitControls) return 0;
    return THREE.MathUtils.radToDeg(this.orbitControls.getPolarAngle());
  }

  /**
   * Smoothly moves the CAMERA to an isometric-like view above the given tile.
   * 1. OrbitControls.target becomes the tile centre on the globe surface.
   * 2. Camera moves to a latitude offset (tile.lat + tiltDeg sign) keeping same longitude.
   * 3. Camera distance becomes `distance`.
   *
   * @param {{latitude:number, longitude:number}} tile
   * @param {number} tiltDeg   Desired tilt in degrees (e.g. 45)
   * @param {number} distance  Desired camera distance from the target (world units)
   * @param {number} durationMs Animation duration in ms
   */
  zoomToTile(tile, tiltDeg = 45, distance = this.globeRadius * 1.5, durationMs = 1000) {
    if (!tile) return;

    // 1. Get tile world position (centre of clicked face)
    const targetPosLocal = this.latLonToWorld(tile.latitude, tile.longitude);
    const targetPos = this.globeModel ? this.globeModel.localToWorld(targetPosLocal.clone()) : targetPosLocal.clone();

    // 2. Derive camera destination.
    const latOffset = tile.latitude + (tile.latitude >= 0 ? tiltDeg : -tiltDeg);
    const latCam = THREE.MathUtils.clamp(latOffset, -89, 89);
    const lonCam = tile.longitude;

    const camDirLocal = this.latLonToWorld(latCam, lonCam).normalize();
    const camDirWorld = this.globeModel ? this.globeModel.localToWorld(camDirLocal.clone()).sub(this.globeModel.position).normalize() : camDirLocal;

    const desiredCamPos = targetPos.clone().add(camDirWorld.multiplyScalar(distance));

    const startCamPos = this.threeJsCamera.position.clone();
    const startTarget = this.orbitControls.target.clone();

    const startTime = Date.now();
    const easing = this.config.EASING_CURVE;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      const p = easing(t);

      this.threeJsCamera.position.lerpVectors(startCamPos, desiredCamPos, p);
      this.orbitControls.target.lerpVectors(startTarget, targetPos, p);

      this.threeJsCamera.lookAt(this.orbitControls.target);
      this.orbitControls.update();

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }
} 