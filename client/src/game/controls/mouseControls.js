import * as THREE from 'three';
import * as Const from '../../config/gameConstants.js';
import { GlobeCameraController } from '@/camera/GlobeCameraController.js';

// --- State ---
let isDragging = false;
const previousMousePosition = { x: 0, y: 0 };
let localControls, localCamera, localPlanetGroup, localRenderer, globeRotationController;

/**
 * Initialize mouse controls for globe rotation.
 */
export function initMouseControls(camera, planetGroup, controls, renderer, controller) {
    localCamera = camera;
    localPlanetGroup = planetGroup;
    localControls = controls;
    localRenderer = renderer;
    globeRotationController = controller || new GlobeCameraController(localPlanetGroup);
    globeRotationController.syncFromObject();
    localRenderer.domElement.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

/**
 * Handle mouse down event to start dragging.
 */
function onMouseDown(event) {
    if (event.button !== 0) return;
    isDragging = true;
    if (localControls) localControls.enabled = false;
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
    globeRotationController.syncFromObject();
}

/**
 * Handle mouse move event to rotate the globe.
 */
function onMouseMove(event) {
    if (!isDragging || !localPlanetGroup) return;
    if (window.cameraAnimator && window.cameraAnimator.isAnimating) return;
    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;
    let currentRotationSpeed = Const.MOUSE_PAN_SPEED;
    // Adjust rotation speed based on zoom level
    if (localControls && localControls.target && localCamera && localCamera.position) {
        const currentDistance = localCamera.position.distanceTo(localControls.target);
        const minZoomDist = localControls.minDistance;
        const maxZoomDist = localControls.maxDistance;
        const zoomFactor = THREE.MathUtils.clamp((currentDistance - minZoomDist) / (maxZoomDist - minZoomDist), 0, 1);
        const speedAtMaxZoomIn = Const.MOUSE_PAN_SPEED * 0.01;
        const speedAtMaxZoomOut = Const.MOUSE_PAN_SPEED * 2;
        currentRotationSpeed = THREE.MathUtils.lerp(speedAtMaxZoomIn, speedAtMaxZoomOut, zoomFactor);
    }
    // Update rotation
    const { x, y } = globeRotationController.getRotation();
    const maxTilt = Math.PI / 2;
    let newX = x + deltaY * currentRotationSpeed;
    let newY = y + deltaX * currentRotationSpeed;
    newX = Math.max(-maxTilt, Math.min(maxTilt, newX));
    globeRotationController.setRotation(newX, newY);
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
}

/**
 * Handle mouse up event to stop dragging.
 */
function onMouseUp(event) {
    if (event.button !== 0) return;
    isDragging = false;
    if (localPlanetGroup && localPlanetGroup.userData) {
        localPlanetGroup.userData.isBeingDragged = false;
    }
    if (localControls) localControls.enabled = true;
}

/**
 * Remove mouse event listeners.
 */
export function disposeMouseControls() {
    if (localRenderer && localRenderer.domElement) {
        localRenderer.domElement.removeEventListener('mousedown', onMouseDown);
    }
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
} 