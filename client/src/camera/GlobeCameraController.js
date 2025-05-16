import * as THREE from 'three';

/**
 * GlobeCameraController: Centralized globe rotation logic for all input methods
 * Now used as the main controller for globe mode camera.
 */
export class GlobeCameraController {
    /**
     * @param {THREE.Object3D} planetGroup - The globe mesh/group to control.
     */
    constructor(planetGroup) {
        this.planetGroup = planetGroup;
        this.rotationX = planetGroup ? planetGroup.rotation.x : 0;
        this.rotationY = planetGroup ? planetGroup.rotation.y : 0;
    }

    /**
     * Set the globe's rotation (in radians).
     * @param {number} x - Rotation around X (tilt up/down)
     * @param {number} y - Rotation around Y (spin left/right)
     */
    setRotation(x, y) {
        this.rotationX = x;
        this.rotationY = y;
        this.applyRotation();
    }

    /**
     * Get the current rotation (in radians).
     * @returns {{x: number, y: number}}
     */
    getRotation() {
        return { x: this.rotationX, y: this.rotationY };
    }

    /**
     * Apply the stored rotation to the globe object.
     */
    applyRotation() {
        if (this.planetGroup) {
            this.planetGroup.rotation.set(this.rotationX, this.rotationY, 0);
        }
    }

    /**
     * Sync the controller's state from the actual globe object.
     */
    syncFromObject() {
        if (this.planetGroup) {
            this.rotationX = this.planetGroup.rotation.x;
            this.rotationY = this.planetGroup.rotation.y;
        }
    }

    /**
     * Animate the camera to the globe view (stub for compatibility).
     * @param {Function} [onComplete] - Optional callback when animation finishes.
     */
    animateToGlobe(onComplete = () => {}) {
        // No camera animation needed; just call onComplete
        if (onComplete) onComplete(true);
    }

    /**
     * Get the tilt angle of the camera relative to the globe center.
     * For now, always returns 0 since camera always looks at 0,0,0.
     * @returns {number}
     */
    getTilt() {
        return 0;
    }
} 