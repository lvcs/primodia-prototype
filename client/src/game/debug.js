/**
 * Debug utility for Primodia game
 * This file contains utility functions for debugging the game.
 */

// Enable or disable debug mode
export const DEBUG = true;

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

// Create a simple debug GUI to overlay on the game
export function createDebugUI() {
  if (!DEBUG) return;

  // Create a debug panel
  const debugPanel = document.createElement('div');
  debugPanel.id = 'debug-panel';
  debugPanel.style.position = 'absolute';
  debugPanel.style.bottom = '10px';
  debugPanel.style.left = '10px';
  debugPanel.style.padding = '10px';
  debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  debugPanel.style.color = 'white';
  debugPanel.style.fontFamily = 'monospace';
  debugPanel.style.zIndex = '1000';
  debugPanel.style.fontSize = '12px';
  debugPanel.style.maxWidth = '300px';
  debugPanel.style.maxHeight = '200px';
  debugPanel.style.overflow = 'auto';
  
  // Add debug info
  debugPanel.innerHTML = `<h3>Debug Info</h3>
    <button id="debug-clear-cache">Clear Cache</button>
    <button id="debug-reload">Reload</button>
    <button id="debug-verbose">Toggle Verbose</button>
    <div id="debug-status"></div>
  `;
  
  document.body.appendChild(debugPanel);
  
  // Add event listeners
  document.getElementById('debug-clear-cache').addEventListener('click', () => {
    // Clear localStorage
    localStorage.clear();
    debug('Cache cleared');
    updateDebugStatus('Cache cleared');
  });
  
  document.getElementById('debug-reload').addEventListener('click', () => {
    // Reload the page
    window.location.reload();
  });
  
  document.getElementById('debug-verbose').addEventListener('click', () => {
    // Toggle verbose logging
    window.VERBOSE_DEBUG = !window.VERBOSE_DEBUG;
    updateDebugStatus(`Verbose mode: ${window.VERBOSE_DEBUG ? 'ON' : 'OFF'}`);
  });
  
  return debugPanel;
}

// Update the debug status
export function updateDebugStatus(message) {
  if (!DEBUG) return;
  
  const statusElement = document.getElementById('debug-status');
  if (statusElement) {
    statusElement.innerHTML += `<div>${new Date().toLocaleTimeString()}: ${message}</div>`;
    statusElement.scrollTop = statusElement.scrollHeight;
  }
}

// Add this function to log the entire world object structure for debugging
export function logWorldStructure(world) {
  if (!DEBUG) return;
  
  try {
    debug('World structure:');
    debug(`- config: ${JSON.stringify(world.config)}`);
    debug(`- cells count: ${world.cells ? world.cells.length : 'undefined'}`);
    
    if (world.cells && world.cells.length > 0) {
      // Log a sample cell
      const sampleCell = world.cells[0];
      debug('Sample cell structure:');
      debug(`- id: ${sampleCell.id}`);
      debug(`- center: (${sampleCell.center.x.toFixed(2)}, ${sampleCell.center.y.toFixed(2)}, ${sampleCell.center.z.toFixed(2)})`);
      debug(`- vertices: ${sampleCell.vertices.length} points`);
      debug(`- data: ${JSON.stringify(sampleCell.data)}`);
    }
  } catch (error) {
    error('Error logging world structure:', error);
  }
}

// Initialize debug mode
export function initDebug() {
  if (!DEBUG) return;
  
  createDebugUI();
  debug('Debug mode initialized');
  updateDebugStatus('Debug initialized');
  
  // Add unhandled error handler
  window.addEventListener('error', (event) => {
    error('Unhandled error:', event.error);
    updateDebugStatus(`ERROR: ${event.error.message}`);
  });
  
  // Add promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    error('Unhandled promise rejection:', event.reason);
    updateDebugStatus(`Promise Error: ${event.reason}`);
  });
} 