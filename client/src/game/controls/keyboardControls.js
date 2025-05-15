import * as THREE from 'three';
import * as GameConst from '@/config/gameConstants.js'; // May still be used for non-camera actions if any
import * as CamConfig from '@/camera/cameraConfig.js'; // Import new camera config
import { getActionForKey, Actions } from '@/config/keybindings.js'; // Path alias for config

const activeKeys = new Set();

// let localCamera; // CameraRig has the camera
// let localPlanetGroup; // Globe is no longer rotated by keyboard
let localCameraRig; // Changed from localControls
// let localWorldConfig; // worldConfig.radius is available from cameraRig.globeRadius if needed

export function initKeyboardControls(camera, planetGroup, cameraRig, worldConfig) {
    // localCamera = camera; // Not storing separately
    // localPlanetGroup = planetGroup; // Not rotating it
    localCameraRig = cameraRig;
    // localWorldConfig = worldConfig; // Store globeRadius directly or get from cameraRig

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

export function handleKeyboardInput() {
    if (!localCameraRig) return;

    // No need for zoomFactor scaling for keyboard controls if using fixed steps / short animations.
    // const currentDistance = localCameraRig.getCurrentDistance();
    // const minZoom = localCameraRig.minDistance;
    // const maxZoom = localCameraRig.maxDistance;
    // const zoomFactor = THREE.MathUtils.clamp((currentDistance - minZoom) / (maxZoom - minZoom), 0, 1);
    // const effectiveTargetSpeed = THREE.MathUtils.lerp(speedAtMinZoom, speedAtMaxZoom, zoomFactor);

    activeKeys.forEach(action => {
        switch (action) {
            case Actions.ZOOM_IN:
                const currentDistZoomIn = localCameraRig.getCurrentDistance();
                const zoomInAmount = currentDistZoomIn * CamConfig.KEYBOARD_ZOOM_STEP_FACTOR;
                localCameraRig.animateDistance(
                    currentDistZoomIn - zoomInAmount,
                    CamConfig.KEYBOARD_ANIMATION_DURATION_MS,
                    CamConfig.EASING_CURVE_FUNCTION
                );
                break;
            case Actions.ZOOM_OUT:
                const currentDistZoomOut = localCameraRig.getCurrentDistance();
                const zoomOutAmount = currentDistZoomOut * CamConfig.KEYBOARD_ZOOM_STEP_FACTOR;
                localCameraRig.animateDistance(
                    currentDistZoomOut + zoomOutAmount,
                    CamConfig.KEYBOARD_ANIMATION_DURATION_MS,
                    CamConfig.EASING_CURVE_FUNCTION
                );
                break;
            case Actions.ROTATE_NORTH: // Increase Pitch (look more top-down)
                localCameraRig.animatePitch(
                    localCameraRig.getCurrentPitch() + CamConfig.KEYBOARD_PITCH_STEP_RAD,
                    CamConfig.KEYBOARD_ANIMATION_DURATION_MS,
                    CamConfig.EASING_CURVE_FUNCTION
                );
                break;
            case Actions.ROTATE_SOUTH: // Decrease Pitch (look more towards horizon)
                localCameraRig.animatePitch(
                    localCameraRig.getCurrentPitch() - CamConfig.KEYBOARD_PITCH_STEP_RAD,
                    CamConfig.KEYBOARD_ANIMATION_DURATION_MS,
                    CamConfig.EASING_CURVE_FUNCTION
                );
                break;
            case Actions.ROTATE_EAST: // Increase Yaw (rotate camera right / view to the right)
                localCameraRig.animateYaw(
                    localCameraRig.getCurrentYaw() + CamConfig.KEYBOARD_YAW_STEP_RAD,
                    CamConfig.KEYBOARD_ANIMATION_DURATION_MS,
                    CamConfig.EASING_CURVE_FUNCTION
                );
                break;
            case Actions.ROTATE_WEST: // Decrease Yaw (rotate camera left / view to the left)
                localCameraRig.animateYaw(
                    localCameraRig.getCurrentYaw() - CamConfig.KEYBOARD_YAW_STEP_RAD,
                    CamConfig.KEYBOARD_ANIMATION_DURATION_MS,
                    CamConfig.EASING_CURVE_FUNCTION
                );
                break;
        }
    });
    // All planet rotation logic and OrbitControls specific updates are removed.
}

export function disposeKeyboardControls() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    localCameraRig = null; // Clear reference
} 