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
import * as Const from '@config/gameConfig'; // Corrected path
import { DrawMode } from '../config/gameConfig.js'; // Added direct import for DrawMode
// import { getActionForKey, Actions } from '../config/keyboardConfig.js'; // Corrected path if used

// Import store safely at the top
import { useWorldStore } from '@stores';

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

// Modified to accept settings as a parameter instead of accessing the store
export function requestPlanetRegeneration(seed, worldSettings) {
  console.log('requestPlanetRegeneration called with seed:', seed, 'settings:', worldSettings);
  
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

  // Use settings if provided, otherwise keep existing sphereSettings
  if (worldSettings) {
      console.log('Syncing provided settings to sphereSettings before regeneration');
      console.log('BEFORE UPDATE - sphereSettings.numPoints:', sphereSettings.numPoints);
      
      // IMPORTANT: Update all sphereSettings properties from the provided settings
      // This ensures that internal logic using sphereSettings directly has access
      // to the latest values before any regeneration steps are performed
      sphereSettings.drawMode = worldSettings.drawMode;
      sphereSettings.algorithm = worldSettings.algorithm;
      sphereSettings.numPoints = worldSettings.numPoints;
      sphereSettings.jitter = worldSettings.jitter;
      sphereSettings.mapType = worldSettings.mapType;
      sphereSettings.outlineVisible = worldSettings.outlineVisible;
      sphereSettings.numPlates = worldSettings.numPlates;
      sphereSettings.viewMode = worldSettings.viewMode;
      sphereSettings.elevationBias = worldSettings.elevationBias;
      
      // Log the updated sphereSettings to verify they were updated correctly
      console.log('Updated sphereSettings:', sphereSettings);
      console.log('AFTER UPDATE - sphereSettings.numPoints:', sphereSettings.numPoints);
  } else {
      console.warn('No settings provided to requestPlanetRegeneration, using existing sphereSettings');
  }
  
  // If seed is provided, update currentSeed in sphereSettings
  if (seed !== undefined) {
      sphereSettings.currentSeed = seed;
      console.log('Updated sphereSettings.currentSeed to:', seed);
  }

  // Generate planet with updated settings
  const result = generatePlanet(s, wc, existingControls, pg, sh, seed);
  
  // Update the store with the actual seed used
  if (result && result.actualSeed) {
    console.log('Actual seed used for planet generation:', result.actualSeed);
    
    // Update the current seed in the store
    try {
      // Use a setTimeout to avoid any circular dependency issues
      setTimeout(() => {
        const { setCurrentSeed } = useWorldStore.getState();
        if (setCurrentSeed) {
          console.log('Updating store with actual seed:', result.actualSeed);
          setCurrentSeed(result.actualSeed);
        }
      }, 0);
    } catch (err) {
      console.error('Error updating seed in store:', err);
    }
  }
  
  reinitializeControls(); // This might re-setup orbit controls, ensure it's compatible
  debug('Planet regeneration complete.');
  
  return result;
}

// Modified to accept settings as a parameter instead of accessing the store
export function triggerPlanetColorUpdate(settings) {
    console.log('triggerPlanetColorUpdate called with settings:', settings);
    
    if (!getPlanetGroup()) {
        error('Cannot update planet colors: planet group not initialized.');
        return;
    }
    debug('Requesting planet color update...');
    
    // Use view-related settings if provided
    if (settings) {
        console.log('Syncing view settings to sphereSettings before color update');
        
        // IMPORTANT: Update view-related properties from the provided settings
        // This ensures that internal logic using sphereSettings directly has access
        // to the latest values before any color update steps are performed
        sphereSettings.outlineVisible = settings.outlineVisible;
        sphereSettings.viewMode = settings.viewMode;
        sphereSettings.elevationBias = settings.elevationBias;
        
        // Log the updated view settings to verify they were updated correctly
        console.log('Updated view settings in sphereSettings:', {
            outlineVisible: sphereSettings.outlineVisible,
            viewMode: sphereSettings.viewMode,
            elevationBias: sphereSettings.elevationBias
        });
    } else {
        console.warn('No settings provided to triggerPlanetColorUpdate, using existing sphereSettings');
    }
    
    // Update planet colors with the updated settings
    updatePlanetColors();
    debug('Planet color update complete.');
} 