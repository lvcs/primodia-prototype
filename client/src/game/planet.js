// Planet generation, display, color updates, and rotation logic 
import * as THREE from 'three';
import { debug, error } from './utils/debug.js';
import * as Const from '../config/gameConstants.js';
import { sphereSettings } from './world/planetSphereVoronoi.js'; // Only sphereSettings.viewMode, elevationBias used
import { generateWorld } from './world/worldGenerator.js';
import { Terrains } from './world/registries/TerrainRegistry.js';

// Module-level variables for planet data
let planetGroup; // Stores the main THREE.Group for the planet
let worldData;   // Stores { meshGroup, cells, config } from generateWorld

// Getter for planetGroup, useful for other modules (e.g., controls, UI)
export const getPlanetGroup = () => planetGroup;
export const getWorldData = () => worldData;

export function generateAndDisplayPlanet(_scene, _worldConfig, _controls, _existingPlanetGroup, _existingSelectedHighlight, seed) {
  let currentWorldConfig = { ..._worldConfig }; // Use a copy to avoid direct mutation if not intended
  let currentControls = _controls;
  let currentSelectedHighlight = _existingSelectedHighlight;
  
  try {
    // Check if OrbitControls have been initialized yet. Passed via _controls.
    // This function might be called to regenerate the planet, potentially needing to re-setup controls
    // if critical parameters like radius changed. However, radius is now fixed.
    // let controlsNeedSetup = !currentControls;

    debug(`Generating planet with config: ${JSON.stringify(currentWorldConfig)}`);
    
    if (_existingPlanetGroup) {
      _scene.remove(_existingPlanetGroup);
      _existingPlanetGroup.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      // planetGroup = null; // Don't nullify the passed one, let caller manage its reference if needed
    }
    if (currentSelectedHighlight) { // If a highlight exists, remove it before regenerating planet
        // This assumes selectedHighlight is part of the planetGroup or scene that might be cleared
        // For now, we assume it might be added to planetGroup, so let planetGroup disposal handle it.
        // If it's added to scene directly, it needs separate handling or be passed to be removed from scene.
        // The original code added it to planetGroup.
    }

    const oldGlowMesh = _scene.children.find(child => child.userData && child.userData.isGlow);
    if (oldGlowMesh) {
        _scene.remove(oldGlowMesh);
        if(oldGlowMesh.geometry) oldGlowMesh.geometry.dispose();
        if(oldGlowMesh.material) oldGlowMesh.material.dispose();
    }

    worldData = generateWorld(currentWorldConfig, seed);
    
    if (worldData && worldData.meshGroup) {
      planetGroup = worldData.meshGroup;
      planetGroup.userData.angularVelocity = new THREE.Vector3(0, 0, 0);
      planetGroup.userData.targetAngularVelocity = new THREE.Vector3(0, 0, 0);
      planetGroup.userData.isBeingDragged = false;
      _scene.add(planetGroup);
      debug('Planet mesh group added to scene.');
    } else {
      error('Failed to generate planet mesh group. worldData:', worldData);
      const fallbackGeo = new THREE.SphereGeometry(currentWorldConfig.radius, 32, 32);
      const fallbackMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
      planetGroup = new THREE.Mesh(fallbackGeo, fallbackMat);
      // Initialize userData for the fallback planetGroup
      planetGroup.userData = {
        angularVelocity: new THREE.Vector3(0, 0, 0),
        targetAngularVelocity: new THREE.Vector3(0, 0, 0),
        isBeingDragged: false
        // Add any other userData properties that might be accessed
      };
      _scene.add(planetGroup);
    }

    if (worldData && worldData.cells) {
        debug('Simplified world data log:', {cellCount: worldData.cells.length, config: worldData.config});
    }
    
    addPlanetaryGlow(_scene, currentWorldConfig.radius);

    // Always update planet colors after generation to reflect the current sphereSettings.viewMode
    updatePlanetColors(); 

    debug('Planet generation and display complete.');
    return { planetGroup, worldData }; // Return the new planet group and world data

  } catch (err) {
    // Log the full error object, its message, and stack for better debugging
    console.error('Caught error in generateAndDisplayPlanet. Original error object:', err);
    if (err && err.message) {
      error('Error in generateAndDisplayPlanet (message): ', err.message);
    }
    if (err && err.stack) {
      console.error('Error stack trace:', err.stack);
    }
    // Keep the original generic error log as well, or replace if preferred
    error('Error in generateAndDisplayPlanet: Processing fallback.'); 

    if (_existingPlanetGroup) _scene.remove(_existingPlanetGroup);
    // Ensure planetGroup is assigned a fallback if error occurs before assignment
    const fallbackRadius = currentWorldConfig?.radius || worldConfig?.radius || 10;
    const fallbackGeometry = new THREE.SphereGeometry(fallbackRadius, 32, 32);
    const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    planetGroup = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    _scene.add(planetGroup);
    worldData = null; // Reset worldData on error
    return { planetGroup, worldData }; // Return fallback
  }
}

export function addPlanetaryGlow(_scene, radius) {
  const glowGeometry = new THREE.SphereGeometry(radius * Const.PLANETARY_GLOW_RADIUS_FACTOR, 64, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({ color: Const.PLANETARY_GLOW_COLOR, transparent: true, opacity: Const.PLANETARY_GLOW_OPACITY, side: THREE.BackSide });
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  glowMesh.userData.isGlow = true;
  _scene.add(glowMesh);
}

export function updatePlanetColors() {
  if(!planetGroup) return;
  const mainMesh = planetGroup.children.find(c=>c.userData && c.userData.isMainMesh);
  if(!mainMesh) return;
  const colorsAttr = mainMesh.geometry.getAttribute('color');
  const tileIds = mainMesh.geometry.getAttribute('tileId');
  if(!colorsAttr || !tileIds) return;

  // Update outline visibility
  if (planetGroup && planetGroup.userData && planetGroup.userData.outlineLines) {
    planetGroup.userData.outlineLines.visible = sphereSettings.outlineVisible;
  }

  const tileTerrain = mainMesh.userData.tileTerrain || {};
  const tilePlate = mainMesh.userData.tilePlate || {};
  const plateColors = mainMesh.userData.plateColors || {};

  function hexToRgbArr(hex){
    return [ ((hex>>16)&255)/255, ((hex>>8)&255)/255, (hex&255)/255 ];
  }

  const terrainColorCache = {};
  Object.values(Terrains).forEach(t=>{ terrainColorCache[t.id] = [ ((t.color>>16)&255)/255, ((t.color>>8)&255)/255, (t.color&255)/255 ]; });

  function elevationRGB(val){
    const elev = val + sphereSettings.elevationBias;
    const stops=[1,0.8,0.6,0.4,0.2,0,-0.2,-0.4,-0.6,-0.8,-1];
    const hex=[0x641009,0x87331E,0xAB673D,0xD2A467,0xFAE29A,0xF1EBDA,0x2F62B9,0x1E3FB2,0x0D1BA1,0x0C0484,0x170162];
    for(let i=0;i<stops.length;i++){
      if(elev>=stops[i]){ const h=hex[i]; return [((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255]; }
    }
    const h=hex[hex.length-1]; return [((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255];
  }

  function moistureRGB(val){
    const stops=[1,0.8,0.6,0.4,0.2,0];
    const hex=[0x75FB4C,0x7BD851,0x88B460,0x839169,0x6C6E65,0x6C6E65];
    for(let i=0;i<stops.length;i++){
      if(val>=stops[i]){ const h=hex[i]; return [((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255]; }
    }
    const h=hex[hex.length-1]; return [((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255];
  }

  for(let i=0;i<tileIds.count;i++){
    const tId = tileIds.array[i];
    let rgb;
    if(sphereSettings.viewMode==='plates'){
       const pid = tilePlate[tId];
       const hex = plateColors[pid] || 0xffffff;
       rgb = hexToRgbArr(hex);
    } else if(sphereSettings.viewMode==='elevation'){
       const elev = mainMesh.userData.tileElevation ? mainMesh.userData.tileElevation[tId] : 0;
       rgb = elevationRGB(elev);
    } else if(sphereSettings.viewMode==='moisture'){
       const moist = mainMesh.userData.tileMoisture ? mainMesh.userData.tileMoisture[tId] : 0;
       rgb = moistureRGB(moist);
    } else {
       const terr = tileTerrain[tId];
       rgb = terrainColorCache[terr] || [1,1,1];
    }
    colorsAttr.array[i*3] = rgb[0];
    colorsAttr.array[i*3+1] = rgb[1];
    colorsAttr.array[i*3+2] = rgb[2];
  }
  colorsAttr.needsUpdate = true;
}

export function updatePlanetRotation(deltaTime, _controls) { // Pass controls if it needs to be updated
  if (!planetGroup || !planetGroup.userData) return;

  const { angularVelocity, targetAngularVelocity, isBeingDragged } = planetGroup.userData;

  if (isBeingDragged) {
    return;
  }

  angularVelocity.lerp(targetAngularVelocity, Const.KEYBOARD_ROTATION_ACCELERATION_FACTOR);
  angularVelocity.multiplyScalar(Math.pow(Const.GLOBE_ANGULAR_DAMPING_FACTOR, deltaTime * 60));

  const minSpeed = 0.0001;
  if (angularVelocity.lengthSq() < minSpeed * minSpeed) {
    angularVelocity.set(0, 0, 0);
  }

  if (angularVelocity.lengthSq() > 0) {
    if (Math.abs(angularVelocity.x) > minSpeed) {
        planetGroup.rotateOnWorldAxis(new THREE.Vector3(1,0,0), angularVelocity.x * deltaTime);
    }
    if (Math.abs(angularVelocity.y) > minSpeed) {
        planetGroup.rotateOnWorldAxis(new THREE.Vector3(0,1,0), angularVelocity.y * deltaTime);
    }
    if (Math.abs(angularVelocity.z) > minSpeed) {
        planetGroup.rotateOnWorldAxis(new THREE.Vector3(0,0,1), angularVelocity.z * deltaTime);
    }
    if (_controls) _controls.update(); // Update OrbitControls if planet moves
  }
} 