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

    // --- Camera Debug Sliders ---
    // Get dynamic ranges from controls and world config (with fallbacks)
    const worldRadius = worldConfig && worldConfig.radius ? worldConfig.radius : 6400;
    const minDistance = localControls && localControls.minDistance !== undefined ? localControls.minDistance : worldRadius;
    const maxDistance = localControls && localControls.maxDistance !== undefined ? localControls.maxDistance : worldRadius * 5;

    // Helper to create a labeled slider row
    function createSliderRow(labelText, slider, valueDisplay) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '4px';
        const label = document.createElement('div');
        label.textContent = labelText;
        label.className = 'control-text-label';
        label.style.width = '90px';
        row.appendChild(label);
        row.appendChild(slider);
        if (valueDisplay) {
            valueDisplay.className = 'control-value-display';
            valueDisplay.style.marginLeft = '5px';
            row.appendChild(valueDisplay);
        }
        return row;
    }

    // State for slider values
    let cameraRig = localCamera.parent;
    if (!cameraRig || cameraRig.type !== 'Object3D') cameraRig = localCamera; // fallback
    // Target X
    const targetXDisplay = document.createElement('span');
    const targetXSlider = SliderControl({
        id: 'camera-target-x-slider',
        min: (-worldRadius).toFixed(2),
        max: worldRadius.toFixed(2),
        step: (worldRadius/100).toFixed(2),
        value: '0',
        onInput: (e) => {
            targetXDisplay.textContent = e.target.value;
            applyCameraPanelControls();
        }
    });
    targetXDisplay.textContent = '0';
    // Target Y
    const targetYDisplay = document.createElement('span');
    const targetYSlider = SliderControl({
        id: 'camera-target-y-slider',
        min: (-worldRadius).toFixed(2),
        max: worldRadius.toFixed(2),
        step: (worldRadius/100).toFixed(2),
        value: '0',
        onInput: (e) => {
            targetYDisplay.textContent = e.target.value;
            applyCameraPanelControls();
        }
    });
    targetYDisplay.textContent = '0';
    // Target Z
    const targetZDisplay = document.createElement('span');
    const targetZSlider = SliderControl({
        id: 'camera-target-z-slider',
        min: (-worldRadius).toFixed(2),
        max: worldRadius.toFixed(2),
        step: (worldRadius/100).toFixed(2),
        value: '0',
        onInput: (e) => {
            targetZDisplay.textContent = e.target.value;
            applyCameraPanelControls();
        }
    });
    targetZDisplay.textContent = '0';
    // Zoom Distance
    const zoomDisplay = document.createElement('span');
    const initialZoom = cameraRig.position.length ? cameraRig.position.length() : worldRadius * 2.5;
    const zoomSlider = SliderControl({
        id: 'camera-zoom-distance-slider',
        min: minDistance.toString(),
        max: maxDistance.toString(),
        step: ((maxDistance - minDistance)/100).toFixed(2),
        value: initialZoom.toString(),
        onInput: (e) => {
            zoomDisplay.textContent = e.target.value;
            applyCameraPanelControls();
        }
    });
    zoomDisplay.textContent = initialZoom.toString();
    // Yaw
    const yawDisplay = document.createElement('span');
    const yawSlider = SliderControl({
        id: 'camera-yaw-slider',
        min: (-Math.PI).toFixed(4),
        max: Math.PI.toFixed(4),
        step: (Math.PI/180).toFixed(4),
        value: localCamera.rotation.y.toString(),
        onInput: (e) => {
            yawDisplay.textContent = parseFloat(e.target.value).toFixed(2);
            applyCameraPanelControls();
        }
    });
    yawDisplay.textContent = parseFloat(localCamera.rotation.y).toFixed(2);
    // Roll
    const rollDisplay = document.createElement('span');
    const rollSlider = SliderControl({
        id: 'camera-roll-slider',
        min: (-Math.PI).toFixed(4),
        max: Math.PI.toFixed(4),
        step: (Math.PI/180).toFixed(4),
        value: localCamera.rotation.z.toString(),
        onInput: (e) => {
            rollDisplay.textContent = parseFloat(e.target.value).toFixed(2);
            applyCameraPanelControls();
        }
    });
    rollDisplay.textContent = parseFloat(localCamera.rotation.z).toFixed(2);

    // Function to apply all slider values to CameraRig and Camera
    function applyCameraPanelControls() {
        const targetVec = new THREE.Vector3(
            parseFloat(targetXSlider.value),
            parseFloat(targetYSlider.value),
            parseFloat(targetZSlider.value)
        );
        const zoomDist = parseFloat(zoomSlider.value);
        const dir = new THREE.Vector3();
        localCamera.getWorldDirection(dir).negate();
        if (cameraRig && cameraRig.position && cameraRig.lookAt) {
            cameraRig.position.copy(targetVec.clone().add(dir.multiplyScalar(zoomDist)));
            cameraRig.lookAt(targetVec);
        }
        localCamera.rotation.set(
            0, // Pitch (X) is always 0
            parseFloat(yawSlider.value),
            parseFloat(rollSlider.value)
        );
        if (localControls && localControls.target) {
            localControls.target.copy(targetVec);
            if (localControls.update) localControls.update();
        }
    }

    // --- Main Section ---
    const sectionChildren = [zoomControlsContainer];
    // Add all sliders to the panel BEFORE creating the ControlSection
    sectionChildren.push(
        createSliderRow('Target X:', targetXSlider, targetXDisplay),
        createSliderRow('Target Y:', targetYSlider, targetYDisplay),
        createSliderRow('Target Z:', targetZSlider, targetZDisplay),
        createSliderRow('Zoom Dist:', zoomSlider, zoomDisplay),
        createSliderRow('Yaw (rad):', yawSlider, yawDisplay),
        createSliderRow('Roll (rad):', rollSlider, rollDisplay)
    );
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