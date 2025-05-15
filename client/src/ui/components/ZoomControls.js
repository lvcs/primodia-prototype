import * as THREE from 'three';
import * as Const from '@/config/gameConstants.js'; // Adjusted path

// Store references to camera and controls, set by an init function or passed to methods
let localCamera;
let localControls;
let localWorldConfig;
let localPlanetGroup; // Make this module-scoped for handleZoom to access
let zoomLevelDisplayElement;
let angularVelocityDisplayElement;

function handleZoom(isZoomIn) {
    if (!localCamera || !localControls || !localWorldConfig) return;

    const zoomAmount = localWorldConfig.radius * Const.KEYBOARD_ZOOM_SPEED;

    if (isZoomIn) {
        localCamera.position.addScaledVector(new THREE.Vector3().subVectors(localControls.target, localCamera.position).normalize(), zoomAmount);
        if (localCamera.position.distanceTo(localControls.target) < localControls.minDistance) {
            localCamera.position.sub(localControls.target).setLength(localControls.minDistance).add(localControls.target);
        }
    } else {
        localCamera.position.addScaledVector(new THREE.Vector3().subVectors(localCamera.position, localControls.target).normalize(), zoomAmount);
        if (localCamera.position.distanceTo(localControls.target) > localControls.maxDistance) {
            localCamera.position.sub(localControls.target).setLength(localControls.maxDistance).add(localControls.target);
        }
    }
    if (localControls.update) localControls.update();
    if (zoomLevelDisplayElement || angularVelocityDisplayElement) {
        updateUIDisplay(localCamera, localControls, localPlanetGroup); 
    }
}

// Renamed and expanded to update all relevant UI displays in this component
export function updateUIDisplay(cameraInstance, controlsInstance, planetGroupInstance) {
    if (cameraInstance && controlsInstance && zoomLevelDisplayElement) {
        const currentDistance = cameraInstance.position.distanceTo(controlsInstance.target);
        zoomLevelDisplayElement.textContent = `Dist: ${currentDistance.toFixed(2)}`;
    }

    if (planetGroupInstance && planetGroupInstance.userData && planetGroupInstance.userData.angularVelocity && angularVelocityDisplayElement) {
        const angVel = planetGroupInstance.userData.angularVelocity;
        angularVelocityDisplayElement.textContent = 
            `Vel: X:${angVel.x.toFixed(3)} Y:${angVel.y.toFixed(3)} Z:${angVel.z.toFixed(3)}`;
    }
}

export function ZoomControlsComponent(camera, controls, worldConfig, planetGroup) {
    localCamera = camera;
    localControls = controls;
    localWorldConfig = worldConfig;
    localPlanetGroup = planetGroup; // Assign to module-scoped variable

    const container = document.createElement('div');
    container.id = 'zoom-controls-container';
    // CSS classes will be applied from main.css if they exist, or add them directly
    // container.style.position = 'absolute'; // etc. - better to rely on CSS file

    const zoomInBtn = document.createElement('button');
    zoomInBtn.id = 'zoom-in-btn';
    zoomInBtn.classList.add('zoom-btn');
    zoomInBtn.textContent = '+';
    zoomInBtn.addEventListener('click', () => handleZoom(true));

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.id = 'zoom-out-btn';
    zoomOutBtn.classList.add('zoom-btn');
    zoomOutBtn.textContent = '-';
    zoomOutBtn.addEventListener('click', () => handleZoom(false));

    zoomLevelDisplayElement = document.createElement('div');
    zoomLevelDisplayElement.id = 'zoom-level-display';
    zoomLevelDisplayElement.classList.add('zoom-display');
    // updateZoomDisplay(localCamera, localControls); // Old call

    // Create angular velocity display
    angularVelocityDisplayElement = document.createElement('div');
    angularVelocityDisplayElement.id = 'angular-velocity-display';
    angularVelocityDisplayElement.classList.add('zoom-display'); // Reuse same style for now
    angularVelocityDisplayElement.style.marginTop = "0.3rem"; // Add some space

    updateUIDisplay(localCamera, localControls, localPlanetGroup); // Initial display value for all

    container.appendChild(zoomInBtn);
    container.appendChild(zoomOutBtn);
    container.appendChild(zoomLevelDisplayElement);
    container.appendChild(angularVelocityDisplayElement); 

    return container; // Return the DOM element for appending
} 