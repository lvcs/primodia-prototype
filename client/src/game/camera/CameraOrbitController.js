import * as THREE from 'three';

class CameraOrbitController {
    /**
     * @param {THREE.Camera} camera - The camera to control.
     * @param {number} radius - Initial distance from the globe center.
     * @param {number} phi - Initial polar angle (vertical, 0 = up, PI = down).
     * @param {number} theta - Initial azimuthal angle (horizontal, 0 = +X).
     */
    constructor(camera, radius, phi, theta) {
        this.camera = camera;
        this.radius = radius;
        this.phi = phi;
        this.theta = theta;
        this.target = new THREE.Vector3(0, 0, 0); // Always look at globe center
        this.updateCamera();
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
    }
}

export default CameraOrbitController; 