/**
 * Debug utility for Primodia game
 * This file contains utility functions for debugging the game.
 */

import * as THREE from 'three'; 
// import { SliderControl } from '@/ui/components/SliderControl.js'; // Old import, likely obsolete for new client
// import { getCamera, getScene, getControls, getWorldConfig } from '@/game/core/setup.js'; // Old import path
// For new structure, if these are needed by debug functions, they should be imported from '../core/setup.js'
// However, the debug functions below that use these are mostly for an old DOM-based debug panel.

export const DEBUG = true;

export function debug(...args) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

export function error(...args) {
  console.error('[ERROR]', ...args);
}

// The following functions (updateDebugStatus, updateTileDebugInfo, updateCameraDebugInfo, updateGlobeDebugInfo)
// were for an old DOM-based debug panel. They will likely log errors or do nothing if those DOM elements don't exist.
// They should be either removed, or adapted to use the new debugStore if their information is still valuable.
// For now, we'll leave them but comment out the direct DOM access to prevent errors.

export function updateDebugStatus(message) {
  if (!DEBUG) return;
  console.log(`[STATUS UPDATE]: ${message}`);
  // const statusElement = document.getElementById('debug-general-status'); 
  // if (statusElement) { /* ... DOM manipulation ... */ }
}

export function updateTileDebugInfo(htmlContent) {
  if (!DEBUG) return;
  console.log('[TILE DEBUG INFO (HTML)]:', htmlContent); // Log instead of DOM
  // const tileContentElement = document.getElementById('debug-tile-content');
  // if (tileContentElement) { tileContentElement.innerHTML = htmlContent; }
}

export function updateCameraDebugInfo(camera, controls) {
  if (!DEBUG || !camera || !controls) return;
  // This function constructed HTML for an old debug panel.
  // For now, let's just log that it was called.
  console.log('[CAMERA DEBUG INFO]: updateCameraDebugInfo called.');
  // const cameraContentElement = document.getElementById('debug-camera-content');
  // if (cameraContentElement && cameraContentElement.style.display !== 'none') { /* ... DOM manipulation ... */ }
}

export function updateGlobeDebugInfo(planetGroupInstance, globeStaticData) {
  if (!DEBUG) return;
  // This function updated DOM elements including sliders for an old debug panel.
  console.log('[GLOBE DEBUG INFO]: updateGlobeDebugInfo called.');
  // const globeContentElement = document.getElementById('debug-globe-content');
  // const globeInfoTextElement = document.getElementById('debug-globe-info-text');
  // if (globeContentElement && globeContentElement.style.display !== 'none') { /* ... DOM manipulation ... */ }
}

export function logWorldStructure(world) {
  if (!DEBUG) return;
  // This function is purely for console logging, so it should be fine.
  try {
    debug('World structure:');
    if (!world) {
      debug('- World object is null or undefined.');
      return;
    }
    debug(`- config: ${world.config ? JSON.stringify(world.config) : 'undefined'}`);
    debug(`- cells count: ${world.cells ? world.cells.length : 'undefined'}`);
    debug(`- uniqueWorldVertices count: ${world.uniqueWorldVertices ? world.uniqueWorldVertices.size : 'undefined'}`);
    
    if (world.cells && world.cells.length > 0 && world.cells[0]) {
      const sampleCell = world.cells[0];
      debug('Sample cell (cells[0]) structure:');
      debug(`- id: ${sampleCell.id}`);
      // ... (rest of the logging is fine)
      debug(`- seedPointKey: ${sampleCell.seedPointKey}`);
      debug(`- vertexKeys count: ${sampleCell.vertexKeys ? sampleCell.vertexKeys.length : 'undefined'}`);
      if (sampleCell.vertexKeys && sampleCell.vertexKeys.length > 0) {
        debug(`- First vertexKey: ${sampleCell.vertexKeys[0]}`);
      }
      if (sampleCell.data) {
        debug(`- data: ${JSON.stringify(sampleCell.data)}`);
      }
      if (world.uniqueWorldVertices && sampleCell.seedPointKey && world.uniqueWorldVertices.has(sampleCell.seedPointKey)) {
        const sampleSeedVertexData = world.uniqueWorldVertices.get(sampleCell.seedPointKey);
        debug('Sample seed vertex data (from uniqueWorldVertices via cell[0].seedPointKey):');
        debug(`  - basePosition: (${sampleSeedVertexData.basePosition.x.toFixed(2)} km, ${sampleSeedVertexData.basePosition.y.toFixed(2)} km, ${sampleSeedVertexData.basePosition.z.toFixed(2)} km)`);
        debug(`  - elevatedPosition: (${sampleSeedVertexData.elevatedPosition.x.toFixed(2)} km, ${sampleSeedVertexData.elevatedPosition.y.toFixed(2)} km, ${sampleSeedVertexData.elevatedPosition.z.toFixed(2)} km)`);
        debug(`  - elevation: ${sampleSeedVertexData.elevation.toFixed(4)} km`);
      }
    } else if (world.cells && world.cells.length > 0 && !world.cells[0]) {
      debug('Sample cell (world.cells[0]) is null or undefined.');
    }
  } catch (err) { 
    error('Error logging world structure:', err);
  }
}

export function initDebug() {
  if (!DEBUG) return;
  // createDebugUI(); // This was for the old DOM panel, should remain commented or removed.
  debug('Debug mode initialized (new client).');
  // updateDebugStatus('Debug initialized (new client).'); // Use console.log instead
  console.log('[STATUS UPDATE]: Debug initialized (new client).');

  // Global error listeners are fine, they use console.error and our local error() / debug()
  window.addEventListener('error', (event) => {
    error('Unhandled error:', event.error);
    // updateDebugStatus(`ERROR: ${event.error.message}`); // Avoid DOM manipulation
    console.log(`[STATUS UPDATE FROM ERROR HANDLER]: ERROR: ${event.error.message}`);
  });
  window.addEventListener('unhandledrejection', (event) => {
    error('Unhandled promise rejection:', event.reason);
    // updateDebugStatus(`Promise Error: ${event.reason}`); // Avoid DOM manipulation
    console.log(`[STATUS UPDATE FROM ERROR HANDLER]: Promise Error: ${event.reason}`);
  });
} 