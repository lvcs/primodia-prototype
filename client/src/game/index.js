import { planetSettings } from '@game/world/planetVoronoi.js';
import { debug, error } from '@utils/debug.js';
import { createNewSeed, getSeed } from '@utils/random'; 
import { useCameraStore, useWorldStore, useSceneStore, useRenderStore } from '@stores';

import {
  setupThreeJS
} from '@game/render/setup.js';

import {
    generateAndDisplayPlanet,
    updatePlanetColors,
    getPlanetGroup,
} from '@game/planet/index.js';

import { startAnimationLoop } from '@game/render/mainLoop.js';

import { setupOrbitControls } from '@game/camera';

let scene, renderer, controls;


export function initGame() {
  console.log('initGame called');
  try {
    debug('Initializing game (React client)...');

    createNewSeed();

    setupThreeJS(); 
    scene = useSceneStore.getState().getScene();
    camera = useCameraStore.getState().camera;
    renderer = useRenderStore.getState().getRenderer();
    
    generateAndDisplayPlanet(null, null , getPlanetGroup());
    
    controls = setupOrbitControls(renderer);
    startAnimationLoop(); // Starts the game loop
    
  
  } catch (e) {
    error('Error initializing game (React client):', e);
    // Propagate error for React component to handle (e.g., display an error message)
    throw e; 
  }
}

// Modified to accept settings as a parameter instead of accessing the store
export function requestPlanetRegeneration(worldSettings) {
  console.log('requestPlanetRegeneration called with settings:', worldSettings);
  
  const existingControls = useCameraStore.getState().orbitControls;
  const pg = getPlanetGroup();
  
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
  generateAndDisplayPlanet(null, existingControls, pg);
    
  debug('Planet regeneration complete.');
  
  return;
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