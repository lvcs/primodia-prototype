import { debug, error } from '@utils/debug.js';
import { createNewSeed } from '@utils/random'; 
import { useCameraStore, useSceneStore } from '@stores';

import {
    generateAndDisplayPlanet,
    updatePlanetColors,
    getPlanetGroup,
} from '@game/planet/index.js';

import { setupRenderer, startAnimationLoop } from '@/render';

import { setupOrbitControls } from '@game/camera';



export function initGame() {
  debug('Initializing game (React client)...');
  
  try {
    createNewSeed();
    setupRenderer(); 
    useSceneStore.getState().getScene();
    
    generateAndDisplayPlanet(null, null , getPlanetGroup());
    
    setupOrbitControls();
    startAnimationLoop();
  } catch (e) {
    error('Error initializing game (React client):', e);
    throw e; 
  }
}

export function requestPlanetRegeneration(worldSettings) {
  debug('Requesting planet regeneration with settings:', worldSettings);
  
  const existingControls = useCameraStore.getState().orbitControls;
  const planetGroup = getPlanetGroup();
  
  // World settings are read directly from the store by generateAndDisplayPlanet
  generateAndDisplayPlanet(null, existingControls, planetGroup);
    
  debug('Planet regeneration complete.');
}

export function triggerPlanetColorUpdate(settings) {
  debug('Requesting planet color update with settings:', settings);
  
  const planetGroup = getPlanetGroup();
  if (!planetGroup) {
    error('Cannot update planet colors: planet group not initialized.');
    return;
  }
  
  // World settings are read directly from the store by updatePlanetColors
  updatePlanetColors();
  debug('Planet color update complete.');
} 