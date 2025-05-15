// Event listeners for window resize, mouse clicks (tile selection), etc. 

import * as THREE from 'three';
import { debug, error } from '../utils/debug.js'; // Path updated
import { classifyTerrain } from '../world/planetSphereVoronoi.js'; // Path updated
import { initMouseControls, disposeMouseControls } from '../controls/mouseControls.js'; // Path updated
import { initKeyboardControls, disposeKeyboardControls } from '../controls/keyboardControls.js'; // Path updated

// Import getters for shared state
import { getCamera, getRenderer, getWorldConfig, getControls } from './setup.js'; // Path updated (sibling in core/)
import { getPlanetGroup, getWorldData } from '../planet.js'; // Path updated
import RandomService from './RandomService.js'; // Import RandomService

// Factor to slightly scale highlight geometry to prevent z-fighting.
const HIGHLIGHT_SCALE_FACTOR = 1.003;

let selectedHighlight = null;
let isMouseDown = false; // Tracks mouse button state globally

export function getSelectedHighlight() {
    return selectedHighlight;
}

export function setupRootEventListeners() {
    const camera = getCamera();
    const renderer = getRenderer();
    
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

    if (renderer && renderer.domElement) {
        renderer.domElement.addEventListener('click', (event) => {
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

            let terrain = classifyTerrain(normal); 
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

            const statusDiv = document.getElementById('debug-status');
            if (statusDiv) {
                const clickedTileForUI = wData.globe.getTile(tileId);
                const areaForUI = clickedTileForUI?.area !== undefined ? clickedTileForUI.area.toFixed(4) : 'N/A';
                const currentSeed = RandomService.getCurrentSeed(); // Get current seed
                statusDiv.innerHTML =
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
            }

            const clickedTile = wData.globe.getTile(tileId);
            if (clickedTile) {
                let debugMsg = `Tile clicked: ID=${clickedTile.id}, Terrain=${clickedTile.terrain.id}, Center=(${clickedTile.center.map(c => c.toFixed(2))})`;
                if (clickedTile.neighbors) {
                    debugMsg += `, Neighbors=[${clickedTile.neighbors.join(',')}]`;
                }
                if (clickedTile.area !== undefined) {
                    debugMsg += `, Area=${clickedTile.area.toFixed(4)}`;
                }
                if (clickedTile.plateId !== null) {
                    debugMsg += `, PlateID=${clickedTile.plateId}`;
                }
                debugMsg += `, Elevation=${clickedTile.elevation.toFixed(2)}, Moisture=${clickedTile.moisture.toFixed(2)}`;
                debug(debugMsg);
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
        initMouseControls(cam, pGroup, orbitControls, rend);
        initKeyboardControls(cam, pGroup, orbitControls, wConfig);
    } else {
        error('One or more dependencies for control (mouse/keyboard) initialization are missing in setupRootEventListeners.');
    }
}

export function setupMouseTrackingState() {
    window.addEventListener('mousedown', () => { isMouseDown = true; });
    window.addEventListener('mouseup', () => { isMouseDown = false; });
    window.addEventListener('mouseleave', () => { isMouseDown = false; });
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
        initMouseControls(cam, pGroup, orbitControls, rend);
        initKeyboardControls(cam, pGroup, orbitControls, wConfig);
        debug('Mouse and Keyboard controls re-initialized.');
    } else {
        error('Failed to re-initialize controls due to missing dependencies.');
    }
} 