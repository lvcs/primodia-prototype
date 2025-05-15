import * as THREE from 'three';
import { ANIMATION_DURATION_MS, EASING_CURVE } from './cameraConfig';

export class Camera {
  constructor(threeJsCamera, globeModel, orbitControls, globeRadius) {
    this.threeJsCamera = threeJsCamera;
    this.globeModel = globeModel;
    this.orbitControls = orbitControls;
    this.globeRadius = globeRadius;
    this.isAnimating = false;
    this.animationFrameId = null;
    this.currentOnComplete = null;
    this.initialOrbitControlsState = {
        enableRotate: true,
        enablePan: true,
        enableZoom: true
    };

    this.config = {
      ANIMATION_DURATION_MS,
      EASING_CURVE,
    };
  }

  latLonToWorld(latitude, longitude) {
    const latRad = THREE.MathUtils.degToRad(latitude);
    const lonRad = THREE.MathUtils.degToRad(longitude);
    const x = this.globeRadius * Math.cos(latRad) * Math.cos(lonRad);
    const y = this.globeRadius * Math.sin(latRad);
    const z = this.globeRadius * Math.cos(latRad) * Math.sin(lonRad);
    return new THREE.Vector3(x, y, z);
  }

  animateTo(tile, onComplete = () => {}) {
    if (!this.globeModel || !this.threeJsCamera || !this.orbitControls) {
      console.error('GlobeAnimator.animateTo: Essential components (globe, camera, controls) are not set.');
      if (typeof onComplete === 'function') onComplete(false);
      return;
    }
    if (!tile || typeof tile.latitude === 'undefined' || typeof tile.longitude === 'undefined') {
      console.error('GlobeAnimator.animateTo: Invalid tile data provided.', tile);
      if (typeof onComplete === 'function') onComplete(false);
      return;
    }

    if (this.isAnimating && this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      if (this.currentOnComplete) {
        this.currentOnComplete(false); // Indicate interruption
      }
      // Restore controls if animation was interrupted
      this.orbitControls.enableRotate = this.initialOrbitControlsState.enableRotate;
      this.orbitControls.enablePan = this.initialOrbitControlsState.enablePan;
      // this.orbitControls.enableZoom remains as it was, or could be restored from initialOrbitControlsState.enableZoom if needed
    }
    
    this.isAnimating = true;
    // Store current state and disable rotation/pan
    this.initialOrbitControlsState.enableRotate = this.orbitControls.enableRotate;
    this.initialOrbitControlsState.enablePan = this.orbitControls.enablePan;
    // this.initialOrbitControlsState.enableZoom = this.orbitControls.enableZoom; // Store if we were to change it

    this.orbitControls.enableRotate = false;
    this.orbitControls.enablePan = false;
    // this.orbitControls.enableZoom = true; // Ensure zoom is enabled, or leave as is

    this.currentOnComplete = onComplete;

    const startQuaternion = this.globeModel.quaternion.clone();

    // 1. Vector from globe center to tile in globe's local space (normalized)
    const tileVecLocal = this.latLonToWorld(tile.latitude, tile.longitude).normalize();

    // 2. Target direction: vector from globe center towards camera (world space, normalized)
    const targetLineOfSightWorld = this.threeJsCamera.position.clone().sub(this.globeModel.position).normalize();

    // 3. Calculate the target quaternion for the globe
    // This quaternion will orient the globe so that tileVecLocal aligns with targetLineOfSightWorld.
    let endQuaternion = new THREE.Quaternion().setFromUnitVectors(tileVecLocal, targetLineOfSightWorld);

    // Handle NaN case for setFromUnitVectors (when vectors are collinear and opposite)
    if (isNaN(endQuaternion.x) || isNaN(endQuaternion.y) || isNaN(endQuaternion.z) || isNaN(endQuaternion.w)) {
      console.warn("[Camera.animateTo] NaN in endQuaternion. Correcting for 180-degree opposition.");
      let rotationAxis = new THREE.Vector3(0, 1, 0); // Default axis (world Y)
      if (Math.abs(tileVecLocal.dot(rotationAxis)) > 0.99) { // If tileVecLocal is aligned with default axis
        rotationAxis.set(1, 0, 0); // Try world X instead
      }
      // Create an axis perpendicular to tileVecLocal for the 180-degree rotation
      const perpendicularAxis = new THREE.Vector3().crossVectors(tileVecLocal, rotationAxis).normalize();
      if (perpendicularAxis.lengthSq() < 0.001) { // Fallback if cross product was zero
        // This can happen if tileVecLocal was also aligned with the second rotationAxis choice.
        // Find a non-collinear vector.
        if (Math.abs(tileVecLocal.x) < 0.9) perpendicularAxis.set(1,0,0);
        else if (Math.abs(tileVecLocal.y) < 0.9) perpendicularAxis.set(0,1,0);
        else perpendicularAxis.set(0,0,1);
        // And re-cross, or directly use it if it's already perpendicular.
        // For simplicity, assuming one of these base axes will provide a perpendicular for 180 deg rotation.
        // This part could be more robust, but setFromAxisAngle handles it.
      }      
      endQuaternion.setFromAxisAngle(perpendicularAxis.lengthSq() > 0.001 ? perpendicularAxis : new THREE.Vector3(0,1,0), Math.PI);
    }
    
    // --- Start of previous Y-axis rotation debug log --- 
    // (keeping it for now, will add quaternion logging)
    // const startRotationY = new THREE.Euler().setFromQuaternion(startQuaternion, 'YXZ').y;
    // const targetLongitudeRad = THREE.MathUtils.degToRad(tile.longitude);
    // const currentCameraAzimuth = this.orbitControls.getAzimuthalAngle(); // Still useful for context
    // const endRotationYEstimated = new THREE.Euler().setFromQuaternion(endQuaternion, 'YXZ').y;

    // console.log('[Camera.animateTo] Rotation Debug:',
    //   {
    //     startRotationYDeg: THREE.MathUtils.radToDeg(startRotationY).toFixed(2),
    //     clickedLatDeg: tile.latitude.toFixed(2),
    //     clickedLonDeg: tile.longitude.toFixed(2),
    //     cameraAzimuthDeg: THREE.MathUtils.radToDeg(currentCameraAzimuth).toFixed(2),
    //     // Quaternions
    //     startQuat: {x: startQuaternion.x.toFixed(2), y: startQuaternion.y.toFixed(2), z: startQuaternion.z.toFixed(2), w: startQuaternion.w.toFixed(2)},
    //     endQuat: {x: endQuaternion.x.toFixed(2), y: endQuaternion.y.toFixed(2), z: endQuaternion.z.toFixed(2), w: endQuaternion.w.toFixed(2)},
    //     // Vectors for setFromUnitVectors
    //     tileVecLocal: {x: tileVecLocal.x.toFixed(2), y: tileVecLocal.y.toFixed(2), z: tileVecLocal.z.toFixed(2)},
    //     targetLineOfSightWorld: {x: targetLineOfSightWorld.x.toFixed(2), y: targetLineOfSightWorld.y.toFixed(2), z: targetLineOfSightWorld.z.toFixed(2)},
    //     // Estimated Y rotation from endQuat for comparison
    //     endRotationYEstimatedDeg: THREE.MathUtils.radToDeg(endRotationYEstimated).toFixed(2),
    //   }
    // );
    // --- End of previous Y-axis rotation debug log --- 

    const startTime = Date.now();

    const animateStep = () => {
      const elapsed = Date.now() - startTime;
      let progress = Math.min(elapsed / this.config.ANIMATION_DURATION_MS, 1);
      const easedProgress = this.config.EASING_CURVE(progress);

      // Correct way to slerp: copy start, then slerp towards end
      // @TODO improve the globe animation so it follows straight line, not the weird curvature
      this.globeModel.quaternion.copy(startQuaternion).slerp(endQuaternion, easedProgress);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animateStep);
      } else {
        this.globeModel.quaternion.copy(endQuaternion); // Ensure final state
        
        // Restore controls
        this.orbitControls.enableRotate = this.initialOrbitControlsState.enableRotate;
        this.orbitControls.enablePan = this.initialOrbitControlsState.enablePan;
        // this.orbitControls.enableZoom = this.initialOrbitControlsState.enableZoom; // Restore if changed
        
        this.orbitControls.update(); // Important to sync controls
        
        this.isAnimating = false;
        this.animationFrameId = null;
        if (this.currentOnComplete) {
          this.currentOnComplete(true); 
          this.currentOnComplete = null;
        }
      }
    };

    this.animationFrameId = requestAnimationFrame(animateStep);
  }

  stopAnimation() {
    if (this.isAnimating && this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.isAnimating = false;
      this.animationFrameId = null;
      
      if (this.orbitControls) {
        // Restore controls on stop
        this.orbitControls.enableRotate = this.initialOrbitControlsState.enableRotate;
        this.orbitControls.enablePan = this.initialOrbitControlsState.enablePan;
        // this.orbitControls.enableZoom = this.initialOrbitControlsState.enableZoom; // Restore if changed
        this.orbitControls.update();
      }

      if (this.currentOnComplete) {
        this.currentOnComplete(false); 
        this.currentOnComplete = null; 
      }
    }
  }

  setTilt(tiltDegrees) {
    if (!this.threeJsCamera || !this.orbitControls) {
      console.error('[Camera.setTilt] Camera or OrbitControls not available.');
      return;
    }

    // Clamp tiltDegrees to a reasonable range, e.g., 0-89 degrees to avoid gimbal lock or looking straight up from below if not intended.
    // harp.gl uses 0 (straight down) to 80 (near horizon).
    const clampedTiltDeg = Math.max(0, Math.min(tiltDegrees, 89)); 
    const targetPolarAngleRad = THREE.MathUtils.degToRad(clampedTiltDeg);

    const currentAzimuthalAngleRad = this.orbitControls.getAzimuthalAngle();
    const currentDistance = this.orbitControls.getDistance();
    const targetFocusPoint = this.orbitControls.target.clone(); // Clone to avoid modifying the original target if it's manipulated elsewhere unexpectedly

    // Calculate new camera position offset from the target based on spherical coordinates
    const offset = new THREE.Vector3();
    offset.x = currentDistance * Math.sin(targetPolarAngleRad) * Math.sin(currentAzimuthalAngleRad);
    offset.y = currentDistance * Math.cos(targetPolarAngleRad);
    offset.z = currentDistance * Math.sin(targetPolarAngleRad) * Math.cos(currentAzimuthalAngleRad);

    this.threeJsCamera.position.copy(targetFocusPoint).add(offset);
    this.threeJsCamera.lookAt(targetFocusPoint);
    this.orbitControls.update();
  }

  getTilt() {
    if (!this.orbitControls) {
      console.error('[Camera.getTilt] OrbitControls not available.');
      return 0; // Return a default or throw an error
    }
    const currentPolarAngleRad = this.orbitControls.getPolarAngle();
    return THREE.MathUtils.radToDeg(currentPolarAngleRad);
  }
} 