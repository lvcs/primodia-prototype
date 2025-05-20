import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generateWorld } from './world/worldGenerator.js';
// Import sphere settings and draw mode
import { sphereSettings, classifyTerrain } from './world/planetSphereVoronoi.js';
import { MapTypes, MapRegistry } from './world/registries/MapTypeRegistry.js';
import { Terrains } from './world/registries/TerrainRegistry.js';
import { setupSocketConnection } from './multiplayer/socket.js';
import { debug, error, initDebug } from './utils/debug.js';
import RandomService from './core/RandomService.js'; 
import * as Const from '../config/gameConstants.js'; // Corrected path
import { DrawMode } from '../config/gameConstants.js'; // Added direct import for DrawMode
// import { getActionForKey, Actions } from '../config/keybindings.js'; // Corrected path if used

// Import new control modules
import { initMouseControls, disposeMouseControls } from './controls/mouseControls.js';
import { initKeyboardControls, handleKeyboardInput, disposeKeyboardControls } from './controls/keyboardControls.js';
// Old UI imports - to be removed or handled differently
// import { CameraControlsSectionComponent, updateCameraControlsUI as updateComponentUIDisplay } from '@/ui/components/CameraControlsSection.js';
// import { UnifiedControlPanel } from '@/ui/components/UnifiedControlPanel.js';

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

import {
    generateAndDisplayPlanet as generatePlanet,
    updatePlanetColors,
    getPlanetGroup,
    getWorldData
} from './planet.js';

import {
    setupRootEventListeners,
    setupMouseTrackingState,
    getSelectedHighlight,
    reinitializeControls
} from './core/eventHandlers.js';

import { startAnimationLoop } from './core/mainLoop.js';

let scene, camera, renderer, controls, worldConfig;
// let worldData; 
// let planetGroup; 
// let isMouseDown = false; // Likely managed by eventHandlers or controls
// let selectedHighlight = null; // Likely managed by eventHandlers or controls
let gameCameraAnimator = null;

export function initGame(canvasElement) {
  try {
    debug('Initializing game (React client)...');
    if (!canvasElement) {
      error("initGame cannot proceed without a canvasElement.");
      throw new Error("Canvas element not provided to initGame.");
    }
    const threeContext = setupThreeJS(canvasElement); 
    scene = threeContext.scene; 
    camera = threeContext.camera;
    renderer = threeContext.renderer;
    
    // Review initDebug: if it manipulates DOM for a separate debug panel, it might conflict or be obsolete.
    // For now, assume it's for console logging and global error catching.
    initDebug(); 

    worldConfig = setupInitialWorldConfig();
    
    const currentSelectedHighlight = getSelectedHighlight(); // From eventHandlers
    generatePlanet(scene, worldConfig, null /* controls not set yet */, getPlanetGroup() /* pass current if any */, currentSelectedHighlight);
    sphereSettings.currentSeed = RandomService.getCurrentSeed();
    debug(`Initial map seed set in sphereSettings: ${sphereSettings.currentSeed}`);

    // UI Mounting is now handled by React in App.jsx

    setupLighting(scene);
    // Controls are set up after initial planet generation, so camera can target planet center
    controls = setupOrbitControls(camera, renderer, worldConfig);
    
    // Event listeners and mouse tracking might need adjustment if they rely on global DOM state
    // that React now manages. setupRootEventListeners might need renderer.domElement if it attaches there.
    gameCameraAnimator = setupRootEventListeners(renderer.domElement); // Pass canvas if needed
    setupMouseTrackingState(renderer.domElement); // Pass canvas if needed
    
    // const currentPlanetGroup = getPlanetGroup(); 
    // const currentControls = getControls(); 
    // const currentWorldConfig = getWorldConfig();

    setupSocketConnection(); // Assuming this doesn't do direct DOM manipulation for UI
    startAnimationLoop(); // Starts the game loop
    
    debug('Game initialized successfully (React client).');
    // Loading/game container display is handled by App.jsx state

  } catch (e) {
    error('Error initializing game (React client):', e);
    // Propagate error for React component to handle (e.g., display an error message)
    throw e; 
  }
}

export function requestPlanetRegeneration(seed) {
    const s = getScene();
    const wc = getWorldConfig();
    const existingControls = getControls();
    const pg = getPlanetGroup();
    const sh = getSelectedHighlight();

    if (!s || !wc ) { 
        error('Cannot regenerate planet: core components not initialized.');
        return;
    }
    debug(`Requesting planet regeneration with seed: ${seed === undefined ? 'Default/Last' : seed}`);

    generatePlanet(s, wc, existingControls, pg, sh, seed);

    // const newPlanetGroup = getPlanetGroup(); 
    // const newControls = getControls(); 
    // const cam = getCamera();
    // updateComponentUIDisplay(); // This was for old UI, remove or adapt
    
    reinitializeControls(); // This might re-setup orbit controls, ensure it's compatible
    debug('Planet regeneration complete.');
}

export function triggerPlanetColorUpdate() {
    if (!getPlanetGroup()) {
        error('Cannot update planet colors: planet group not initialized.');
        return;
    }
    debug('Requesting planet color update...');
    updatePlanetColors();
} 