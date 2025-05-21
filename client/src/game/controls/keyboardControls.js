import * as THREE from 'three';
import * as Const from '@config/gameConfig.js';
import { getActionForKey, Actions } from '@config/keyboardConfig.js';
import { handleKeyboardAction } from '@game/camera/keyboardControls';

// --- State ---
const activeKeys = new Set();
let localCamera, localControls, localWorldConfig;

/**
 * Initialize keyboard controls for camera orbit.
 */
export function initKeyboardControls(camera, controls, worldConfig) {
    localCamera = camera;
    localControls = controls;
    localWorldConfig = worldConfig;
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
    if (!localCamera || !localControls || !localWorldConfig) return;
    
    activeKeys.forEach(action => {
        handleKeyboardAction(action);
    });
}

/**
 * Remove keyboard event listeners.
 */
export function disposeKeyboardControls() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
} 