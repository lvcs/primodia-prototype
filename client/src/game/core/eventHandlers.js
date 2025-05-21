// Event listeners for window resize, mouse clicks (tile selection), etc. 

import * as THREE from 'three';
// Adjust path for debug.js, now a sibling in utils/
import { debug, error, updateTileDebugInfo } from '@game/utils/debug'; 
// Adjust path for planetSphereVoronoi.js, assuming it will be in client/src/game/world/
import { classifyTerrain } from '@game/world/planetSphereVoronoi'; 
// Adjust path for mouseControls.js, assuming it will be in client/src/game/controls/
import { initMouseControls, disposeMouseControls } from '@game/controls/mouseControls'; 
// Adjust path for keyboardControls.js, assuming it will be in client/src/game/controls/
import { initKeyboardControls, disposeKeyboardControls } from '@game/controls/keyboardControls'; 
// Adjust path for CameraOrbitController.js, assuming it will be in client/src/game/controls/
import CameraOrbitController from '@game/controls/CameraOrbitController';

// Import getters for shared state - these are fine as they are in the same directory (core)
import { getCamera, getRenderer, getWorldConfig, getControls } from './setup.js'; 
// Adjust path for planet.js, assuming it will be in client/src/game/
import { getPlanetGroup, getWorldData } from '@game/planet'; 
import RandomService from './RandomService.js';
// Adjust path for Camera.js, assuming it will be in client/src/camera/
// This might need to be a new React-based camera control system or store interaction later.
import { Camera } from '@/camera/Camera'; 

const HIGHLIGHT_SCALE_FACTOR = 1.003;
const MAX_DRAG_DIST_FOR_CLICK = 10; 
const MAX_DRAG_TIME_FOR_CLICK = 250;

let selectedHighlight = null;
let cameraAnimator = null; 
let orbitController = null;

let mouseDownTime;
let mouseDownPosition = new THREE.Vector2();

export function getSelectedHighlight() {
    return selectedHighlight;
}

// This function creates DOM elements directly. This should be handled by React UI if needed.
// For now, it will likely not work as expected or append to document.body which is bad form in React.
// Consider removing or replacing with a UI store action that a React component can listen to.
function addGlobeViewButton(cameraAnimatorInstance) {
    let globeBtn = document.getElementById('globe-view-btn-old-eventhandler'); // Changed ID to avoid conflict
    if (!globeBtn) {
        debug('[eventHandlers] addGlobeViewButton: Creating old button (should be replaced by React UI)');
        /* globeBtn = document.createElement('button'); ... */
        // Commenting out DOM creation for now to prevent issues.
        // This button's functionality is now intended to be part of UserInfo.jsx
    }
    // return globeBtn;
}

export function setupRootEventListeners(canvasElement) { // canvasElement is renderer.domElement
    const cameraInstance = getCamera(); 
    const rendererInstance = getRenderer(); 
    const planetGroupInstance = getPlanetGroup(); 
    const orbitControlsInstance = getControls(); 
    const worldConfigInstance = getWorldConfig();   

    if (cameraInstance && planetGroupInstance && orbitControlsInstance && worldConfigInstance) {
      cameraAnimator = new Camera(
        cameraInstance,
        planetGroupInstance,
        orbitControlsInstance,      
        worldConfigInstance.radius  
      );
      window.cameraAnimator = cameraAnimator; // TODO: Avoid global exposure if possible, use stores/context
      
      const initialRadius = cameraInstance.position.length();
      const initialPhi = Math.acos(cameraInstance.position.y / initialRadius);
      const initialTheta = Math.atan2(cameraInstance.position.z, cameraInstance.position.x);
      orbitController = new CameraOrbitController(cameraInstance, initialRadius, initialPhi, initialTheta);
      window.orbitController = orbitController; // TODO: Avoid global exposure
      
      // addGlobeViewButton(cameraAnimator); // Deprecated: UserInfo.jsx handles this via props
    } else {
      error("Failed to initialize CameraAnimator/OrbitController: Missing dependencies.");
    }
    
    // Resize listener should ideally be managed by React, perhaps in App.jsx or a layout component
    // For now, keep it, but it might be redundant if canvas size is managed by CSS/React layout.
    const handleResize = () => {
        const cam = getCamera(); 
        const rend = getRenderer();
        if (!cam || !rend || !rend.domElement) return;
        // Use parent clientWidth/Height if canvas is styled to fill parent
        const canvas = rend.domElement;
        const newWidth = canvas.clientWidth;
        const newHeight = canvas.clientHeight;

        if (canvas.width !== newWidth || canvas.height !== newHeight) {
            cam.aspect = newWidth / newHeight;
            cam.updateProjectionMatrix();
            rend.setSize(newWidth, newHeight, false); // Set updateStyle to false if React/CSS handles size
            debug(`[eventHandlers] Resized to ${newWidth}x${newHeight}`);
        }
    };
    window.addEventListener('resize', handleResize);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    if (canvasElement) { // Changed from rendererInstance.domElement to canvasElement
        canvasElement.addEventListener('mousedown', (event) => {
            mouseDownTime = Date.now();
            mouseDownPosition.set(event.clientX, event.clientY);
        });

        canvasElement.addEventListener('click', (event) => {
            const cam = getCamera();
            const rend = getRenderer(); // rend.domElement is canvasElement
            const wConfig = getWorldConfig();
            const pGroup = getPlanetGroup();
            const wData = getWorldData();

            if (!rend || !cam || !wConfig || !pGroup || !wData || !wData.globe) {
                error('Missing dependencies for click event');
                return;
            }

            const rect = canvasElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            const pressDuration = Date.now() - mouseDownTime;
            const moveDistance = mouseDownPosition.distanceTo(new THREE.Vector2(event.clientX, event.clientY));

            if (moveDistance > MAX_DRAG_DIST_FOR_CLICK || pressDuration > MAX_DRAG_TIME_FOR_CLICK) {
                // debug('Drag detected, click-to-rotate animation skipped.'); // Already handled by OrbitControls
                return; 
            }

            raycaster.setFromCamera(mouse, cam);
            const intersections = raycaster.intersectObject(pGroup, true);
            if (intersections.length === 0) return;

            let mainIntersect = intersections[0];
            for (let i = 0; i < intersections.length; i++) {
                if (intersections[i].object.userData.isMainMesh) {
                    mainIntersect = intersections[i];
                    break;
                }
            }

            const point = mainIntersect.point.clone().sub(pGroup.position);
            const radius = wConfig.radius;
            const normal = point.clone().normalize();
            const lat = Math.asin(normal.y) * (180 / Math.PI);
            const lon = Math.atan2(normal.z, normal.x) * (180 / Math.PI);
            let tileId = null;
            const attr = mainIntersect.object.geometry.getAttribute('tileId');
            if (attr && mainIntersect.faceIndex !== undefined) { // Check faceIndex
                const idx = mainIntersect.faceIndex * 3;
                tileId = attr.array[idx]; // Potential issue if faceIndex is for non-triangulated part
            }

            let terrain = classifyTerrain(normal, RandomService.nextFloat.bind(RandomService)); 
            if (mainIntersect.object.userData.tileTerrain) {
                const mapTT = mainIntersect.object.userData.tileTerrain;
                if (tileId != null && mapTT[tileId]) terrain = mapTT[tileId];
            }

            let plateId = null;
            if (mainIntersect.object.userData.tilePlate && tileId != null) {
                plateId = mainIntersect.object.userData.tilePlate[tileId];
            }

            if (selectedHighlight) {
                pGroup.remove(selectedHighlight);
                if (selectedHighlight.geometry) selectedHighlight.geometry.dispose();
                selectedHighlight = null;
            }

            if (tileId !== null && mainIntersect.object.userData.tileEdges && mainIntersect.object.userData.tileEdges[tileId]) {
                const posArr = mainIntersect.object.userData.tileEdges[tileId];
                const scaled = [];
                for (let i = 0; i < posArr.length; i += 3) {
                    const vx = posArr[i], vy = posArr[i+1], vz = posArr[i+2];
                    const vec = new THREE.Vector3(vx, vy, vz).normalize().multiplyScalar(wConfig.radius * HIGHLIGHT_SCALE_FACTOR);
                    scaled.push(vec.x, vec.y, vec.z);
                }
                const geo = new THREE.BufferGeometry();
                geo.setAttribute('position', new THREE.Float32BufferAttribute(scaled, 3));
                const mat = new THREE.LineBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.9 });
                selectedHighlight = new THREE.LineSegments(geo, mat);
                selectedHighlight.userData.isHighlight = true;
                pGroup.add(selectedHighlight);
            }

            const elevation = mainIntersect.object.userData.tileElevation && tileId !== null ? mainIntersect.object.userData.tileElevation[tileId] : null;
            const moisture = mainIntersect.object.userData.tileMoisture && tileId !== null ? mainIntersect.object.userData.tileMoisture[tileId] : null;

            debug(`Tile ${tileId} – Terr:${terrain} Plate:${plateId} Elev:${elevation?.toFixed(2)} Moist:${moisture?.toFixed(2)} Lat:${lat.toFixed(2)}° Lon:${lon.toFixed(2)}°`);

            const clickedTileForUI = wData.globe.getTile(tileId);
            const areaForUI = clickedTileForUI?.area !== undefined ? clickedTileForUI.area.toFixed(4) + ' km²' : 'N/A';
            const currentSeed = RandomService.getCurrentSeed(); 
            const tileInfoHtml =
                `Seed: ${currentSeed === undefined ? 'N/A' : currentSeed}<br>` +
                `--- Tile Info ---<br>` +
                `ID: ${tileId}<br>` +
                `Terr: ${terrain}<br>` +
                `Plate: ${plateId}<br>` +
                `Area: ${areaForUI}<br>` +
                `Elev: ${elevation?.toFixed(2)}<br>` +
                `Moist: ${moisture?.toFixed(2)}<br>` +
                `Lat: ${lat.toFixed(2)}°<br>` +
                `Lon: ${lon.toFixed(2)}°`;
            
            // updateTileDebugInfo(tileInfoHtml); // This calls the debug.js version which now console.logs
            // For React UI, this should update useDebugStore
            useDebugStore.getState().setTileDebugHTML(tileInfoHtml); // Example of direct store update

            const clickedTile = wData.globe.getTile(tileId);
            if (clickedTile) {
                if (cameraAnimator) {
                  const tileDataForCamera = {
                    latitude: clickedTile.lat,
                    longitude: clickedTile.lon
                  };
                  cameraAnimator.animateToTile(tileDataForCamera, () => {
                    // const globeBtn = document.getElementById('globe-view-btn-old-eventhandler');
                    // if (globeBtn) globeBtn.style.display = 'block'; // Old DOM button
                    // New: Trigger UI store state if needed, e.g., to show a globe view button in React UI
                  });
                } else {
                  error("CameraAnimator not initialized. Cannot animate to tile.");
                }
            }
        });
    } else {
        error('Canvas element not available for click listener setup in setupRootEventListeners.');
    }

    const cam = getCamera();
    const pGroup = getPlanetGroup();
    const orbitControls = getControls(); 
    // const rend = getRenderer(); // rend is already rendererInstance here
    const wConfig = getWorldConfig();

    if (cam && pGroup && orbitControls && rendererInstance && wConfig && orbitController) {
        initMouseControls(cam, orbitControls, rendererInstance, orbitController);
        initKeyboardControls(cam, orbitControls, wConfig, orbitController);
    } else {
        error('One or more dependencies for control (mouse/keyboard) initialization are missing in setupRootEventListeners.');
    }
    return cameraAnimator; 
}

export function setupMouseTrackingState(canvasElement) { // canvasElement is renderer.domElement
    // This function seems to have its content commented out in the original.
    // If mouse down/up/leave state is needed globally, it should be managed carefully.
    // OrbitControls and custom mouse controls in mouseControls.js likely handle their own state.
}

export function reinitializeControls() {
    const cam = getCamera();
    const pGroup = getPlanetGroup();
    const orbitControls = getControls(); 
    const rend = getRenderer();
    const wConfig = getWorldConfig();

    if (cam && pGroup && orbitControls && rend && wConfig && orbitController) {
        disposeMouseControls(); 
        disposeKeyboardControls();
        initMouseControls(cam, orbitControls, rend, orbitController);
        initKeyboardControls(cam, orbitControls, wConfig, orbitController);
        debug('Mouse and Keyboard controls re-initialized.');
    } else {
        error('Failed to re-initialize controls due to missing dependencies.');
    }
} 