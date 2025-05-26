import { planetSettings } from '@game/world/planetVoronoi.js';
import { debug, error, initDebug } from './utils/debug.js';
import RandomService from './core/RandomService.js'; 
import { useCameraStore, useWorldStore } from '@stores';

import {
  setupThreeJS,
  setupInitialWorldConfig,
  setupLighting,
  getScene,
  getWorldConfig
} from './core/setup.js';

import {
    generateAndDisplayPlanet as generatePlanet,
    updatePlanetColors,
    getPlanetGroup,
} from './planet.js';

import { getSelectedHighlight } from './core/eventHandlers.js';
import { startAnimationLoop } from './core/mainLoop.js';

import { newsetupOrbitControls } from './camera/cam.js';

let scene, camera, renderer, controls, worldConfig;


export function initGame(canvasElement) {
  try {
    debug('Initializing game (React client)...');
    if (!canvasElement) {
      error("initGame cannot proceed without a canvasElement.");
      throw new Error("Canvas element not provided to initGame.");
    }
    const threeContext = setupThreeJS(canvasElement); 
    scene = threeContext.scene; 
    camera = useCameraStore.getState().camera;
    renderer = threeContext.renderer;
    
    worldConfig = setupInitialWorldConfig();
    
    const currentSelectedHighlight = getSelectedHighlight(); // From eventHandlers
    generatePlanet(scene, worldConfig, null , getPlanetGroup() , currentSelectedHighlight);
    planetSettings.currentSeed = RandomService.getCurrentSeed();
  

    setupLighting(scene);
    // Controls are set up after initial planet generation, so camera can target planet center
    // controls = setupOrbitControls(camera, renderer, worldConfig);
    // console.log(controls);
    
    controls = newsetupOrbitControls(renderer);
    console.log(controls);
    startAnimationLoop(); // Starts the game loop
    
  
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
  const existingControls = useCameraStore.getState().orbitControls;
  const pg = getPlanetGroup();
  const sh = getSelectedHighlight();

  if (!s || !wc ) { 
      error('Cannot regenerate planet: core components not initialized.');
      return;
  }
  debug(`Requesting planet regeneration with seed: ${seed === undefined ? 'Default/Last' : seed}`);

  // Use settings if provided, otherwise keep existing planetSettings
  if (worldSettings) {
      console.log('Syncing provided settings to planetSettings before regeneration');
      console.log('BEFORE UPDATE - planetSettings.numPoints:', planetSettings.numPoints);
      
      // IMPORTANT: Update all planetSettings properties from the provided settings
      // This ensures that internal logic using planetSettings directly has access
      // to the latest values before any regeneration steps are performed
      planetSettings.drawMode = worldSettings.drawMode;
      planetSettings.algorithm = worldSettings.algorithm;
      planetSettings.numPoints = worldSettings.numPoints;
      planetSettings.jitter = worldSettings.jitter;
      planetSettings.mapType = worldSettings.mapType;
      planetSettings.outlineVisible = worldSettings.outlineVisible;
      planetSettings.numPlates = worldSettings.numPlates;
      planetSettings.viewMode = worldSettings.viewMode;
      planetSettings.elevationBias = worldSettings.elevationBias;
      
      // Log the updated planetSettings to verify they were updated correctly
      console.log('Updated planetSettings:', planetSettings);
      console.log('AFTER UPDATE - planetSettings.numPoints:', planetSettings.numPoints);
  } else {
      console.warn('No settings provided to requestPlanetRegeneration, using existing planetSettings');
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
        console.log('Syncing view settings to planetSettings before color update');
        
        // IMPORTANT: Update view-related properties from the provided settings
        // This ensures that internal logic using planetSettings directly has access
        // to the latest values before any color update steps are performed
        planetSettings.outlineVisible = settings.outlineVisible;
        planetSettings.viewMode = settings.viewMode;
        planetSettings.elevationBias = settings.elevationBias;
        
        // Log the updated view settings to verify they were updated correctly
        console.log('Updated view settings in planetSettings:', {
            outlineVisible: planetSettings.outlineVisible,
            viewMode: planetSettings.viewMode,
            elevationBias: planetSettings.elevationBias
        });
    } else {
        console.warn('No settings provided to triggerPlanetColorUpdate, using existing planetSettings');
    }
    
    // Update planet colors with the updated settings
    updatePlanetColors();
    debug('Planet color update complete.');
} 