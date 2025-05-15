import * as THREE from 'three';
import * as Const from '@/config/gameConstants.js';
import { ControlSection } from './ControlSection.js';
import { SliderControl } from './SliderControl.js';

// Store references to camera, controls, and animator
let localCamera;
let localControls;
let localCameraAnimator;

// UI Elements that need updating
let distanceDisplayElement;
let tiltValueDisplayElement;
let tiltSliderControl; // This will be the slider input element from SliderControl

function handleZoom(isZoomIn) {
    if (!localCamera || !localControls || !localCamera.userData.worldConfig) { // Assuming worldConfig is on camera.userData
        console.warn("[CameraControlsSection] Missing dependencies for handleZoom");
        return;
    }
    const worldConfig = localCamera.userData.worldConfig;
    const zoomAmount = worldConfig.radius * Const.KEYBOARD_ZOOM_SPEED;

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
    if (localControls.update) localControls.update(); // This should trigger OrbitControls 'change' event
    // updateUIDisplay(); // Call directly if 'change' event isn't reliable for this
}

export function updateCameraControlsUI() {
    if (!localCamera || !localControls || !localCameraAnimator) return;

    if (distanceDisplayElement) {
        const currentDistance = localControls.getDistance ? localControls.getDistance() : localCamera.position.distanceTo(localControls.target);
        distanceDisplayElement.textContent = `Dist: ${currentDistance.toFixed(2)}`;
    }

    if (tiltValueDisplayElement && tiltSliderControl) {
        const currentTilt = localCameraAnimator.getTilt();
        tiltSliderControl.value = currentTilt; // Update slider position
        tiltValueDisplayElement.textContent = `${currentTilt.toFixed(0)}°`; // Just the value for the separate display
    }
}

export function CameraControlsSectionComponent({ camera, controls, cameraAnimator, worldConfig }) {
    localCamera = camera;
    localControls = controls;
    localCameraAnimator = cameraAnimator;
    // Stashing worldConfig on camera.userData if it's not directly available to handleZoom,
    // or ensure it's passed appropriately. For now, let's assume it can be passed or accessed.
    // A better way might be to pass it to handleZoom or make it available in this scope.
    if (worldConfig) {
        localCamera.userData.worldConfig = worldConfig;
    }


    // --- Zoom Controls Elements ---
    const zoomControlsContainer = document.createElement('div');
    zoomControlsContainer.style.display = 'flex';
    zoomControlsContainer.style.alignItems = 'center';
    zoomControlsContainer.style.marginBottom = '4px';

    distanceDisplayElement = document.createElement('div');
    distanceDisplayElement.classList.add('control-value-display'); // A generic class for values
    distanceDisplayElement.style.marginRight = '5px';
    distanceDisplayElement.style.minWidth = '70px'; // Ensure space

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.textContent = '-';
    zoomOutBtn.classList.add('control-button');
    zoomOutBtn.style.marginRight = '3px';
    zoomOutBtn.addEventListener('click', () => handleZoom(false));

    const zoomInBtn = document.createElement('button');
    zoomInBtn.textContent = '+';
    zoomInBtn.classList.add('control-button');
    zoomInBtn.addEventListener('click', () => handleZoom(true));

    zoomControlsContainer.appendChild(distanceDisplayElement);
    zoomControlsContainer.appendChild(zoomOutBtn);
    zoomControlsContainer.appendChild(zoomInBtn);

    // --- Tilt Controls Elements ---
    const tiltControlsContainer = document.createElement('div');
    tiltControlsContainer.style.display = 'flex';
    tiltControlsContainer.style.alignItems = 'center';

    const tiltLabel = document.createElement('div');
    tiltLabel.textContent = 'Tilt:';
    tiltLabel.classList.add('control-text-label'); // A generic class for text labels
    tiltLabel.style.marginRight = '3px';
    
    tiltValueDisplayElement = document.createElement('div');
    tiltValueDisplayElement.classList.add('control-value-display');
    tiltValueDisplayElement.style.minWidth = '30px'; // For "XX°"
    tiltValueDisplayElement.style.marginLeft = '3px';


    tiltSliderControl = SliderControl({
        id: 'camera-tilt-slider',
        min: 0,
        max: 80, // As per harp.gl example and our previous implementation
        step: 1,
        value: localCameraAnimator.getTilt ? localCameraAnimator.getTilt() : 0,
        onInput: (event) => {
            if (localCameraAnimator) {
                const newTilt = parseFloat(event.target.value);
                localCameraAnimator.setTilt(newTilt);
                if (tiltValueDisplayElement) { // Direct feedback
                    tiltValueDisplayElement.textContent = `${newTilt.toFixed(0)}°`;
                }
            }
        },
        // 'change' event on slider is usually fired on mouseup, useful for final state sync.
        // OrbitControls 'change' event should also call updateCameraControlsUI.
        onChange: () => {
            updateCameraControlsUI();
        }
    });
    tiltSliderControl.style.flexGrow = '1';

    tiltControlsContainer.appendChild(tiltLabel);
    tiltControlsContainer.appendChild(tiltSliderControl);
    tiltControlsContainer.appendChild(tiltValueDisplayElement);
    
    // --- Main Section ---
    const sectionChildren = [zoomControlsContainer, tiltControlsContainer];
    const cameraSection = ControlSection({
        label: 'Camera', // Changed label to 'Camera'
        children: sectionChildren
    });

    // Initial UI update
    updateCameraControlsUI();

    // Listen to OrbitControls change event to keep UI in sync
    if (localControls && localControls.addEventListener) {
        localControls.addEventListener('change', updateCameraControlsUI);
    }
    
    // Cleanup function to remove event listener
    cameraSection.dispose = () => {
        if (localControls && localControls.removeEventListener) {
            localControls.removeEventListener('change', updateCameraControlsUI);
        }
        // Nullify references if needed, though JS garbage collection should handle it
        // if the component is removed from DOM and no other references exist.
    };

    return cameraSection;
} 