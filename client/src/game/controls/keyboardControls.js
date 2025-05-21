import * as THREE from 'three';
import * as Const from '@config/gameConfig.js';
import { getActionForKey, Actions } from '@config/keyboardConfig.js';

// --- State ---
const activeKeys = new Set();
let localCamera, localControls, localWorldConfig, orbitController;

/**
 * Initialize keyboard controls for camera orbit.
 */
export function initKeyboardControls(camera, controls, worldConfig, controller) {
    localCamera = camera;
    localControls = controls;
    localWorldConfig = worldConfig;
    orbitController = controller;
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
 * Handle keyboard input for camera orbit. Call every frame with deltaTime.
 */
export function handleKeyboardInput(deltaTime = 1) {
    if (window.cameraAnimator && window.cameraAnimator.isAnimating) return;
    if (!localCamera || !localControls || !localWorldConfig || !orbitController) return;
    const baseTargetSpeed = Const.KEYBOARD_TARGET_ANGULAR_SPEED;
    const speedAtMinZoom = baseTargetSpeed * Const.KEYBOARD_SPEED_SCALE_AT_MIN_ZOOM;
    const speedAtMaxZoom = baseTargetSpeed * Const.KEYBOARD_SPEED_SCALE_AT_MAX_ZOOM;
    const minZoom = localControls.minDistance;
    const maxZoom = localControls.maxDistance;
    const currentDistance = orbitController.radius || localCamera.position.length();
    const zoomFactor = THREE.MathUtils.clamp((currentDistance - minZoom) / (maxZoom - minZoom), 0, 1);
    const effectiveTargetSpeed = THREE.MathUtils.lerp(speedAtMinZoom, speedAtMaxZoom, zoomFactor);
    activeKeys.forEach(action => {
        switch (action) {
            case Actions.ROTATE_NORTH:
                orbitController.rotate(-effectiveTargetSpeed, 0);
                break;
            case Actions.ROTATE_SOUTH:
                orbitController.rotate(effectiveTargetSpeed, 0);
                break;
            case Actions.ROTATE_EAST:
                orbitController.rotate(0, effectiveTargetSpeed);
                break;
            case Actions.ROTATE_WEST:
                orbitController.rotate(0, -effectiveTargetSpeed);
                break;
            case Actions.ZOOM_IN:
                orbitController.zoom(-localWorldConfig.radius * Const.KEYBOARD_ZOOM_SPEED);
                break;
            case Actions.ZOOM_OUT:
                orbitController.zoom(localWorldConfig.radius * Const.KEYBOARD_ZOOM_SPEED);
                break;
        }
    });
}

/**
 * Remove keyboard event listeners.
 */
export function disposeKeyboardControls() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
} 