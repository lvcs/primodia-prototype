import * as THREE from 'three';
import * as GameConst from '@/config/gameConstants.js';
import * as CamConfig from '@/camera/cameraConfig.js'; // Import CameraConfig
import { ControlSection } from './ControlSection.js';
import { SliderControl } from './SliderControl.js';

// Module-scoped variables
let localCameraRig; // Replaces localControls and localCameraAnimator
let localWorldConfig; // To store worldConfig for zoom calculations

let distanceDisplayElement;
let tiltValueDisplayElement;
let tiltSliderControlElement; // The <input type="range">

const ZOOM_STEP_FACTOR = 0.1; // Zoom in/out by 10% of current distance

/**
 * Handles manual zoom in/out actions triggered by UI buttons.
 */
async function handleZoom(isZoomIn) {
    if (!localCameraRig || !localWorldConfig) {
        console.warn("[CameraControlsSection.handleZoom] CameraRig or WorldConfig not available.");
        return;
    }

    const currentDistance = localCameraRig.getCurrentDistance();
    const zoomAmount = currentDistance * ZOOM_STEP_FACTOR; // Relative zoom step
    let newDistance = isZoomIn ? currentDistance - zoomAmount : currentDistance + zoomAmount;
    
    // CameraRig's animateDistance will clamp it.
    await localCameraRig.animateDistance(newDistance, CamConfig.DEFAULT_ANIMATION_DURATION_MS / 3, CamConfig.EASING_CURVE_FUNCTION);
    updateCameraControlsUI(); // Update UI after animation
}

/**
 * Updates the UI elements to reflect the current state of the CameraRig.
 */
export function updateCameraControlsUI() {
    if (!localCameraRig) return;

    if (distanceDisplayElement) {
        distanceDisplayElement.textContent = `Dist: ${localCameraRig.getCurrentDistance().toFixed(2)}`;
    }

    if (tiltValueDisplayElement && tiltSliderControlElement) {
        const currentUITilt = localCameraRig.getCurrentUITilt();
        tiltSliderControlElement.value = currentUITilt;
        tiltValueDisplayElement.textContent = `${currentUITilt.toFixed(0)}°`;
    }
}

/**
 * Creates and returns the DOM element for the Camera Controls UI section.
 * @param {{ cameraRig: CameraRig, worldConfig: object }} props
 * @returns {HTMLElement} The main container element for the camera controls section.
 */
export function CameraControlsSectionComponent({ cameraRig, worldConfig }) {
    localCameraRig = cameraRig;
    localWorldConfig = worldConfig; // Store for handleZoom
    
    const zoomControlsContainer = document.createElement('div');
    zoomControlsContainer.style.display = 'flex';
    zoomControlsContainer.style.alignItems = 'center';
    zoomControlsContainer.style.marginBottom = '4px';

    distanceDisplayElement = document.createElement('div');
    distanceDisplayElement.classList.add('control-value-display');
    distanceDisplayElement.style.marginRight = '5px';
    distanceDisplayElement.style.minWidth = '70px';

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

    const tiltControlsContainer = document.createElement('div');
    tiltControlsContainer.style.display = 'flex';
    tiltControlsContainer.style.alignItems = 'center';

    const tiltLabel = document.createElement('div');
    tiltLabel.textContent = 'Tilt:';
    tiltLabel.classList.add('control-text-label');
    tiltLabel.style.marginRight = '3px';
    
    tiltValueDisplayElement = document.createElement('div');
    tiltValueDisplayElement.classList.add('control-value-display');
    tiltValueDisplayElement.style.minWidth = '30px';
    tiltValueDisplayElement.style.marginLeft = '3px';

    // Storing the DOM element itself for direct value update
    tiltSliderControlElement = SliderControl({
        id: 'camera-tilt-slider',
        min: CamConfig.MIN_UI_TILT_DEG, 
        max: CamConfig.MAX_UI_TILT_DEG,
        step: 1,
        value: localCameraRig ? localCameraRig.getCurrentUITilt() : CamConfig.MIN_UI_TILT_DEG, // Initial value
        onInput: async (event) => {
            if (localCameraRig) {
                const newTilt = parseFloat(event.target.value);
                if (tiltValueDisplayElement) {
                    tiltValueDisplayElement.textContent = `${newTilt.toFixed(0)}°`; // Immediate feedback
                }
                // For onInput, we might want a faster, non-animated set if available, or a very short animation.
                // Or, only trigger full animation on onChange.
                // For now, let's use animateTiltZoom but user might want direct setTilt if dragging fast.
                // We'll make it a shorter animation for responsiveness.
                await localCameraRig.animateTiltZoom(
                    newTilt, 
                    localCameraRig.getCurrentDistance(), // Maintain current distance
                    CamConfig.DEFAULT_ANIMATION_DURATION_MS / 4, // Shorter animation for slider drag
                    CamConfig.EASING_CURVE_FUNCTION
                );
                 // updateCameraControlsUI(); // Full sync after animation completes if needed (onChange handles this too)
            }
        },
        onChange: () => { // Fired when the user releases the slider
            updateCameraControlsUI(); // Ensures UI fully syncs with the definitive state
        }
    });
    tiltSliderControlElement.style.flexGrow = '1';

    tiltControlsContainer.appendChild(tiltLabel);
    tiltControlsContainer.appendChild(tiltSliderControlElement);
    tiltControlsContainer.appendChild(tiltValueDisplayElement);
    
    const sectionChildren = [zoomControlsContainer, tiltControlsContainer];
    const cameraSection = ControlSection({
        label: 'Camera',
        children: sectionChildren
    });

    updateCameraControlsUI(); // Initial UI state update

    // How to update UI if CameraRig changes externally (e.g., after click-to-tile)?
    // CameraRig could dispatch a custom event, or the game loop could call updateCameraControlsUI periodically.
    // For now, rely on interactions within this component or explicit calls after other animations.

    cameraSection.dispose = () => {
        // No specific event listeners on CameraRig to remove currently.
        // Nullify local references if desired for GC, though usually not strictly necessary.
        // localCameraRig = null; localWorldConfig = null;
        // distanceDisplayElement = null; tiltValueDisplayElement = null; tiltSliderControlElement = null;
    };

    return cameraSection;
} 