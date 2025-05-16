// Planet generation, display, color updates, and rotation logic 
import * as THREE from 'three';
import { debug, error } from './utils/debug.js';
import * as Const from '../config/gameConstants.js';
import { sphereSettings } from './world/planetSphereVoronoi.js'; // Only sphereSettings.viewMode, elevationBias used
import { generateWorld } from './world/worldGenerator.js';
import { Terrains, getColorForTerrain } from './world/registries/TerrainRegistry.js';
import { getColorForTemperature } from './world/registries/TemperatureRegistry.js'; // Import new registry function
import { getColorForMoisture } from './world/registries/MoistureRegistry.js'; // Import new registry function

// Module-level variables for planet data
let planetGroup; // Stores the main THREE.Group for the planet
let worldData;   // Stores { meshGroup, cells, config } from generateWorld

// Getter for planetGroup, useful for other modules (e.g., controls, UI)
export const getPlanetGroup = () => planetGroup;
export const getWorldData = () => worldData;

export function generateAndDisplayPlanet(_scene, _worldConfig, _controls, _existingPlanetGroup, _existingSelectedHighlight, seed) {
  let currentWorldConfig = { ..._worldConfig }; // Use a copy to avoid direct mutation if not intended
  // let currentControls = _controls; // _controls is not directly used in a way that requires it to be a mutable let here
  // let currentSelectedHighlight = _existingSelectedHighlight; // Same for _existingSelectedHighlight
  
  try {
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
    }
    // currentSelectedHighlight is not directly used after this point, its removal is tied to _existingPlanetGroup logic implicitly

    const oldGlowMesh = _scene.children.find(child => child.userData && child.userData.isGlow);
    if (oldGlowMesh) {
        _scene.remove(oldGlowMesh);
        if(oldGlowMesh.geometry) oldGlowMesh.geometry.dispose();
        if(oldGlowMesh.material) oldGlowMesh.material.dispose();
    }

    worldData = generateWorld(currentWorldConfig, seed);
    
    if (worldData && worldData.meshGroup) {
      planetGroup = worldData.meshGroup;
      planetGroup.rotation.y = 0; // Initialize Y rotation
      // Initialize userData if not already present from generateWorld (meshGroup should ideally have it)
      planetGroup.userData = {
        ...planetGroup.userData, // Preserve existing userData from meshGroup
        angularVelocity: new THREE.Vector3(0, 0, 0),
        targetAngularVelocity: new THREE.Vector3(0, 0, 0),
        isBeingDragged: false
      };

      // Add Polar Axis Helpers (Thicker Cylinders)
      const poleMarkerHeight = currentWorldConfig.radius * 0.20; // Length of the pole marker
      const poleMarkerRadius = currentWorldConfig.radius * 0.03; // Thickness of the pole marker
      const poleOffset = currentWorldConfig.radius * 0.02;   // Small offset from pole surface

      const poleGeometry = new THREE.CylinderGeometry(poleMarkerRadius, poleMarkerRadius, poleMarkerHeight, 8);
      
      // North Pole Helper (Blue)
      const northPoleMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      const northPoleMarker = new THREE.Mesh(poleGeometry, northPoleMaterial);
      // Position the cylinder: its origin is at its center. Base should be at radius + offset.
      northPoleMarker.position.y = currentWorldConfig.radius + poleOffset + (poleMarkerHeight / 2);
      planetGroup.add(northPoleMarker);

      // South Pole Helper (Red)
      const southPoleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const southPoleMarker = new THREE.Mesh(poleGeometry, southPoleMaterial); // Re-use geometry
      // Position the cylinder: its origin is at its center. Base (top of cylinder for south) should be at -(radius + offset).
      southPoleMarker.position.y = -(currentWorldConfig.radius + poleOffset + (poleMarkerHeight / 2));
      planetGroup.add(southPoleMarker);

      _scene.add(planetGroup);
      debug('Planet mesh group added to scene.');
    } else {
      error('Failed to generate planet mesh group. worldData:', worldData);
      const fallbackRadius = currentWorldConfig?.radius || _worldConfig?.radius || 10;
      const fallbackGeometry = new THREE.SphereGeometry(fallbackRadius, 32, 32);
      const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
      planetGroup = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
      planetGroup.rotation.y = 0; // Initialize Y rotation for fallback
      planetGroup.userData = { // Initialize userData for the fallback planetGroup
        angularVelocity: new THREE.Vector3(0, 0, 0),
        targetAngularVelocity: new THREE.Vector3(0, 0, 0),
        isBeingDragged: false
      };
      _scene.add(planetGroup);
      worldData = null; 
    }

    if (worldData && worldData.cells) {
        debug('Simplified world data log:', {cellCount: worldData.cells.length, config: worldData.config});
    }
    
    addPlanetaryGlow(_scene, currentWorldConfig.radius);
    updatePlanetColors(); 

    debug('Planet generation and display complete.');
    return { planetGroup, worldData };

  } catch (err) {
    console.error('Caught error in generateAndDisplayPlanet. Original error object:', err);
    if (err && err.message) error('Error in generateAndDisplayPlanet (message): ', err.message);
    if (err && err.stack) console.error('Error stack trace:', err.stack);
    error('Error in generateAndDisplayPlanet: Processing fallback.'); 

    if (_existingPlanetGroup) _scene.remove(_existingPlanetGroup);
    const fallbackRadius = currentWorldConfig?.radius || _worldConfig?.radius || 10;
    const fallbackGeometry = new THREE.SphereGeometry(fallbackRadius, 32, 32);
    const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    planetGroup = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    planetGroup.rotation.y = 0; // Initialize Y rotation for catch block fallback
    planetGroup.userData = { // Initialize userData for the catch block fallback planetGroup
        angularVelocity: new THREE.Vector3(0, 0, 0),
        targetAngularVelocity: new THREE.Vector3(0, 0, 0),
        isBeingDragged: false
    };
    _scene.add(planetGroup);
    worldData = null; 
    return { planetGroup, worldData };
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

  const tempColor = new THREE.Color(); // For color conversion, if not already defined

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
       tempColor.setHex(getColorForMoisture(moist)); // Use new function
       rgb = [tempColor.r, tempColor.g, tempColor.b];
    } else if (sphereSettings.viewMode === 'temperature') {
        const tile = worldData?.globe?.getTile(tId);
        if (tile && tile.temperature !== undefined) {
            tempColor.setHex(getColorForTemperature(tile.temperature));
            rgb = [tempColor.r, tempColor.g, tempColor.b];
        } else {
            rgb = [0.5, 0.5, 0.5]; // Default grey for missing temp data
        }
    } else { // Default to terrain view
       const terr = tileTerrain[tId];
       const elevation = mainMesh.userData.tileElevation ? mainMesh.userData.tileElevation[tId] : 0;
       const terrainColorHex = getColorForTerrain(terr, elevation);
       rgb = hexToRgbArr(terrainColorHex);
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