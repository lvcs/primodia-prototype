/**
 * Debug utility for Primodia game
 * This file contains utility functions for debugging the game.
 */

import * as THREE from 'three'; // Added for THREE.MathUtils
import { SliderControl } from '@/ui/components/SliderControl.js'; // Corrected import path

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

// Create a simple debug GUI to overlay on the game
export function createDebugUI() {
  if (!DEBUG) return;

  // Create a debug panel
  const debugPanel = document.createElement('div');
  debugPanel.id = 'debug-panel';
  debugPanel.style.position = 'absolute';
  debugPanel.style.bottom = '10px';
  debugPanel.style.left = '50%'; // Center horizontally
  debugPanel.style.transform = 'translateX(-50%)'; // Ensure proper centering
  debugPanel.style.padding = '10px';
  debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  debugPanel.style.color = 'white';
  debugPanel.style.fontFamily = 'monospace';
  debugPanel.style.zIndex = '1000';
  debugPanel.style.fontSize = '12px';
  debugPanel.style.minWidth = '350px'; // Adjusted width
  debugPanel.style.maxHeight = '300px'; // Increased maxHeight for more controls
  debugPanel.style.overflow = 'hidden'; // Will use custom scroll for content

  // Header
  const header = document.createElement('h3');
  header.textContent = 'Debug Info';
  debugPanel.appendChild(header);

  // Segmented Control
  const segmentControlContainer = document.createElement('div');
  segmentControlContainer.style.display = 'flex';
  segmentControlContainer.style.marginBottom = '5px';

  const tileButton = document.createElement('button');
  tileButton.id = 'debug-tab-tile';
  tileButton.textContent = 'Tile';
  tileButton.style.flexGrow = '1';
  tileButton.style.padding = '5px';
  tileButton.style.border = '1px solid #555';
  tileButton.style.backgroundColor = '#333';
  tileButton.style.color = 'white';
  tileButton.style.cursor = 'pointer';
  
  const cameraButton = document.createElement('button');
  cameraButton.id = 'debug-tab-camera';
  cameraButton.textContent = 'Camera';
  cameraButton.style.flexGrow = '1';
  cameraButton.style.padding = '5px';
  cameraButton.style.border = '1px solid #555';
  cameraButton.style.backgroundColor = '#333';
  cameraButton.style.color = 'white';
  cameraButton.style.cursor = 'pointer';

  const globeButton = document.createElement('button');
  globeButton.id = 'debug-tab-globe';
  globeButton.textContent = 'Globe';
  globeButton.style.flexGrow = '1';
  globeButton.style.padding = '5px';
  globeButton.style.border = '1px solid #555';
  globeButton.style.backgroundColor = '#333';
  globeButton.style.color = 'white';
  globeButton.style.cursor = 'pointer';

  segmentControlContainer.appendChild(tileButton);
  segmentControlContainer.appendChild(cameraButton);
  segmentControlContainer.appendChild(globeButton);
  debugPanel.appendChild(segmentControlContainer);

  // Content Containers
  const tileContent = document.createElement('div');
  tileContent.id = 'debug-tile-content';
  tileContent.style.padding = '5px';
  tileContent.style.border = '1px dashed #444';
  tileContent.style.maxHeight = '150px'; // Max height for content area
  tileContent.style.overflowY = 'auto'; // Scroll for this content
  debugPanel.appendChild(tileContent);

  const cameraContent = document.createElement('div');
  cameraContent.id = 'debug-camera-content';
  cameraContent.style.padding = '5px';
  cameraContent.style.border = '1px dashed #444';
  cameraContent.style.maxHeight = '150px'; // Max height for content area
  cameraContent.style.overflowY = 'auto'; // Scroll for this content
  debugPanel.appendChild(cameraContent);

  const globeContent = document.createElement('div');
  globeContent.id = 'debug-globe-content';
  globeContent.style.padding = '5px';
  globeContent.style.border = '1px dashed #444';
  globeContent.style.maxHeight = '150px';
  globeContent.style.overflowY = 'auto';
  debugPanel.appendChild(globeContent);
  
  // Utility Buttons (Clear Cache, Reload, Toggle Verbose)
  const utilityButtonsContainer = document.createElement('div');
  utilityButtonsContainer.style.marginTop = '5px';
  
  const clearCacheButton = document.createElement('button');
  clearCacheButton.id = 'debug-clear-cache';
  clearCacheButton.textContent = 'Clear Cache';
  clearCacheButton.style.marginRight = '5px';
  clearCacheButton.style.cursor = 'pointer';

  const reloadButton = document.createElement('button');
  reloadButton.id = 'debug-reload';
  reloadButton.textContent = 'Reload';
  reloadButton.style.marginRight = '5px';
  reloadButton.style.cursor = 'pointer';
  
  const verboseButton = document.createElement('button');
  verboseButton.id = 'debug-verbose';
  verboseButton.textContent = 'Toggle Verbose';
  verboseButton.style.cursor = 'pointer';
  
  utilityButtonsContainer.appendChild(clearCacheButton);
  utilityButtonsContainer.appendChild(reloadButton);
  utilityButtonsContainer.appendChild(verboseButton);
  debugPanel.appendChild(utilityButtonsContainer);

  // Replaces the old debug-status div for general messages
  const generalStatusDiv = document.createElement('div');
  generalStatusDiv.id = 'debug-general-status'; 
  generalStatusDiv.style.marginTop = '5px';
  generalStatusDiv.style.fontSize = '10px';
  generalStatusDiv.style.maxHeight = '50px';
  generalStatusDiv.style.overflowY = 'auto';
  debugPanel.appendChild(generalStatusDiv);

  document.body.appendChild(debugPanel);

  const setActiveTab = (tabName) => {
    // Reset all button backgrounds and hide all content
    tileButton.style.backgroundColor = '#333';
    cameraButton.style.backgroundColor = '#333';
    globeButton.style.backgroundColor = '#333';
    tileContent.style.display = 'none';
    cameraContent.style.display = 'none';
    globeContent.style.display = 'none';

    if (tabName === 'tile') {
      tileButton.style.backgroundColor = '#555';
      tileContent.style.display = 'block';
      localStorage.setItem('debugTabState', 'tile');
    } else if (tabName === 'camera') {
      cameraButton.style.backgroundColor = '#555';
      cameraContent.style.display = 'block';
      localStorage.setItem('debugTabState', 'camera');
    } else if (tabName === 'globe') {
      globeButton.style.backgroundColor = '#555';
      globeContent.style.display = 'block';
      localStorage.setItem('debugTabState', 'globe');
    }
  };

  tileButton.addEventListener('click', () => setActiveTab('tile'));
  cameraButton.addEventListener('click', () => setActiveTab('camera'));
  globeButton.addEventListener('click', () => setActiveTab('globe'));

  // Load initial state
  const savedTab = localStorage.getItem('debugTabState');
  if (savedTab === 'camera') {
    setActiveTab('camera');
  } else if (savedTab === 'globe') {
    setActiveTab('globe');
  } else {
    setActiveTab('tile'); // Default to tile
  }
  
  // Add event listeners for utility buttons
  clearCacheButton.addEventListener('click', () => {
    localStorage.clear(); // This will also clear debugTabState, so we reset it.
    debug('Cache cleared');
    updateDebugStatus('Cache cleared'); // Uses the new general status div
    setActiveTab('tile'); // Reset to default tab after clearing all of localStorage
  });
  
  reloadButton.addEventListener('click', () => {
    window.location.reload();
  });
  
  verboseButton.addEventListener('click', () => {
    window.VERBOSE_DEBUG = !window.VERBOSE_DEBUG;
    updateDebugStatus(`Verbose mode: ${window.VERBOSE_DEBUG ? 'ON' : 'OFF'}`);
  });
  
  // (Inside createDebugUI, after creating globeContent div)
  if (!globeContent.querySelector('#globe-rotation-sliders-container')) { // Check if sliders are already added
    const slidersContainer = document.createElement('div');
    slidersContainer.id = 'globe-rotation-sliders-container';
    slidersContainer.style.marginTop = '10px';

    const createRotationSlider = (axis, labelText) => {
      const container = document.createElement('div');
      container.style.display = 'flex'; container.style.alignItems = 'center'; container.style.marginBottom = '2px';
      const label = document.createElement('div'); label.textContent = labelText; label.style.marginRight = '3px'; label.style.width = '90px';
      const display = document.createElement('div'); display.style.minWidth = '50px'; display.style.marginLeft='3px';
      const slider = SliderControl({
          id: `globe-rot-${axis}-slider`, min: -Math.PI.toFixed(4), max: Math.PI.toFixed(4), step: (Math.PI / 180).toFixed(4), // Approx 1 degree step
          onInput: (event) => {
              if (currentPlanetGroup) {
                  const val = parseFloat(event.target.value);
                  currentPlanetGroup.rotation[axis] = val;
                  display.textContent = val.toFixed(2);
              }
          }
      });
      slider.style.flexGrow = '1';
      container.appendChild(label); container.appendChild(slider); container.appendChild(display);
      slidersContainer.appendChild(container);
      return { slider, display };
    };

    const xRot = createRotationSlider('x', 'Rot X (rad):');
    globeRotXSlider = xRot.slider; globeRotXDisplay = xRot.display;
    const yRot = createRotationSlider('y', 'Rot Y (rad):');
    globeRotYSlider = yRot.slider; globeRotYDisplay = yRot.display;
    const zRot = createRotationSlider('z', 'Rot Z (rad):');
    globeRotZSlider = zRot.slider; globeRotZDisplay = zRot.display;
    
    globeContent.appendChild(slidersContainer);

    const globeInfoTextElement = document.createElement('div');
    globeInfoTextElement.id = 'debug-globe-info-text'; 
    globeInfoTextElement.style.marginTop = '10px';
    globeInfoTextElement.style.borderTop = '1px solid #555';
    globeInfoTextElement.style.paddingTop = '5px';
    globeInfoTextElement.style.fontSize = '11px'; // Slightly smaller for dense info
    globeContent.appendChild(globeInfoTextElement);
  }
  
  return debugPanel;
}

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
  createDebugUI();
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