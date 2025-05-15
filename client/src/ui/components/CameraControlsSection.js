import * as THREE from 'three';
import * as Const from '@/config/gameConstants.js';
import { ControlSection } from './ControlSection.js';
import { SliderControl } from './SliderControl.js';

// Module-scoped variables to hold references to the core game/camera components.
// These are set when CameraControlsSectionComponent is initialized.
let localCamera;
let localControls; // OrbitControls instance
let localCameraAnimator; // Instance of our Camera class from @/camera/Camera.js

// Module-scoped UI elements that need to be updated dynamically.
let distanceDisplayElement;
let tiltValueDisplayElement;
let tiltSliderControl; // The <input type="range"> DOM element for tilt.

/**
 * Handles manual zoom in/out actions triggered by UI buttons.
 * Adjusts camera position directly and updates OrbitControls.
 * @param {boolean} isZoomIn - True to zoom in, false to zoom out.
 */
function handleZoom(isZoomIn) {
    // Ensure all necessary components are available.
    if (!localCamera || !localControls || !localCamera.userData.worldConfig) {
        console.warn("[CameraControlsSection.handleZoom] Missing dependencies for zoom handling.");
        return;
    }
    const worldConfig = localCamera.userData.worldConfig;
    const zoomAmount = worldConfig.radius * Const.KEYBOARD_ZOOM_SPEED; // Using KEYBOARD_ZOOM_SPEED for button zoom step

    if (isZoomIn) {
        // Move camera closer to the target along the current line of sight.
        localCamera.position.addScaledVector(new THREE.Vector3().subVectors(localControls.target, localCamera.position).normalize(), zoomAmount);
        // Enforce minDistance constraint.
        if (localCamera.position.distanceTo(localControls.target) < localControls.minDistance) {
            localCamera.position.sub(localControls.target).setLength(localControls.minDistance).add(localControls.target);
        }
    } else {
        // Move camera further from the target along the current line of sight.
        localCamera.position.addScaledVector(new THREE.Vector3().subVectors(localCamera.position, localControls.target).normalize(), zoomAmount);
        // Enforce maxDistance constraint.
        if (localCamera.position.distanceTo(localControls.target) > localControls.maxDistance) {
            localCamera.position.sub(localControls.target).setLength(localControls.maxDistance).add(localControls.target);
        }
    }
    // After programmatically changing camera position, OrbitControls needs to be updated
    // to synchronize its internal state. This should also trigger its 'change' event.
    if (localControls.update) localControls.update();
}

/**
 * Updates the UI elements (distance display, tilt slider, and tilt value) in this section
 * to reflect the current state of the camera and OrbitControls.
 * This function is typically called by OrbitControls 'change' event or after programmatic camera changes.
 */
export function updateCameraControlsUI() {
    if (!localCamera || !localControls || !localCameraAnimator) return;

    // Update distance display.
    if (distanceDisplayElement) {
        const currentDistance = localControls.getDistance ? localControls.getDistance() : localCamera.position.distanceTo(localControls.target);
        distanceDisplayElement.textContent = `Dist: ${currentDistance.toFixed(2)}`;
    }

    // Update tilt display and slider position.
    if (tiltValueDisplayElement && tiltSliderControl) {
        const currentTilt = localCameraAnimator.getTilt(); // Gets tilt in degrees from Camera.js
        tiltSliderControl.value = currentTilt; // Sync slider position with actual camera tilt.
        tiltValueDisplayElement.textContent = `${currentTilt.toFixed(0)}°`; // Display the tilt value.
    }
}

/**
 * Creates and returns the DOM element for the Camera Controls UI section.
 * This section includes controls for camera zoom and tilt.
 * @param {{camera: THREE.PerspectiveCamera, controls: THREE.OrbitControls, cameraAnimator: Camera, worldConfig: object}} props
 * @returns {HTMLElement} The main container element for the camera controls section.
 */
export function CameraControlsSectionComponent({ camera, controls, cameraAnimator, worldConfig }) {
    localCamera = camera;
    localControls = controls;
    localCameraAnimator = cameraAnimator;
    
    // Store worldConfig (needed for zoom step calculation) in a way that handleZoom can access it.
    // Attaching to camera.userData is one way if worldConfig isn't globally accessible or passed down through all relevant functions.
    if (worldConfig && localCamera) { // Ensure localCamera is defined before accessing userData
        if (!localCamera.userData) localCamera.userData = {};
        localCamera.userData.worldConfig = worldConfig;
    }

    // --- Zoom Controls Elements: Container for Dist display, Zoom Out (-), Zoom In (+) ---
    const zoomControlsContainer = document.createElement('div');
    zoomControlsContainer.style.display = 'flex';
    zoomControlsContainer.style.alignItems = 'center';
    zoomControlsContainer.style.marginBottom = '4px'; // Spacing between zoom and tilt rows

    distanceDisplayElement = document.createElement('div');
    distanceDisplayElement.classList.add('control-value-display');
    distanceDisplayElement.style.marginRight = '5px';
    distanceDisplayElement.style.minWidth = '70px'; // To prevent layout shifts

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

    // --- Tilt Controls Elements: Container for "Tilt:" label, Slider, and Value (e.g., "45°") ---
    const tiltControlsContainer = document.createElement('div');
    tiltControlsContainer.style.display = 'flex';
    tiltControlsContainer.style.alignItems = 'center';

    const tiltLabel = document.createElement('div');
    tiltLabel.textContent = 'Tilt:';
    tiltLabel.classList.add('control-text-label');
    tiltLabel.style.marginRight = '3px';
    
    tiltValueDisplayElement = document.createElement('div');
    tiltValueDisplayElement.classList.add('control-value-display');
    tiltValueDisplayElement.style.minWidth = '30px'; // For "XX°"
    tiltValueDisplayElement.style.marginLeft = '3px';

    tiltSliderControl = SliderControl({
        id: 'camera-tilt-slider',
        min: 0,  // 0 degrees = camera looking straight down
        max: 80, // Max tilt towards the horizon (harp.gl example uses 80)
        step: 1, // 1-degree increments
        value: localCameraAnimator && typeof localCameraAnimator.getTilt === 'function' ? localCameraAnimator.getTilt() : 0,
        onInput: (event) => { // Fired continuously while dragging the slider
            if (localCameraAnimator) {
                const newTilt = parseFloat(event.target.value);
                // This call to cameraAnimator.setTilt will adjust the CAMERA's viewing angle (polar angle).
                localCameraAnimator.setTilt(newTilt);
                if (tiltValueDisplayElement) { // Provide immediate visual feedback for the tilt value.
                    tiltValueDisplayElement.textContent = `${newTilt.toFixed(0)}°`;
                }
            }
        },
        onChange: () => { // Fired when the user releases the slider (or after keyboard interaction)
            // Ensures the UI fully syncs with the definitive state from the camera/controls,
            // especially if onInput updates were partial or if state was changed by other means.
            updateCameraControlsUI();
        }
    });
    tiltSliderControl.style.flexGrow = '1'; // Allows slider to take up available horizontal space.

    tiltControlsContainer.appendChild(tiltLabel);
    tiltControlsContainer.appendChild(tiltSliderControl);
    tiltControlsContainer.appendChild(tiltValueDisplayElement);
    
    // --- Assemble Section --- 
    // Use the ControlSection component to wrap zoom and tilt controls under a "Camera" label.
    const sectionChildren = [zoomControlsContainer, tiltControlsContainer];
    const cameraSection = ControlSection({
        label: 'Camera',
        children: sectionChildren
    });

    // Perform an initial UI update to set correct values when the component is first created.
    updateCameraControlsUI();

    // Listen to OrbitControls 'change' event. This event fires when the camera is changed by
    // user interaction (drag, zoom wheel) or by programmatic calls to controls.update().
    // This keeps our custom UI (distance, tilt slider) in sync with the actual camera state.
    if (localControls && localControls.addEventListener) {
        localControls.addEventListener('change', updateCameraControlsUI);
    }
    
    // Add a dispose method to the returned section element for cleanup.
    // This allows removing the OrbitControls 'change' listener when the UI component is removed from the DOM.
    cameraSection.dispose = () => {
        if (localControls && localControls.removeEventListener) {
            localControls.removeEventListener('change', updateCameraControlsUI);
        }
        // Consider nullifying module-scoped variables if this component can be re-created multiple times
        // and old references could cause issues, though JS garbage collection should handle them if unreferenced.
        // localCamera = null; localControls = null; localCameraAnimator = null;
        // distanceDisplayElement = null; tiltValueDisplayElement = null; tiltSliderControl = null;
    };

    return cameraSection;
} 