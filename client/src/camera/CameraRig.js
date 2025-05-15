import * as THREE from 'three';
import * as Cfg from './cameraConfig';

/**
 * Manages the camera's position and orientation using a pivot system.
 * The rig consists of: CameraRig (root) -> YawPivot -> PitchPivot -> Camera.
 * The CameraRig's world position is the point of interest (OrbitControls.target).
 */
export class CameraRig {
  constructor(camera, orbitControls, globeRadius = 10) {
    this.threeCamera = camera;
    this.orbitControls = orbitControls;
    this.globeRadius = globeRadius;

    this.rig = new THREE.Object3D(); // Root of the camera rig
    this.yawPivot = new THREE.Object3D();
    this.pitchPivot = new THREE.Object3D();

    // Assemble the rig: rig -> yaw -> pitch -> camera
    // The camera is initially parented to the scene or another object.
    // We need to re-parent it carefully.
    if (this.threeCamera.parent) {
      this.threeCamera.parent.add(this.rig); // Add rig to camera's original parent (likely scene)
    }
    this.rig.add(this.yawPivot);
    this.yawPivot.add(this.pitchPivot);
    this.pitchPivot.add(this.threeCamera);

    // Initial state
    this.targetPoint = new THREE.Vector3(0, 0, 0); // World point of interest
    this.rig.position.copy(this.targetPoint);
    this.orbitControls.target.copy(this.targetPoint);

    this.currentAzimuth = THREE.MathUtils.degToRad(Cfg.INITIAL_CAMERA_AZIMUTH_DEGREES);
    this.currentPolar = THREE.MathUtils.degToRad(Cfg.INITIAL_CAMERA_POLAR_DEGREES);
    this.currentDistance = this.globeRadius * Cfg.INITIAL_CAMERA_DISTANCE_FACTOR;

    this.yawPivot.rotation.y = this.currentAzimuth;
    this.pitchPivot.rotation.x = this.currentPolar;
    this.threeCamera.position.set(0, 0, this.currentDistance);
    this.threeCamera.lookAt(0,0,0); // Camera looks at PitchPivot's origin

    this.orbitControls.update();

    this.animationFrameId = null;
  }

  /** Sets the main target point (in world coordinates) for the rig and OrbitControls. */
  setTargetPoint(worldPoint) {
    this.targetPoint.copy(worldPoint);
    this.rig.position.copy(this.targetPoint);
    this.orbitControls.target.copy(this.targetPoint);
    this.orbitControls.update();
  }

  /** Immediately sets the camera's orbit and distance around the current target point. */
  setOrbit(azimuthDegrees, polarDegrees, distance) {
    this.currentAzimuth = THREE.MathUtils.degToRad(azimuthDegrees);
    this.currentPolar = THREE.MathUtils.degToRad(polarDegrees);
    this.currentDistance = distance;

    this.yawPivot.rotation.y = this.currentAzimuth;
    this.pitchPivot.rotation.x = this.currentPolar;
    this.threeCamera.position.set(0, 0, this.currentDistance);
    // Camera always looks at the origin of the pitchPivot, which is effectively the targetPoint via rig.position
    this.threeCamera.lookAt(0,0,0); 
    this.orbitControls.update();
  }

  /** Animates the camera to a new orbit and distance around the current target point. */
  animateToOrbit(targetAzimuthDegrees, targetPolarDegrees, targetDistance, durationMs, easingFn) {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const startAzimuth = this.currentAzimuth;
    const startPolar = this.currentPolar;
    const startDistance = this.currentDistance;

    const endAzimuth = THREE.MathUtils.degToRad(targetAzimuthDegrees);
    const endPolar = THREE.MathUtils.degToRad(targetPolarDegrees);
    const endDistance = targetDistance;

    const startTime = Date.now();

    const animateStep = () => {
      const elapsed = Date.now() - startTime;
      let progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easingFn(progress);

      this.currentAzimuth = THREE.MathUtils.lerp(startAzimuth, endAzimuth, easedProgress);
      this.currentPolar = THREE.MathUtils.lerp(startPolar, endPolar, easedProgress);
      this.currentDistance = THREE.MathUtils.lerp(startDistance, endDistance, easedProgress);

      this.yawPivot.rotation.y = this.currentAzimuth;
      this.pitchPivot.rotation.x = this.currentPolar;
      this.threeCamera.position.set(0, 0, this.currentDistance);
      this.orbitControls.update(); // Essential to keep OrbitControls in sync

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animateStep);
      } else {
        this.animationFrameId = null;
        // Ensure final state
        this.currentAzimuth = endAzimuth;
        this.currentPolar = endPolar;
        this.currentDistance = endDistance;
        this.yawPivot.rotation.y = this.currentAzimuth;
        this.pitchPivot.rotation.x = this.currentPolar;
        this.threeCamera.position.set(0, 0, this.currentDistance);
        this.orbitControls.update();
      }
    };
    this.animationFrameId = requestAnimationFrame(animateStep);
  }

  // Getters for current state (optional, but can be useful)
  getCurrentAzimuthDegrees() { return THREE.MathUtils.radToDeg(this.currentAzimuth); }
  getCurrentPolarDegrees() { return THREE.MathUtils.radToDeg(this.currentPolar); }
  getCurrentDistance() { return this.currentDistance; }
  getTargetPoint() { return this.targetPoint.clone(); }

  dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    // If the rig was added to the scene, it should be removed by the caller.
    // If the camera was re-parented, it might need to be moved back to its original parent or scene directly.
  }
} 