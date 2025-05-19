// Event listeners for window resize, mouse clicks (tile selection), etc. 

import * as THREE from 'three';
import { debug, error, updateTileDebugInfo } from '@/game/utils/debug.js'; // Path updated, added updateTileDebugInfo
import { classifyTerrain } from '@/game/world/planetSphereVoronoi.js'; // Path updated
import { initMouseControls, disposeMouseControls } from '@/game/controls/mouseControls.js'; // Path updated
import { initKeyboardControls, disposeKeyboardControls } from '@/game/controls/keyboardControls.js'; // Path updated
import CameraOrbitController from '@/game/controls/CameraOrbitController.js';

// Import getters for shared state
import { getCamera, getRenderer, getWorldConfig, getControls } from './setup.js'; // Path updated (sibling in core/)
import { getPlanetGroup, getWorldData } from '@/game/planet.js'; // Path updated
import RandomService from './RandomService.js'; // Import RandomService
import { Camera } from '@/camera/Camera.js'; // <<< CHANGED TO NAMED IMPORT

// Factor to slightly scale highlight geometry to prevent z-fighting.
const HIGHLIGHT_SCALE_FACTOR = 1.003;
const MAX_DRAG_DIST_FOR_CLICK = 10; // pixels
const MAX_DRAG_TIME_FOR_CLICK = 250; // milliseconds

let selectedHighlight = null;
let cameraAnimator = null; // <<< ADDED CAMERA ANIMATOR INSTANCE HOLDER
let orbitController = null;

// Variables to track mouse press for distinguishing click from drag
let mouseDownTime;
let mouseDownPosition = new THREE.Vector2();

// All radius and area values are now in kilometers (1 unit = 1 km, 1 unit^2 = 1 km^2)

export function getSelectedHighlight() {
    return selectedHighlight;
}

// Add Globe View button to UI overlay (top right)
function addGlobeViewButton(cameraAnimator) {
    let globeBtn = document.getElementById('globe-view-btn');
    if (!globeBtn) {
        globeBtn = document.createElement('button');
        globeBtn.id = 'globe-view-btn';
        globeBtn.textContent = 'Globe View';
        globeBtn.style.position = 'absolute';
        globeBtn.style.top = '20px';
        globeBtn.style.right = '20px';
        globeBtn.style.zIndex = '2000';
        globeBtn.style.padding = '0.5rem 1.2rem';
        globeBtn.style.background = '#444';
        globeBtn.style.color = 'white';
        globeBtn.style.border = '1px solid #888';
        globeBtn.style.borderRadius = '5px';
        globeBtn.style.fontSize = '1.1rem';
        globeBtn.style.cursor = 'pointer';
        globeBtn.style.display = 'none';
        globeBtn.addEventListener('click', () => {
            cameraAnimator.animateToGlobe();
            globeBtn.style.display = 'none';
        });
        document.body.appendChild(globeBtn);
    }
    return globeBtn;
}

export function setupRootEventListeners() {
    const cameraInstance = getCamera(); // Renamed for clarity
    const rendererInstance = getRenderer(); // Renamed for clarity
    const planetGroupInstance = getPlanetGroup(); // Renamed for clarity
    const orbitControlsInstance = getControls(); // <<< GET ORBITCONTROLS
    const worldConfigInstance = getWorldConfig();   // <<< GET WORLDCONFIG

    // Instantiate the Camera animator if we have the necessary components
    if (cameraInstance && planetGroupInstance && orbitControlsInstance && worldConfigInstance) {
      cameraAnimator = new Camera(
        cameraInstance,
        planetGroupInstance,
        orbitControlsInstance,      // <<< PASS ORBITCONTROLS
        worldConfigInstance.radius  // <<< PASS GLOBERADIUS
      );
      window.cameraAnimator = cameraAnimator; // Make globally accessible
      // Initialize orbit controller with camera, default radius, phi, theta
      const initialRadius = cameraInstance.position.length();
      const initialPhi = Math.acos(cameraInstance.position.y / initialRadius);
      const initialTheta = Math.atan2(cameraInstance.position.z, cameraInstance.position.x);
      orbitController = new CameraOrbitController(cameraInstance, initialRadius, initialPhi, initialTheta);
      window.orbitController = orbitController;
      addGlobeViewButton(cameraAnimator); // Add the Globe View button
    } else {
      error("Failed to initialize CameraAnimator: Missing main camera, planet group, orbit controls, or world config.");
    }
    
    window.addEventListener('resize', () => {
        const cam = getCamera(); 
        const rend = getRenderer();
        if (!cam || !rend) return;
        cam.aspect = window.innerWidth / window.innerHeight;
        cam.updateProjectionMatrix();
        rend.setSize(window.innerWidth, window.innerHeight);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    if (rendererInstance && rendererInstance.domElement) {
        rendererInstance.domElement.addEventListener('mousedown', (event) => {
            mouseDownTime = Date.now();
            mouseDownPosition.set(event.clientX, event.clientY);
        });

        rendererInstance.domElement.addEventListener('click', (event) => {
            const cam = getCamera();
            const rend = getRenderer();
            const wConfig = getWorldConfig();
            const pGroup = getPlanetGroup();
            const wData = getWorldData();

            if (!rend || !cam || !wConfig || !pGroup || !wData || !wData.globe) {
                error('Missing dependencies for click event');
                return;
            }

            const rect = rend.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            const pressDuration = Date.now() - mouseDownTime;
            const moveDistance = mouseDownPosition.distanceTo(new THREE.Vector2(event.clientX, event.clientY));

            if (moveDistance > MAX_DRAG_DIST_FOR_CLICK || pressDuration > MAX_DRAG_TIME_FOR_CLICK) {
                debug('Drag detected, click-to-rotate animation skipped.');
                return; // It was a drag, not a click
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
            if (attr) {
                const idx = mainIntersect.faceIndex * 3;
                tileId = attr.array[idx];
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

            if (mainIntersect.object.userData.tileEdges && mainIntersect.object.userData.tileEdges[tileId]) {
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

            const elevation = mainIntersect.object.userData.tileElevation ? mainIntersect.object.userData.tileElevation[tileId] : null;
            const moisture = mainIntersect.object.userData.tileMoisture ? mainIntersect.object.userData.tileMoisture[tileId] : null;

            debug(`Tile ${tileId} – Terr:${terrain} Plate:${plateId} Elev:${elevation?.toFixed(2)} Moist:${moisture?.toFixed(2)} Lat:${lat.toFixed(2)}° Lon:${lon.toFixed(2)}°`);

            const clickedTileForUI = wData.globe.getTile(tileId);
            const areaForUI = clickedTileForUI?.area !== undefined ? clickedTileForUI.area.toFixed(4) + ' km²' : 'N/A';
            const currentSeed = RandomService.getCurrentSeed(); // Get current seed
            const tileInfoHtml =
                `Seed: ${currentSeed === undefined ? 'N/A' : currentSeed}<br>` + // Display seed
                `--- Tile Info ---<br>` +
                `ID: ${tileId}<br>` +
                `Terr: ${terrain}<br>` +
                `Plate: ${plateId}<br>` +
                `Area: ${areaForUI}<br>` +
                `Elev: ${elevation?.toFixed(2)}<br>` +
                `Moist: ${moisture?.toFixed(2)}<br>` +
                `Lat: ${lat.toFixed(2)}°<br>` +
                `Lon: ${lon.toFixed(2)}°`;
            
            updateTileDebugInfo(tileInfoHtml); // New way: Use the dedicated function

            const clickedTile = wData.globe.getTile(tileId);
            if (clickedTile) {
                let debugMsg = `Tile clicked: ID=${clickedTile.id}, Terrain=${clickedTile.terrain.id}, Center=(${clickedTile.center.map(c => c.toFixed(2))})`;
                if (clickedTile.neighbors) {
                    debugMsg += `, Neighbors=[${clickedTile.neighbors.join(',')}]`;
                }
                if (clickedTile.area !== undefined) {
                    debugMsg += `, Area=${clickedTile.area.toFixed(4)} km²`;
                }
                if (clickedTile.plateId !== null) {
                    debugMsg += `, PlateID=${clickedTile.plateId}`;
                }
                debugMsg += `, Elevation=${clickedTile.elevation.toFixed(2)}, Moisture=${clickedTile.moisture.toFixed(2)}`;
                debug(debugMsg);

                if (cameraAnimator) {
                  const tileDataForCamera = {
                    latitude: clickedTile.lat,
                    longitude: clickedTile.lon
                  };
                  cameraAnimator.animateToTile(tileDataForCamera, () => {
                    // Always show Globe View button after animating to a tile
                    const globeBtn = document.getElementById('globe-view-btn');
                    if (globeBtn) globeBtn.style.display = 'block';
                  });
                } else {
                  error("CameraAnimator not initialized. Cannot animate to tile.");
                }
            }
        });
    } else {
        error('Renderer or renderer.domElement not available for click listener setup.');
    }

    const cam = getCamera();
    const pGroup = getPlanetGroup();
    const orbitControls = getControls(); 
    const rend = getRenderer();
    const wConfig = getWorldConfig();

    if (cam && pGroup && orbitControls && rend && wConfig) {
        initMouseControls(cam, orbitControls, rend, orbitController);
        initKeyboardControls(cam, orbitControls, wConfig, orbitController);
    } else {
        error('One or more dependencies for control (mouse/keyboard) initialization are missing in setupRootEventListeners.');
    }
    return cameraAnimator; // <<< RETURN THE INSTANCE
}

export function setupMouseTrackingState() {
    // window.addEventListener('mousedown', () => { isMouseDown = true; }); // Potentially redundant if not used elsewhere
    // window.addEventListener('mouseup', () => { isMouseDown = false; });
    // window.addEventListener('mouseleave', () => { isMouseDown = false; });
}

export function reinitializeControls() {
    const cam = getCamera();
    const pGroup = getPlanetGroup();
    const orbitControls = getControls(); 
    const rend = getRenderer();
    const wConfig = getWorldConfig();

    if (cam && pGroup && orbitControls && rend && wConfig) {
        disposeMouseControls(); 
        disposeKeyboardControls();
        initMouseControls(cam, orbitControls, rend, orbitController);
        initKeyboardControls(cam, orbitControls, wConfig, orbitController);
        debug('Mouse and Keyboard controls re-initialized.');
    } else {
        error('Failed to re-initialize controls due to missing dependencies.');
    }
} 