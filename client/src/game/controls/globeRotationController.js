// GlobeRotationController: Centralized globe rotation logic for all input methods
import * as THREE from 'three';

/**
 * Central controller for globe rotation. All input methods should use this.
 */
class GlobeRotationController {
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
}

export default GlobeRotationController; 