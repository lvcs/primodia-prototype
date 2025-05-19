/**
 * Debug utility for Primodia game
 * This file contains utility functions for debugging the game.
 */

import * as THREE from 'three'; // Added for THREE.MathUtils
import { SliderControl } from '@/ui/components/SliderControl.js'; // Corrected import path
import { getCamera, getScene, getControls, getWorldConfig } from '@/game/core/setup.js';

// Enable or disable debug mode
export const DEBUG = true;

// All radius and area values are now in kilometers (1 unit = 1 km, 1 unit^2 = 1 km^2)

// Debug logger
export function debug(...args) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

// Error logger
export function error(...args) {
  console.error('[ERROR]', ...args);
}

// Global references for globe rotation sliders and displays
let globeRotXSlider, globeRotYSlider, globeRotZSlider;
let globeRotXDisplay, globeRotYDisplay, globeRotZDisplay;
let currentPlanetGroup = null; // To store reference to planetGroup for slider callbacks

// Global references for camera debug sliders, displays, and rig
let cameraRig;
let cameraTargetXSlider, cameraTargetYSlider, cameraTargetZSlider;
let cameraTargetXDisplay, cameraTargetYDisplay, cameraTargetZDisplay;
let cameraZoomSlider, cameraZoomDisplay;
let cameraYawSlider, cameraRollSlider;
let cameraYawDisplay, cameraRollDisplay;

// Create a simple debug GUI to overlay on the game
// export function createDebugUI() {
//   if (!DEBUG) return;
//   // ... entire function body ...
// }

// Update the debug status (now for general messages)
export function updateDebugStatus(message) {
  if (!DEBUG) return;
  
  const statusElement = document.getElementById('debug-general-status'); // Changed ID
  if (statusElement) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    // Prepend new messages
    if (statusElement.firstChild) {
        statusElement.insertBefore(messageDiv, statusElement.firstChild);
    } else {
        statusElement.appendChild(messageDiv);
    }
    // Optional: Limit number of messages if needed
    // while (statusElement.children.length > 10) {
    //    statusElement.removeChild(statusElement.lastChild);
    // }
  }
}

export function updateTileDebugInfo(htmlContent) {
  if (!DEBUG) return;
  const tileContentElement = document.getElementById('debug-tile-content');
  if (tileContentElement) {
    tileContentElement.innerHTML = htmlContent;
  }
}

export function updateCameraDebugInfo(camera, controls) {
  if (!DEBUG || !camera || !controls) return;

  const cameraContentElement = document.getElementById('debug-camera-content');
  if (cameraContentElement && cameraContentElement.style.display !== 'none') {
    const pos = camera.position;
    const target = controls.target;
    const distance = controls.getDistance ? controls.getDistance() : camera.position.distanceTo(target);
    // TODO: Decouple THREE.js from this debug utility. 
    // This could be done by passing pre-formatted strings or a generic stats object.
    const polarAngleDeg = controls.getPolarAngle ? THREE.MathUtils.radToDeg(controls.getPolarAngle()) : 'N/A';
    const azimuthalAngleDeg = controls.getAzimuthalAngle ? THREE.MathUtils.radToDeg(controls.getAzimuthalAngle()) : 'N/A';

    cameraContentElement.innerHTML = 
      `--- Camera Info ---<br>
      Pos: ${pos.x.toFixed(2)} km, ${pos.y.toFixed(2)} km, ${pos.z.toFixed(2)} km<br>
      Target: ${target.x.toFixed(2)} km, ${target.y.toFixed(2)} km, ${target.z.toFixed(2)} km<br>
      Dist: ${distance.toFixed(2)} km<br>
      MinDist: ${controls.minDistance.toFixed(2)} km<br>
      MaxDist: ${controls.maxDistance.toFixed(2)} km<br>
      FOV: ${camera.fov}°<br>
      Polar Angle: ${typeof polarAngleDeg === 'number' ? polarAngleDeg.toFixed(1) : polarAngleDeg}°<br>
      Azimuthal Angle: ${typeof azimuthalAngleDeg === 'number' ? azimuthalAngleDeg.toFixed(1) : azimuthalAngleDeg}°<br>
      Zoom Enabled: ${controls.enableZoom}<br>
      Rotate Enabled: ${controls.enableRotate}<br>
      Pan Enabled: ${controls.enablePan}`;
  }
}

export function updateGlobeDebugInfo(planetGroupInstance, globeStaticData) {
  if (!DEBUG) return;
  currentPlanetGroup = planetGroupInstance; // Update reference for slider callbacks

  const globeContentElement = document.getElementById('debug-globe-content');
  const globeInfoTextElement = document.getElementById('debug-globe-info-text'); // Get the dedicated text info div

  if (globeContentElement && globeContentElement.style.display !== 'none') {
    // Update slider values and displays from currentPlanetGroup.rotation
    if (currentPlanetGroup && globeRotXSlider && globeRotXDisplay) {
      globeRotXSlider.value = currentPlanetGroup.rotation.x.toFixed(4);
      globeRotXDisplay.textContent = currentPlanetGroup.rotation.x.toFixed(2);
    }
    if (currentPlanetGroup && globeRotYSlider && globeRotYDisplay) {
      globeRotYSlider.value = currentPlanetGroup.rotation.y.toFixed(4);
      globeRotYDisplay.textContent = currentPlanetGroup.rotation.y.toFixed(2);
    }
    if (currentPlanetGroup && globeRotZSlider && globeRotZDisplay) {
      globeRotZSlider.value = currentPlanetGroup.rotation.z.toFixed(4);
      globeRotZDisplay.textContent = currentPlanetGroup.rotation.z.toFixed(2);
    }

    // Update the text info part with globeStaticData (rotation in deg, angular velocity, damping)
    if (globeInfoTextElement && globeStaticData) {
      let content = '--- Globe Dynamics ---<br>';
      if (typeof globeStaticData === 'object' && globeStaticData !== null) {
        for (const key in globeStaticData) {
          if (Object.hasOwnProperty.call(globeStaticData, key)) {
            const value = globeStaticData[key];
            if (key === 'CurrentRotationDeg' || key === 'TargetAngularVelocity') {
              content += `${key}: <pre style="margin: 2px 0; padding: 2px; background: #222; border-radius: 3px;">${JSON.stringify(value, null, 2)}</pre>`;
            } else if (typeof value === 'number') {
              content += `${key}: ${value.toFixed ? value.toFixed(4) : value} km<br>`;
            } else {
              content += `${key}: ${value}<br>`;
            }
          }
        }
      } else {
        content += String(globeStaticData);
      }
      globeInfoTextElement.innerHTML = content;
    }
  }
}

// Add this function to log the entire world object structure for debugging
export function logWorldStructure(world) {
  if (!DEBUG) return;
  
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

// Add this function to initialize debug mode
export function initDebug() {
  if (!DEBUG) return;
  // createDebugUI();
  debug('Debug mode initialized');
  updateDebugStatus('Debug initialized');
  window.addEventListener('error', (event) => {
    error('Unhandled error:', event.error);
    updateDebugStatus(`ERROR: ${event.error.message}`);
  });
  window.addEventListener('unhandledrejection', (event) => {
    error('Unhandled promise rejection:', event.reason);
    updateDebugStatus(`Promise Error: ${event.reason}`);
  });
}