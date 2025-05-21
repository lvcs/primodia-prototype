import * as THREE from 'three';
import * as Const from '../../config/gameConfig.js';


// --- State ---
let isDragging = false;
const previousMousePosition = { x: 0, y: 0 };
let localControls, localCamera, localRenderer;

/**
 * Initialize mouse controls for camera orbit.
 */
export function initMouseControls(camera, controls, renderer) {
    localCamera = camera;
    localControls = controls;
    localRenderer = renderer;
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
 * Handle mouse move event for camera interaction.
 * Note: Basic OrbitControls will handle most camera movement automatically.
 * This would be for any custom behaviors beyond basic OrbitControls.
 */
function onMouseMove(event) {
    if (!isDragging) return;
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