import * as THREE from 'three';
import { throttle } from 'lodash';
import { useCameraStore } from '@stores/cameraStore';

const DEBOUNCE_ZOOM_UPDATE_MS = 100; //ms

class CameraOrbitController {
    /**
     * @param {THREE.Camera} camera - The camera to control.
     * @param {THREE.OrbitControls} threeOrbitControls - The main OrbitControls instance.
     * @param {number} radius - Initial distance from the planet center.
     * @param {number} phi - Initial polar angle (vertical, 0 = up, PI = down).
     * @param {number} theta - Initial azimuthal angle (horizontal, 0 = +X).
     */
    constructor(camera, threeOrbitControls, radius, phi, theta) {
        this.camera = camera;
        this.threeOrbitControls = threeOrbitControls; // Store the OrbitControls instance
        this.radius = radius;
        this.phi = phi;
        this.theta = theta;
        this.target = new THREE.Vector3(0, 0, 0); // Always look at planet center
        this.updateCamera();

        // Get the setZoom action from the store
        this._setStoreZoom = useCameraStore.getState().setZoom;
        // Create a throttled version for performance
        this.throttledSetStoreZoom = throttle((newRadius) => {
            this._setStoreZoom(newRadius);
        }, DEBOUNCE_ZOOM_UPDATE_MS);

        // Initial sync
        this.throttledSetStoreZoom(this.radius);
    }

    setSpherical(radius, phi, theta) {
        this.radius = radius;
        this.phi = phi;
        this.theta = theta;
        this.updateCamera();
    }

    getSpherical() {
        return { radius: this.radius, phi: this.phi, theta: this.theta };
    }

    // Move the camera based on spherical coordinates
    updateCamera() {
        const x = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        const y = this.radius * Math.cos(this.phi);
        const z = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
        this.camera.position.set(x, y, z);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(this.target);

        // Inform the main OrbitControls to update its internal state
        if (this.threeOrbitControls) {
            this.threeOrbitControls.update();
        }
    }

    // Optionally, methods to increment angles
    rotate(deltaPhi, deltaTheta) {
        const maxTilt = Math.PI / 2;
        this.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this.phi + deltaPhi)); // avoid poles
        this.theta = (this.theta + deltaTheta) % (2 * Math.PI);
        this.updateCamera();
    }

    zoom(deltaRadius) {
        this.radius = Math.max(1, this.radius + deltaRadius); // prevent negative/zero radius
        this.updateCamera();
        this.throttledSetStoreZoom(this.radius); // Update store on zoom change
    }
}

export default CameraOrbitController; 