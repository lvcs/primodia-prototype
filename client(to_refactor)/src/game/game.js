import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generateWorld } from './world/worldGenerator.js';
// Import sphere settings and draw mode
import { sphereSettings, DrawMode, classifyTerrain } from './world/planetSphereVoronoi.js';
import { MapTypes, MapRegistry } from './world/registries/MapTypeRegistry.js';
import { Terrains } from './world/registries/TerrainRegistry.js';
import { setupSocketConnection } from './multiplayer/socket.js';
import { debug, error, initDebug } from './utils/debug.js';
import RandomService from './core/RandomService.js'; // Added to ensure it's here, though worldGenerator uses it.
// import * as Const from '../config/gameConstants.js'; // No longer directly used here
// Keybindings are now used by keyboardControls.js, not directly here.
// import { getActionForKey, Actions } from '../config/keybindings.js'; 

// Import new control modules
import { initMouseControls, disposeMouseControls } from './controls/mouseControls.js';
import { initKeyboardControls, handleKeyboardInput, disposeKeyboardControls } from './controls/keyboardControls.js';
import { CameraControlsSectionComponent, updateCameraControlsUI as updateComponentUIDisplay } from '@/ui/components/CameraControlsSection.js';
// import { renderGlobeControls } from '@/ui/index.js'; // Import renderGlobeControls
import { UnifiedControlPanel } from '@/ui/components/UnifiedControlPanel.js';

// Import setup functions
import {
  setupThreeJS,
  setupInitialWorldConfig,
  setupLighting,
  setupOrbitControls,
  getCamera,
  getRenderer,
  getScene,
  getControls,
  getWorldConfig
} from './core/setup.js';

// Import planet functions
import {
    generateAndDisplayPlanet as generatePlanet,
    updatePlanetColors,
    getPlanetGroup, // To pass to other modules like controls or UI if they need it directly
    getWorldData
} from './planet.js';

// Import event handler setup
import {
    setupRootEventListeners,
    setupMouseTrackingState,
    getSelectedHighlight,
    reinitializeControls
} from './core/eventHandlers.js';

// Import animation loop controller
import { startAnimationLoop } from './core/mainLoop.js';

// These are now mostly obtained via getters from setup.js or planet.js when needed.
// Let's keep them here if initGame assigns to them for clarity of what initGame establishes.
let scene, camera, renderer, controls, worldConfig;
let worldData; // Will store { meshGroup, cells, config } from generateWorld
let planetGroup; // This will be worldData.meshGroup
// let worldConfig; // This is now managed in setup.js and assigned here
let isMouseDown = false;
let selectedHighlight = null;
let gameCameraAnimator = null; // To store the camera animator instance

// const clock = new THREE.Clock(); // Moved to mainLoop.js

// State for mouse panning - MOVED to mouseControls.js
// let isDragging = false;
// const previousMousePosition = {
// x: 0,
// y: 0
// };

// State for keyboard controls - MOVED to keyboardControls.js
// const activeKeys = new Set();

export function initGame() {
  try {
    debug('Initializing game (fresh start)...');
    const threeContext = setupThreeJS();
    scene = threeContext.scene; // Assign to module var for potential direct use if any remains
    camera = threeContext.camera;
    renderer = threeContext.renderer;
    initDebug();

    worldConfig = setupInitialWorldConfig();
    
    const currentSelectedHighlight = getSelectedHighlight();
    // Initial planet generation. generatePlanet will call generateWorld, which initializes RandomService.
    // No seed is passed here, so RandomService will use its default (Date.now() based).
    const planetResult = generatePlanet(scene, worldConfig, null /* no controls yet */, planetGroup, currentSelectedHighlight);
    // planetGroup = planetResult.planetGroup; // Handled by generatePlanet
    // worldData = planetResult.worldData;   // Handled by generatePlanet

    // After initial generation, store the used seed in sphereSettings for the UI.
    sphereSettings.currentSeed = RandomService.getCurrentSeed();
    debug(`Initial map seed set in sphereSettings: ${sphereSettings.currentSeed}`);

    // Remove old UI panels
    // renderGlobeControls(); 
    // const cameraControlsElement = CameraControlsSectionComponent({
    //     camera: camera,
    //     controls: currentControls,
    //     cameraAnimator: gameCameraAnimator,
    //     worldConfig: currentWorldConfig
    // });
    // const uiOverlay = document.getElementById('ui-overlay') || document.body;
    // uiOverlay.appendChild(cameraControlsElement);

    // Mount unified control panel
    const uiOverlay = document.getElementById('ui-overlay') || document.body;
    const unifiedPanel = new UnifiedControlPanel();
    uiOverlay.appendChild(unifiedPanel.element);

    setupLighting(scene);
    controls = setupOrbitControls(camera, renderer, worldConfig);
    
    gameCameraAnimator = setupRootEventListeners(); // Store the returned animator
    setupMouseTrackingState();
    
    const currentPlanetGroup = getPlanetGroup(); 
    const currentControls = getControls(); // Get the freshly created OrbitControls
    const currentWorldConfig = getWorldConfig();

    // const cameraControlsElement = CameraControlsSectionComponent({
    //     camera: camera,
    //     controls: currentControls,
    //     cameraAnimator: gameCameraAnimator,
    //     worldConfig: currentWorldConfig
    // });
    // uiOverlay.appendChild(cameraControlsElement);
    // if (uiOverlay.id === 'ui-overlay' && getComputedStyle(uiOverlay).pointerEvents === 'none') {
    //     cameraControlsElement.style.pointerEvents = 'auto';
    // }

    setupSocketConnection();
    startAnimationLoop(); // Start the animation loop from mainLoop.js
    
    debug('Game initialized successfully (fresh start).');
    const loadingElem = document.getElementById('loading-container');
    if (loadingElem) loadingElem.style.display = 'none';
    const gameElem = document.getElementById('game-container');
    if (gameElem) gameElem.style.display = 'block';
  } catch (e) {
    error('Error initializing game (fresh start):', e);
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;padding:20px;background:red;color:white;z-index:99999;';
    errDiv.innerHTML = `<h1>Game Init Error</h1><p>${e.message}</p><pre>${e.stack}</pre>`;
    document.body.appendChild(errDiv);
  }
}

// function setupThreeJS() { ... } // MOVED to setup.js
// function setupWorldConfig() { ... } // MOVED to setup.js

// export function generateAndDisplayPlanet() { ... } // MOVED to planet.js

// function animate() { ... } // MOVED to mainLoop.js

// export function updatePlanetColors() { ... } // MOVED to planet.js

// Function to be called from UI or other modules to request a planet regeneration
// This is an example of how other parts of the app might interact with planet generation
export function requestPlanetRegeneration(seed) {
    const s = getScene();
    const wc = getWorldConfig();
    const existingControls = getControls(); // OrbitControls
    const pg = getPlanetGroup(); // Existing planet group
    const sh = getSelectedHighlight();

    if (!s || !wc ) { 
        error('Cannot regenerate planet: core components not initialized.');
        return;
    }
    debug(`Requesting planet regeneration with seed: ${seed === undefined ? 'Default/Last' : seed}`);

    // Pass the seed to generatePlanet
    const planetResult = generatePlanet(s, wc, existingControls, pg, sh, seed);
    // planetGroup = planetResult.planetGroup; // generatePlanet now updates the planetGroup directly via setPlanetGroup
    // worldData = planetResult.worldData; // generatePlanet now updates worldData directly via setWorldData

    const newPlanetGroup = getPlanetGroup(); 
    const newControls = getControls(); 
    const cam = getCamera();
    updateComponentUIDisplay();
    
    reinitializeControls();
    debug('Planet regeneration complete.');
}

// Add this new function to handle keyboard inputs - MOVED to keyboardControls.js
// function handleKeyboardInput() { ... } 

// New function to be called by UI to update planet colors
export function triggerPlanetColorUpdate() {
    if (!getPlanetGroup()) {
        error('Cannot update planet colors: planet group not initialized.');
        return;
    }
    debug('Requesting planet color update...');
    updatePlanetColors(); // Call the function imported from planet.js
} 