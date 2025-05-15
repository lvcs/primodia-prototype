// Event listeners for window resize, mouse clicks (tile selection), etc. 

import * as THREE from 'three';
import { debug, error } from '@/game/utils/debug.js'; // Path updated
import { classifyTerrain } from '@/game/world/planetSphereVoronoi.js'; // Path updated
import { initMouseControls, disposeMouseControls } from '@/game/controls/mouseControls.js'; // Path updated
import { initKeyboardControls, disposeKeyboardControls } from '@/game/controls/keyboardControls.js'; // Path updated

// Import getters for shared state
import { getCamera, getRenderer, getWorldConfig, getCameraRig } from './setup.js'; // Path updated (sibling in core/)
import { getPlanetGroup, getWorldData } from '@/game/planet.js'; // Path updated
import RandomService from './RandomService.js'; // Import RandomService
import * as CamConfig from '@/camera/cameraConfig.js'; // ADDED for click animation params
import { updateCameraControlsUI } from '@/ui/components/CameraControlsSection.js'; // ADDED

// Factor to slightly scale highlight geometry to prevent z-fighting.
const HIGHLIGHT_SCALE_FACTOR = 1.003;
// Maximum mouse movement (in pixels) allowed during a mousedown/mouseup sequence to be considered a click.
const MAX_DRAG_DIST_FOR_CLICK = 10; 
// Maximum time (in milliseconds) a mousedown can last to still be considered part of a click.
const MAX_DRAG_TIME_FOR_CLICK = 250; 

let selectedHighlight = null;
// let cameraAnimator = null; // REMOVED old cameraAnimator instance

// Variables to track mouse press state to distinguish a click from a drag operation.
let mouseDownTime;
let mouseDownPosition = new THREE.Vector2();

export function getSelectedHighlight() {
    return selectedHighlight;
}

/**
 * Sets up root event listeners for the application, including window resize and canvas interactions.
 * @returns {CameraRig | null} The initialized CameraRig instance.
 */
export function setupRootEventListeners() {
    const cameraInstance = getCamera();
    const rendererInstance = getRenderer();
    // const planetGroupInstance = getPlanetGroup(); // Not directly used by CameraRig setup here
    const cameraRigInstance = getCameraRig(); // Now expecting CameraRig from setup.js
    // const worldConfigInstance = getWorldConfig(); // Not directly used by CameraRig setup here

    // The CameraRig is now expected to be set up in setup.js and retrieved by getCameraRig()
    // No need to instantiate it here.
    if (!cameraRigInstance) {
      error("CameraRig not available from getCameraRig() in setupRootEventListeners.");
    }
    
    // Handles window resize to keep camera and renderer updated.
    window.addEventListener('resize', () => {
        const cam = getCamera(); 
        const rend = getRenderer();
        if (!cam || !rend) return;
        cam.aspect = window.innerWidth / window.innerHeight;
        cam.updateProjectionMatrix();
        rend.setSize(window.innerWidth, window.innerHeight);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(); // For converting screen coords to normalized device coords

    if (rendererInstance && rendererInstance.domElement) {
        // Listener for mousedown to record start time and position for click vs. drag detection.
        rendererInstance.domElement.addEventListener('mousedown', (event) => {
            mouseDownTime = Date.now();
            mouseDownPosition.set(event.clientX, event.clientY);
        });

        // Listener for click events on the renderer's canvas.
        rendererInstance.domElement.addEventListener('click', async (event) => { // Made async for await
            const cam = getCamera();
            const rend = getRenderer();
            const wConfig = getWorldConfig();
            const pGroup = getPlanetGroup();
            const wData = getWorldData();
            const activeCameraRig = getCameraRig(); // Get current CameraRig instance

            if (!rend || !cam || !wConfig || !pGroup || !wData || !wData.globe || !activeCameraRig) {
                error('[eventHandlers.click] Missing dependencies for click event processing (incl. CameraRig).');
                return;
            }

            // Calculate normalized device coordinates from screen click.
            const rect = rend.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            // Check if this "click" was actually the end of a drag.
            const pressDuration = Date.now() - mouseDownTime;
            const moveDistance = mouseDownPosition.distanceTo(new THREE.Vector2(event.clientX, event.clientY));

            if (moveDistance > MAX_DRAG_DIST_FOR_CLICK || pressDuration > MAX_DRAG_TIME_FOR_CLICK) {
                debug('[eventHandlers.click] Drag detected, click animation skipped.');
                return; // Interpreted as a drag, so don't proceed with click-specific actions.
            }

            // Perform raycasting to find intersected objects on the globe.
            raycaster.setFromCamera(mouse, cam);
            const intersections = raycaster.intersectObject(pGroup, true); // true for recursive check
            if (intersections.length === 0) return; // No intersection with the planet group.

            // Prioritize intersection with the main globe mesh if multiple objects are hit.
            let mainIntersect = intersections[0];
            for (let i = 0; i < intersections.length; i++) {
                if (intersections[i].object.userData.isMainMesh) {
                    mainIntersect = intersections[i];
                    break;
                }
            }

            // Extract tile information from the intersection point.
            const point = mainIntersect.point.clone().sub(pGroup.position); // Point relative to planet group center
            const normal = point.clone().normalize();
            const lat = Math.asin(normal.y) * (180 / Math.PI);
            const lon = Math.atan2(normal.z, normal.x) * (180 / Math.PI);
            
            let tileId = null;
            const attr = mainIntersect.object.geometry.getAttribute('tileId');
            if (attr && mainIntersect.faceIndex !== undefined) {
                const idx = mainIntersect.faceIndex * 3; // Assuming non-indexed BufferGeometry with 3 vertices per face for tileId attribute
                tileId = attr.array[idx]; // This might need adjustment based on how tileId is stored (per vertex or per face)
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

            // Remove previous highlight and create a new one for the clicked tile.
            if (selectedHighlight) {
                pGroup.remove(selectedHighlight);
                if (selectedHighlight.geometry) selectedHighlight.geometry.dispose();
                selectedHighlight = null;
            }
            if (mainIntersect.object.userData.tileEdges && mainIntersect.object.userData.tileEdges[tileId]) {
                const posArr = mainIntersect.object.userData.tileEdges[tileId];
                const scaled = [];
                for (let i = 0; i < posArr.length; i += 3) {
                    const vec = new THREE.Vector3(posArr[i], posArr[i+1], posArr[i+2]).normalize().multiplyScalar(wConfig.radius * HIGHLIGHT_SCALE_FACTOR);
                    scaled.push(vec.x, vec.y, vec.z);
                }
                const geo = new THREE.BufferGeometry();
                geo.setAttribute('position', new THREE.Float32BufferAttribute(scaled, 3));
                const mat = new THREE.LineBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.9 });
                selectedHighlight = new THREE.LineSegments(geo, mat);
                selectedHighlight.userData.isHighlight = true;
                pGroup.add(selectedHighlight);
            }

            // Update debug UI with clicked tile information.
            const elevation = mainIntersect.object.userData.tileElevation ? mainIntersect.object.userData.tileElevation[tileId] : null;
            const moisture = mainIntersect.object.userData.tileMoisture ? mainIntersect.object.userData.tileMoisture[tileId] : null;
            debug(`[eventHandlers.click] Tile ${tileId} – Terr:${terrain} Plate:${plateId} Elev:${elevation?.toFixed(2)} Moist:${moisture?.toFixed(2)} Lat:${lat.toFixed(2)}° Lon:${lon.toFixed(2)}°`);
            const statusDiv = document.getElementById('debug-status');
            if (statusDiv) {
                const clickedTileForUI = wData.globe.getTile(tileId);
                const areaForUI = clickedTileForUI?.area !== undefined ? clickedTileForUI.area.toFixed(4) : 'N/A';
                const currentSeed = RandomService.getCurrentSeed();
                statusDiv.innerHTML =
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
            }

            // If a valid tile was clicked and the cameraRig is available, trigger globe rotation.
            const clickedTile = wData.globe.getTile(tileId);
            if (clickedTile) {
                if (activeCameraRig) {
                    debug(`[eventHandlers.click] Animating CameraRig to tile ${tileId} (Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)})`);
                    activeCameraRig.stopAnimation(); // Stop any ongoing animation first
                    try {
                        await activeCameraRig.lookAtTile(
                            lat, 
                            lon,
                            CamConfig.DEFAULT_ANIMATION_DURATION_MS / 2,
                            CamConfig.EASING_CURVE_FUNCTION
                        );
                        debug('[eventHandlers.click] lookAtTile animation complete.');

                        const targetDistance = wConfig.radius * CamConfig.CLICK_FOCUS_DISTANCE_FACTOR;
                        await activeCameraRig.animateTiltZoom(
                            CamConfig.CLICK_FOCUS_TILT_DEG,
                            targetDistance,
                            CamConfig.DEFAULT_ANIMATION_DURATION_MS / 2,
                            CamConfig.EASING_CURVE_FUNCTION
                        );
                        debug('[eventHandlers.click] animateTiltZoom animation complete.');

                    } catch (animError) {
                        // Error could be a boolean false if animation was interrupted by stopAnimation itself
                        if (animError !== false) { 
                           error('[eventHandlers.click] CameraRig animation failed:', animError);
                        }
                    } finally {
                        updateCameraControlsUI(); // ADDED: Update UI after animations attempt
                    }
                } else {
                  error("[eventHandlers.click] CameraRig not available. Cannot animate to tile.");
                }
            }
        });
    } else {
        error('[eventHandlers.setup] Renderer or renderer.domElement not available for click listener setup.');
    }

    const finalCam = getCamera();
    const finalPGroup = getPlanetGroup();
    const finalCameraRig = getCameraRig(); 
    const finalRend = getRenderer();
    const finalWConfig = getWorldConfig();

    if (finalCam && finalPGroup && finalCameraRig && finalRend && finalWConfig) {
        initMouseControls(finalCam, finalPGroup, finalCameraRig, finalRend); // Pass CameraRig to mouseControls
        initKeyboardControls(finalCam, finalPGroup, finalCameraRig, finalWConfig); // Pass CameraRig to keyboardControls
    } else {
        error('[eventHandlers.setup] One or more dependencies for mouse/keyboard control initialization are missing.');
    }
    return finalCameraRig; // Return CameraRig instance
}

/**
 * Sets up global mouse state tracking. Currently, this function is mostly a placeholder
 * as the primary click vs. drag logic is handled within the renderer's mousedown/click listeners.
 */
export function setupMouseTrackingState() {
    // Original global isMouseDown tracking. Can be removed if not used elsewhere,
    // as click/drag differentiation is now more localized.
    // window.addEventListener('mousedown', () => { isMouseDown = true; });
    // window.addEventListener('mouseup', () => { isMouseDown = false; });
    // window.addEventListener('mouseleave', () => { isMouseDown = false; });
}

/**
 * Reinitializes mouse and keyboard controls. Useful after major state changes like planet regeneration.
 */
export function reinitializeControls() {
    const cam = getCamera();
    const pGroup = getPlanetGroup();
    const crInstance = getCameraRig(); // Get CameraRig instance
    const rend = getRenderer();
    const wConfig = getWorldConfig();

    if (cam && pGroup && crInstance && rend && wConfig) {
        disposeMouseControls(); 
        disposeKeyboardControls();
        initMouseControls(cam, pGroup, crInstance, rend); // Pass CameraRig
        initKeyboardControls(cam, pGroup, crInstance, wConfig); // Pass CameraRig
        debug('[eventHandlers.reinitialize] Mouse and Keyboard controls re-initialized with CameraRig.');
    } else {
        error('[eventHandlers.reinitialize] Failed to re-initialize controls due to missing dependencies.');
    }
} 