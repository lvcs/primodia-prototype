import * as THREE from 'three';
import * as CamConfig from '@/camera/cameraConfig.js'; // Import new camera config

let isDragging = false;
const previousMousePosition = {
    x: 0,
    y: 0
};
let initialYaw = 0;
let initialPitch = 0;

// let localControls; // Will be localCameraRig
// let localCamera; // CameraRig has the camera
// let localPlanetGroup; // No longer rotated by mouse
let localRenderer;
let localCameraRig; // ADDED

// Removed lastDeltaX, lastDeltaY as globe inertia is removed

export function initMouseControls(camera, planetGroup, cameraRig, renderer) {
    // localCamera = camera; // CameraRig manages the camera object directly
    // localPlanetGroup = planetGroup; // Globe is no longer rotated by these controls
    localCameraRig = cameraRig; // Store CameraRig instance
    localRenderer = renderer;

    localRenderer.domElement.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    localRenderer.domElement.addEventListener('wheel', onMouseWheel, { passive: false }); // Added for zoom
}

function onMouseDown(event) {
    if (event.button === 0) { // Left mouse button
        if (!localCameraRig) return;
        isDragging = true;
        // No need to disable CameraRig like OrbitControls
        previousMousePosition.x = event.clientX;
        previousMousePosition.y = event.clientY;
        initialYaw = localCameraRig.getCurrentYaw();
        initialPitch = localCameraRig.getCurrentPitch();
        
        // Stop any ongoing camera rig animations when manual drag starts
        localCameraRig.stopAnimation(); 
    }
}

function onMouseMove(event) {
    if (!isDragging || !localCameraRig) return;

    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;

    const newYaw = initialYaw + deltaX * CamConfig.MOUSE_DRAG_SENSITIVITY_YAW;
    // Inverting deltaY for pitch: moving mouse up decreases pitch (looks up more from XZ plane perspective), a more natural feel
    // Or, if pitch is angle *from* Y-axis, then up-mouse = decrease angle = look more horizontal.
    // Our pitch: 0=horizon, 90=top. Mouse up = more top-down = increase pitch.
    // So, mouse_y_down = deltaY positive. If we want mouse_y_down to look more towards horizon (decrease pitch):
    // newPitch = initialPitch - deltaY * sensitivity. This seems standard.
    const newPitch = initialPitch - deltaY * CamConfig.MOUSE_DRAG_SENSITIVITY_PITCH;

    localCameraRig.setYaw(newYaw);
    localCameraRig.setPitch(newPitch); // setPitch in CameraRig handles clamping

    // Update initial positions for next delta calculation relative to current state
    // This makes dragging feel like it's continuously updating from the last point,
    // rather than always from the mousedown point.
    initialYaw = localCameraRig.getCurrentYaw(); 
    initialPitch = localCameraRig.getCurrentPitch();
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
}

function onMouseUp(event) {
    if (event.button === 0) { // Left mouse button
        isDragging = false;
        // No inertia for globe, no need to re-enable controls
    }
}

function onMouseWheel(event) {
    if (!localCameraRig) return;
    event.preventDefault(); // Prevent page scroll

    // Stop any ongoing camera animation if user starts wheeling
    localCameraRig.stopAnimation();

    const currentDistance = localCameraRig.getCurrentDistance();
    // Adjust sensitivity: positive deltaY for wheel down (zoom out / increase distance)
    const newDistance = currentDistance + event.deltaY * CamConfig.MOUSE_WHEEL_ZOOM_SENSITIVITY;
    
    localCameraRig.setDistance(newDistance); // setDistance in CameraRig handles clamping
    
    // Update UI if available/needed. This might require a callback or event system.
    // For now, CameraControlsSection will update on its own interactions.
    // If a global updateCameraUI function exists and is imported:
    // if (typeof updateCameraControlsUI === 'function') updateCameraControlsUI();
}


export function disposeMouseControls() {
    if (localRenderer && localRenderer.domElement) {
        localRenderer.domElement.removeEventListener('mousedown', onMouseDown);
        localRenderer.domElement.removeEventListener('wheel', onMouseWheel);
    }
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    // Nullify references if needed
    localCameraRig = null;
    localRenderer = null;
} 