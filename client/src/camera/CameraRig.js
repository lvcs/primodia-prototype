import * as THREE from 'three';
import * as Config from './cameraConfig.js';

export class CameraRig {
    constructor(threeJsCamera, scene, globeRadius) {
        this.threeJsCamera = threeJsCamera;
        this.scene = scene;
        this.globeRadius = globeRadius; // Needed for distance factor calculations

        this.targetFocusPoint = new THREE.Vector3(0, 0, 0); // Camera always looks at the world origin

        this.cameraRigGroup = new THREE.Object3D(); // Main anchor, at origin
        this.yawPivot = new THREE.Object3D();       // Rotates around world Y (longitude)
        this.pitchPivot = new THREE.Object3D();     // Rotates around its local X (latitude/tilt)

        this.cameraRigGroup.add(this.yawPivot);
        this.yawPivot.add(this.pitchPivot);
        this.pitchPivot.add(this.threeJsCamera);
        this.scene.add(this.cameraRigGroup);

        // Initialize state
        this.currentYaw = THREE.MathUtils.degToRad(Config.INITIAL_CAMERA_YAW_DEG);
        this.currentPitch = THREE.MathUtils.degToRad(Config.INITIAL_CAMERA_PITCH_DEG);
        this.currentDistance = this.globeRadius * Config.INITIAL_CAMERA_DISTANCE_FACTOR;
        
        this.minDistance = this.globeRadius * Config.MIN_DISTANCE_FACTOR;
        this.maxDistance = this.globeRadius * Config.MAX_DISTANCE_FACTOR;

        // Animation state
        this.isAnimating = false;
        this.animationFrameId = null;
        this.animationStartTime = 0;
        this.animationDuration = 0;
        this.startYaw = 0;
        this.targetYaw = 0;
        this.startPitch = 0;
        this.targetPitch = 0;
        this.startDistance = 0;
        this.targetDistance = 0;
        this.animationEasingFunction = Config.EASING_CURVE_FUNCTION;
        this.animationOnComplete = null;
        this.animationResolve = null; // Added to ensure it's initialized

        this._applyTransforms();
    }

    _applyTransforms() {
        this.yawPivot.rotation.y = this.currentYaw;
        this.pitchPivot.rotation.x = this.currentPitch;
        this.threeJsCamera.position.set(0, 0, this.currentDistance);
        // Ensure the camera is looking towards the origin of the pitchPivot, which is effectively the world origin.
        this.threeJsCamera.lookAt(this.targetFocusPoint); 
    }

    _clampPitch(pitchRad) {
        return Math.max(Config.MIN_PITCH_RAD, Math.min(Config.MAX_PITCH_RAD, pitchRad));
    }

    _clampDistance(distance) {
        return Math.max(this.minDistance, Math.min(this.maxDistance, distance));
    }

    // --- Direct Setters (for mouse dragging, immediate effect) ---
    setYaw(yawRad) {
        if (this.isAnimating) this.stopAnimation();
        this.currentYaw = yawRad;
        this._applyTransforms();
    }

    setPitch(pitchRad) {
        if (this.isAnimating) this.stopAnimation();
        this.currentPitch = this._clampPitch(pitchRad);
        this._applyTransforms();
    }

    setDistance(distance) {
        if (this.isAnimating) this.stopAnimation();
        this.currentDistance = this._clampDistance(distance);
        this._applyTransforms();
    }

    // --- Animation System ---
    _startAnimation(targets, duration, easingFunction, onComplete) {
        if (this.isAnimating) {
            cancelAnimationFrame(this.animationFrameId);
            // If a previous animation was running and had a promise, resolve it as interrupted (false)
            if (this.animationResolve) {
                this.animationResolve(false);
                this.animationResolve = null; // Reset for next animation
            }
        }
        this.isAnimating = true;
        this.animationStartTime = Date.now();
        this.animationDuration = duration || Config.DEFAULT_ANIMATION_DURATION_MS;
        this.animationEasingFunction = easingFunction || Config.EASING_CURVE_FUNCTION;
        this.animationOnComplete = onComplete;

        this.startYaw = this.currentYaw;
        this.targetYaw = targets.yaw !== undefined ? targets.yaw : this.currentYaw;
        
        this.startPitch = this.currentPitch;
        this.targetPitch = targets.pitch !== undefined ? this._clampPitch(targets.pitch) : this.currentPitch;
        
        this.startDistance = this.currentDistance;
        this.targetDistance = targets.distance !== undefined ? this._clampDistance(targets.distance) : this.currentDistance;

        // Wrap yaw target to be closest angle
        const twoPi = Math.PI * 2;
        if (Math.abs(this.targetYaw - this.startYaw) > Math.PI) {
            if (this.targetYaw > this.startYaw) {
                this.startYaw += twoPi;
            } else {
                this.startYaw -= twoPi;
            }
        }
        
        this.animationFrameId = requestAnimationFrame(this._animateStep.bind(this));
        return new Promise(resolve => {
            this.animationResolve = resolve;
        });
    }

    _animateStep() {
        if (!this.isAnimating) return;

        const elapsed = Date.now() - this.animationStartTime;
        const progress = Math.min(elapsed / this.animationDuration, 1);
        const easedProgress = this.animationEasingFunction(progress);

        if (this.targetYaw !== this.currentYaw) {
            this.currentYaw = this.startYaw + (this.targetYaw - this.startYaw) * easedProgress;
        }
        if (this.targetPitch !== this.currentPitch) {
            this.currentPitch = this.startPitch + (this.targetPitch - this.startPitch) * easedProgress;
        }
        if (this.targetDistance !== this.currentDistance) {
            this.currentDistance = this.startDistance + (this.targetDistance - this.startDistance) * easedProgress;
        }

        this._applyTransforms();

        if (progress < 1) {
            this.animationFrameId = requestAnimationFrame(this._animateStep.bind(this));
        } else {
            this.currentYaw = this.targetYaw % (Math.PI * 2); // Normalize yaw
            this.currentPitch = this.targetPitch;
            this.currentDistance = this.targetDistance;
            this._applyTransforms();
            this.isAnimating = false;
            if (this.animationOnComplete) this.animationOnComplete(true); // True for successful completion
            if (this.animationResolve) {
                this.animationResolve(true);
                this.animationResolve = null; // Reset after resolving
            }
            this.animationFrameId = null;
        }
    }

    stopAnimation() {
        if (this.isAnimating) {
            cancelAnimationFrame(this.animationFrameId);
            this.isAnimating = false;
            if (this.animationOnComplete) this.animationOnComplete(false); // False for interruption
            if (this.animationResolve) {
                this.animationResolve(false);
                this.animationResolve = null; // Reset after resolving as interrupted
            }
            this.animationFrameId = null;
        }
    }

    // --- Public Animated Methods ---

    /**
     * Animates the camera to a specific geographic coordinate (latitude, longitude),
     * target distance, and target UI tilt.
     * Latitude and Longitude are in degrees.
     * Tilt is in degrees (0=top-down, MAX_UI_TILT_DEG=oblique).
     */
    animateToGeoPosition(latitudeDegrees, longitudeDegrees, targetDistance, targetUITiltDegrees, duration, easingFn) {
        const targetYawRad = THREE.MathUtils.degToRad(longitudeDegrees);
        // For pitch: UI tilt 0 (top-down) means pitch 90. UI tilt 80 means pitch 10.
        const targetPitchRad = THREE.MathUtils.degToRad(90 - targetUITiltDegrees);
        
        return this._startAnimation(
            { yaw: targetYawRad, pitch: targetPitchRad, distance: targetDistance },
            duration,
            easingFn
        );
    }
    
    /**
     * As per user spec: "await cameraRig.lookAtTile(lat, lon)"
     * This function will animate the camera's yaw and pitch to center on the given lat/lon.
     * It will maintain the current camera distance and UI tilt (by recalculating pitch based on current tilt).
     */
    async lookAtTile(latitudeDegrees, longitudeDegrees, duration, easingFn) {
        const targetYawRad = THREE.MathUtils.degToRad(longitudeDegrees);
        const targetPitchRad = THREE.MathUtils.degToRad(latitudeDegrees); // Direct mapping for pitch here
                                                                    // This assumes lat=0 is equator, lat=90 is N pole for pitchPivot

        // To maintain current UI tilt, we'd actually need to convert current UI tilt to a pitch
        // and use that, or make this function simpler and only care about yaw/pitch for lat/lon.
        // For now, let's make it point directly.
        // The spec for lookAtTile was "instant", but await implies animation.
        // If it needs to be "instant" for setup before another animation, it shouldn't be async.
        // For now, making it an animation to the direct lat/lon as pitch/yaw.
        
        return this._startAnimation(
            { yaw: targetYawRad, pitch: targetPitchRad }, // distance and existing pitch (from current tilt) are maintained implicitly
            duration,
            easingFn
        );
    }


    /**
     * Animates the camera to a specific UI tilt and distance, maintaining current yaw.
     * Tilt is in degrees (0=top-down, MAX_UI_TILT_DEG=oblique).
     */
    animateTiltZoom(uiTiltDegrees, distance, duration, easingFn) {
        // UI tilt 0 (top-down) means pitch 90. UI tilt MAX_UI_TILT_DEG means pitch (90 - MAX_UI_TILT_DEG).
        const targetPitchRad = THREE.MathUtils.degToRad(90 - uiTiltDegrees);
        return this._startAnimation(
            { pitch: targetPitchRad, distance: distance }, // Yaw is maintained
            duration,
            easingFn
        );
    }

    // ADDED: Single-parameter animation methods for keyboard controls
    animateYaw(targetYawRad, duration, easingFn) {
        return this._startAnimation({ yaw: targetYawRad }, duration, easingFn);
    }

    animatePitch(targetPitchRad, duration, easingFn) {
        return this._startAnimation({ pitch: targetPitchRad }, duration, easingFn);
    }

    animateDistance(targetDistance, duration, easingFn) {
        return this._startAnimation({ distance: targetDistance }, duration, easingFn);
    }
    // END ADDED methods

    // --- Getters for UI ---
    getCurrentUITilt() {
        // currentPitch is Rad, 90deg (PI/2) is top-down (0 UI tilt)
        // MIN_PITCH_RAD (e.g. 5 deg) is max UI tilt (e.g. 85 UI tilt)
        const pitchDeg = THREE.MathUtils.radToDeg(this.currentPitch);
        return 90 - pitchDeg; // Convert back to UI tilt convention
    }

    getCurrentDistance() {
        return this.currentDistance;
    }
    
    getCurrentYaw() {
        return this.currentYaw;
    }

    getCurrentPitch() { // Raw pitch
        return this.currentPitch;
    }
} 