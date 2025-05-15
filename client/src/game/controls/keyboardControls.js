import * as THREE from 'three';
import * as Const from '../../config/gameConstants.js';
import { getActionForKey, Actions } from '../../config/keybindings.js';

const activeKeys = new Set();

let localCamera;
let localPlanetGroup;
let localControls; // OrbitControls instance
let localWorldConfig;

export function initKeyboardControls(camera, planetGroup, controls, worldConfig) {
    localCamera = camera;
    localPlanetGroup = planetGroup;
    localControls = controls;
    localWorldConfig = worldConfig;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

function onKeyDown(event) {
    const action = getActionForKey(event.code);
    if (action) {
        activeKeys.add(action);
        event.preventDefault(); // Prevent default browser actions for these keys
    }
}

function onKeyUp(event) {
    const action = getActionForKey(event.code);
    if (action) {
        activeKeys.delete(action);
        event.preventDefault();
    }
}

export function handleKeyboardInput() {
    if (!localPlanetGroup || !localCamera || !localControls || !localWorldConfig || !localPlanetGroup.userData) return;

    // Initialize userData fields if they don't exist
    if (!localPlanetGroup.userData.targetAngularVelocity) {
        localPlanetGroup.userData.targetAngularVelocity = new THREE.Vector3(0, 0, 0);
    }
    // angularVelocity will be managed by the main animation loop in game.js

    const currentDistance = localCamera.position.distanceTo(localControls.target);
    const minZoom = localControls.minDistance;
    const maxZoom = localControls.maxDistance;
    // zoomFactor: 0 for max zoom in, 1 for max zoom out
    const zoomFactor = THREE.MathUtils.clamp((currentDistance - minZoom) / (maxZoom - minZoom), 0, 1);

    // Base target speed for rotation keys
    const baseTargetSpeed = Const.KEYBOARD_TARGET_ANGULAR_SPEED;
    // Scale speed by zoom: faster when zoomed out, slower when zoomed in.
    // Lerp between a min speed (e.g., 20% of base) and full base speed.
    const effectiveTargetSpeed = THREE.MathUtils.lerp(
        baseTargetSpeed * 0.2, // Slower when zoomed in
        baseTargetSpeed,       // Full speed when zoomed out
        zoomFactor
    );

    let needsOrbitControlsUpdate = false;
    let rotationApplied = false;

    // Reset target angular velocity components that are not being actively driven by a key
    localPlanetGroup.userData.targetAngularVelocity.x = 0;
    // Y and Z might also be set by other inputs or need more complex logic if combining rotations.
    // For now, keyboard controls mainly affect Y (East/West) and a camera-relative X (North/South).
    // We will set target Y to 0 then override if key is pressed.
    // For N/S, we calculate the axis and apply speed, effectively setting a target velocity along that axis.
    // This part needs to be careful not to fight other components if we have combined inputs.
    // Let's simplify: direct target setting for Y, and for X/Z based on N/S view.
    localPlanetGroup.userData.targetAngularVelocity.y = 0;
    localPlanetGroup.userData.targetAngularVelocity.z = 0; 

    activeKeys.forEach(action => {
        switch (action) {
            case Actions.ZOOM_IN:
                const zoomInDistance = localWorldConfig.radius * Const.KEYBOARD_ZOOM_SPEED;
                localCamera.position.addScaledVector(new THREE.Vector3().subVectors(localControls.target, localCamera.position).normalize(), zoomInDistance);
                if (localCamera.position.distanceTo(localControls.target) < localControls.minDistance) {
                    localCamera.position.sub(localControls.target).setLength(localControls.minDistance).add(localControls.target);
                }
                needsOrbitControlsUpdate = true;
                break;
            case Actions.ZOOM_OUT:
                const zoomOutDistance = localWorldConfig.radius * Const.KEYBOARD_ZOOM_SPEED;
                localCamera.position.addScaledVector(new THREE.Vector3().subVectors(localCamera.position, localControls.target).normalize(), zoomOutDistance);
                if (localCamera.position.distanceTo(localControls.target) > localControls.maxDistance) {
                    localCamera.position.sub(localControls.target).setLength(localControls.maxDistance).add(localControls.target);
                }
                needsOrbitControlsUpdate = true;
                break;
            case Actions.ROTATE_NORTH: // Rotate globe "down" from camera's perspective
                const rightAxis = new THREE.Vector3().crossVectors(localCamera.up, new THREE.Vector3().subVectors(localControls.target, localCamera.position).normalize()).normalize();
                // Add to target velocity along this axis
                localPlanetGroup.userData.targetAngularVelocity.addScaledVector(rightAxis, effectiveTargetSpeed);
                rotationApplied = true;
                break;
            case Actions.ROTATE_SOUTH: // Rotate globe "up"
                const leftAxis = new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(localControls.target, localCamera.position).normalize(), localCamera.up).normalize();
                localPlanetGroup.userData.targetAngularVelocity.addScaledVector(leftAxis, effectiveTargetSpeed);
                rotationApplied = true;
                break;
            case Actions.ROTATE_EAST: // Right arrow: Target CCW spin around Y
                localPlanetGroup.userData.targetAngularVelocity.y += effectiveTargetSpeed;
                rotationApplied = true;
                break;
            case Actions.ROTATE_WEST: // Left arrow: Target CW spin around Y
                localPlanetGroup.userData.targetAngularVelocity.y -= effectiveTargetSpeed;
                rotationApplied = true;
                break;
        }
    });

    if (needsOrbitControlsUpdate) {
        localControls.update();
    }
    // The actual rotation now happens in game.js based on angularVelocity which smoothly follows targetAngularVelocity
}

// Optional: function to dispose of event listeners if needed
export function disposeKeyboardControls() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
} 