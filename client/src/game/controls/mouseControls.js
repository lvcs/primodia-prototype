import * as THREE from 'three';
import * as Const from '../../config/gameConstants.js';

let isDragging = false;
const previousMousePosition = {
    x: 0,
    y: 0
};

let localControls; // To store OrbitControls instance
let localCamera;
let localPlanetGroup;
let localRenderer;

// To calculate velocity on mouse release
let lastDeltaX = 0;
let lastDeltaY = 0;

export function initMouseControls(camera, planetGroup, controls, renderer) {
    localCamera = camera;
    localPlanetGroup = planetGroup;
    localControls = controls; // OrbitControls instance
    localRenderer = renderer;

    localRenderer.domElement.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function onMouseDown(event) {
    if (event.button === 0) { // Left mouse button
        isDragging = true;
        if (localControls) localControls.enabled = false;
        previousMousePosition.x = event.clientX;
        previousMousePosition.y = event.clientY;
        lastDeltaX = 0;
        lastDeltaY = 0;

        if (localPlanetGroup && localPlanetGroup.userData) {
            localPlanetGroup.userData.isBeingDragged = true;
            if (localPlanetGroup.userData.angularVelocity) {
                localPlanetGroup.userData.angularVelocity.set(0, 0, 0);
            }
            if (localPlanetGroup.userData.targetAngularVelocity) {
                localPlanetGroup.userData.targetAngularVelocity.set(0, 0, 0);
            }
        }
    }
}

function onMouseMove(event) {
    if (!isDragging || !localPlanetGroup || !localCamera || !localControls) return;

    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;
    lastDeltaX = deltaX;
    lastDeltaY = deltaY;

    let currentRotationSpeed = Const.MOUSE_PAN_SPEED;

    // Adjust rotation speed based on zoom level
    if (localControls.target && localCamera.position) {
        const currentDistance = localCamera.position.distanceTo(localControls.target);
        const minZoomDist = localControls.minDistance;
        const maxZoomDist = localControls.maxDistance;
        
        // zoomFactor: 0 for max zoom in (closest), 1 for max zoom out (farthest)
        const zoomFactor = THREE.MathUtils.clamp((currentDistance - minZoomDist) / (maxZoomDist - minZoomDist), 0, 1);

        // Speed at max zoom in (zoomFactor = 0) = 1% of MOUSE_PAN_SPEED
        const speedAtMaxZoomIn = Const.MOUSE_PAN_SPEED * 0.01;
        // Speed at max zoom out (zoomFactor = 1) = 200% of MOUSE_PAN_SPEED
        const speedAtMaxZoomOut = Const.MOUSE_PAN_SPEED * 2;

        currentRotationSpeed = THREE.MathUtils.lerp(speedAtMaxZoomIn, speedAtMaxZoomOut, zoomFactor);
    }

    const cameraDirection = new THREE.Vector3();
    localCamera.getWorldDirection(cameraDirection);

    const worldUp = new THREE.Vector3(0, 1, 0);
    const cameraRight = new THREE.Vector3().crossVectors(localCamera.up, cameraDirection).normalize();

    // Horizontal movement (deltaX) rotates around worldUp (Y-axis).
    // User confirms left-right is correct with (deltaX * currentRotationSpeed).
    localPlanetGroup.rotateOnWorldAxis(worldUp, deltaX * currentRotationSpeed);
    
    // Vertical movement (deltaY) rotates around cameraRight (camera's local X-axis).
    // User reports up-down is inverted, so we use (-deltaY * currentRotationSpeed).
    localPlanetGroup.rotateOnWorldAxis(cameraRight, -deltaY * currentRotationSpeed);

    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
}

function onMouseUp(event) {
    if (event.button === 0) { // Left mouse button
        isDragging = false;
        // localControls.enabled = true; // Re-enable later

        if (localPlanetGroup && localPlanetGroup.userData) {
            localPlanetGroup.userData.isBeingDragged = false;

            // Impart inertia
            if (localPlanetGroup.userData.angularVelocity && localCamera) {
                const rotationSpeed = Const.MOUSE_PAN_SPEED; 
                
                const cameraDirection = new THREE.Vector3();
                localCamera.getWorldDirection(cameraDirection);
                const cameraRight = new THREE.Vector3().crossVectors(localCamera.up, cameraDirection).normalize();
                const worldUp = new THREE.Vector3(0,1,0);

                // Reset X and Z components from previous potential vertical flicks if we want clean separation
                // However, angularVelocity is zeroed on mousedown, so this shouldn't be strictly necessary
                // unless a single flick is meant to replace all non-Y components.
                // For now, let's assume additive behavior is fine for diagonal flicks.
                // localPlanetGroup.userData.angularVelocity.x = 0;
                // localPlanetGroup.userData.angularVelocity.z = 0;

                localPlanetGroup.userData.angularVelocity.y = lastDeltaX * rotationSpeed * Const.MOUSE_RELEASE_INERTIA_FACTOR;
                
                // const verticalRotationAxis = cameraRight.clone(); // Old way
                const verticalSpeed = lastDeltaY * rotationSpeed * Const.MOUSE_RELEASE_INERTIA_FACTOR;
                
                // Apply vertical flick velocity directly to world X-axis rotation
                // This is a simplification to test against OrbitControls interaction
                localPlanetGroup.userData.angularVelocity.x += verticalSpeed; 
                // localPlanetGroup.userData.angularVelocity.z += verticalRotationAxis.z * verticalSpeed; // Old way
            }
        }
        // Re-enable OrbitControls AFTER setting the planet's angular velocity for inertia
        if (localControls) localControls.enabled = true; 

        lastDeltaX = 0;
        lastDeltaY = 0;
    }
}

// Optional: function to dispose of event listeners if needed
export function disposeMouseControls() {
    if (localRenderer && localRenderer.domElement) {
        localRenderer.domElement.removeEventListener('mousedown', onMouseDown);
    }
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
} 