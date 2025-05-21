
export const DEBUG = true;

export function debug(...args) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

export function error(...args) {
  console.error('[ERROR]', ...args);
}

export function updateDebugStatus(message) {
  if (!DEBUG) return;
}

export function updateTileDebugInfo(htmlContent) {
  if (!DEBUG) return;
}

export function updateCameraDebugInfo(camera, controls) {
}

export function updateGlobeDebugInfo(planetGroupInstance, globeStaticData) {
}

export function logWorldStructure(world) {
  if (!DEBUG) return;
 
}

export function initDebug() {
  if (!DEBUG) return;
  
} 