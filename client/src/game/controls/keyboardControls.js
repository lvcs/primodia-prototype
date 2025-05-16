import * as THREE from 'three';
import * as Const from '../../config/gameConstants.js';
import { getActionForKey, Actions } from '../../config/keybindings.js';
import { GlobeCameraController } from '@/camera/GlobeCameraController.js';

// --- State ---
const activeKeys = new Set();
let localCamera, localPlanetGroup, localControls, localWorldConfig, globeRotationController;

/**
 * Initialize keyboard controls for globe rotation.
 */
export function initKeyboardControls(camera, planetGroup, controls, worldConfig, controller) {
    localCamera = camera;
    localPlanetGroup = planetGroup;
    localControls = controls;
    localWorldConfig = worldConfig;
    globeRotationController = controller || new GlobeCameraController(localPlanetGroup);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

function onKeyDown(event) {
    const action = getActionForKey(event.code);
    if (action) {
        activeKeys.add(action);
        event.preventDefault();
    }
}

function onKeyUp(event) {
    const action = getActionForKey(event.code);
    if (action) {
        activeKeys.delete(action);
        event.preventDefault();
    }
}

/**
 * Handle keyboard input for globe rotation. Call every frame with deltaTime.
 */
export function handleKeyboardInput(deltaTime = 1) {
    if (window.cameraAnimator && window.cameraAnimator.isAnimating) return;
    if (!localPlanetGroup || !localCamera || !localControls || !localWorldConfig) return;
    let { x, y } = globeRotationController.getRotation();
    const maxTilt = Math.PI / 2;
    const currentDistance = localCamera.position.distanceTo(localControls.target);
    const minZoom = localControls.minDistance;
    const maxZoom = localControls.maxDistance;
    const zoomFactor = THREE.MathUtils.clamp((currentDistance - minZoom) / (maxZoom - minZoom), 0, 1);
    const baseTargetSpeed = Const.KEYBOARD_TARGET_ANGULAR_SPEED;
    const speedAtMinZoom = baseTargetSpeed * Const.KEYBOARD_SPEED_SCALE_AT_MIN_ZOOM;
    const speedAtMaxZoom = baseTargetSpeed * Const.KEYBOARD_SPEED_SCALE_AT_MAX_ZOOM;
    const effectiveTargetSpeed = THREE.MathUtils.lerp(speedAtMinZoom, speedAtMaxZoom, zoomFactor);
    activeKeys.forEach(action => {
        switch (action) {
            case Actions.ROTATE_NORTH:
                x -= effectiveTargetSpeed;
                break;
            case Actions.ROTATE_SOUTH:
                x += effectiveTargetSpeed;
                break;
            case Actions.ROTATE_EAST:
                y += effectiveTargetSpeed;
                break;
            case Actions.ROTATE_WEST:
                y -= effectiveTargetSpeed;
                break;
            case Actions.ZOOM_IN:
                const zoomInDistance = localWorldConfig.radius * Const.KEYBOARD_ZOOM_SPEED;
                localCamera.position.addScaledVector(new THREE.Vector3().subVectors(localControls.target, localCamera.position).normalize(), zoomInDistance);
                if (localCamera.position.distanceTo(localControls.target) < localControls.minDistance) {
                    localCamera.position.sub(localControls.target).setLength(localControls.minDistance).add(localControls.target);
                }
                if (localControls.update) localControls.update();
                break;
            case Actions.ZOOM_OUT:
                const zoomOutDistance = localWorldConfig.radius * Const.KEYBOARD_ZOOM_SPEED;
                localCamera.position.addScaledVector(new THREE.Vector3().subVectors(localCamera.position, localControls.target).normalize(), zoomOutDistance);
                if (localCamera.position.distanceTo(localControls.target) > localControls.maxDistance) {
                    localCamera.position.sub(localControls.target).setLength(localControls.maxDistance).add(localControls.target);
                }
                if (localControls.update) localControls.update();
                break;
        }
    });
    x = Math.max(-maxTilt, Math.min(maxTilt, x));
    globeRotationController.setRotation(x, y);
}

/**
 * Remove keyboard event listeners.
 */
export function disposeKeyboardControls() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
} 