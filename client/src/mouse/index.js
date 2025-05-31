import * as THREE from 'three';
import { MOUSE_PAN_SPEED } from '@config';
import { useRenderStore } from '@stores';


// --- State ---
let isDragging = false;
const previousMousePosition = { x: 0, y: 0 };
let localControls, localCamera, localRenderer, orbitController;

/**
 * Initialize mouse controls for camera orbit.
 */
export function initMouseControls(camera, controls, controller) {
    localCamera = camera;
    localControls = controls;
    localRenderer = useRenderStore.getState().getRenderer();
    orbitController = controller;
    
    if (!localRenderer) {
        throw new Error('Renderer not found in render store. Make sure setupThreeJS is called first.');
    }
    
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
}

/**
 * Handle mouse move event to orbit the camera.
 */
function onMouseMove(event) {
    if (!isDragging) return;
    if (window.cameraAnimator && window.cameraAnimator.isAnimating) return;
    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;
    let currentRotationSpeed = MOUSE_PAN_SPEED;
    // Adjust rotation speed based on zoom level
    if (localControls && localControls.target && localCamera && localCamera.position) {
        const currentDistance = localCamera.position.length();
        const minZoomDist = localControls.minDistance;
        const maxZoomDist = localControls.maxDistance;
        const zoomFactor = THREE.MathUtils.clamp((currentDistance - minZoomDist) / (maxZoomDist - minZoomDist), 0, 1);
        const speedAtMaxZoomIn = MOUSE_PAN_SPEED * 0.01;
        const speedAtMaxZoomOut = MOUSE_PAN_SPEED * 2;
        currentRotationSpeed = THREE.MathUtils.lerp(speedAtMaxZoomIn, speedAtMaxZoomOut, zoomFactor);
    }
    // Update camera orbit
    if (orbitController) {
        orbitController.rotate(deltaY * currentRotationSpeed, deltaX * currentRotationSpeed);
    }
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
}

/**
 * Handle mouse up event to stop dragging.
 */
function onMouseUp(event) {
    if (event.button !== 0) return;
    isDragging = false;
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