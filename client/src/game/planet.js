// All radius values are now in kilometers (1 unit = 1 km)
// Planet generation, display, color updates, and rotation logic 
import * as THREE from 'three';
import { debug, error } from './utils/debug.js';
import * as Const from '@config/gameConfig.js'; // Adjusted path
import { sphereSettings } from './world/planetSphereVoronoi.js'; 
import { generateWorld } from './world/worldGenerator.js';
import { Terrains, getColorForTerrain } from './world/registries/TerrainRegistry.js';
import { getColorForTemperature } from './world/registries/TemperatureRegistry.js';
import { getColorForMoisture } from './world/registries/MoistureRegistry.js';

let planetGroup;
let worldData;

export const getPlanetGroup = () => planetGroup;
export const getWorldData = () => worldData;

// This function is now internal and used by generateAndDisplayPlanet
// It might be better to move its logic into generateAndDisplayPlanet or make it static helper
function addPlanetaryGlow(_scene, radius) {
  const glowGeometry = new THREE.SphereGeometry(radius * Const.PLANETARY_GLOW_RADIUS_FACTOR, 64, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({ color: Const.PLANETARY_GLOW_COLOR, transparent: true, opacity: Const.PLANETARY_GLOW_OPACITY, side: THREE.BackSide });
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  glowMesh.userData.isGlow = true;
  _scene.add(glowMesh);
}

export function generateAndDisplayPlanet(_scene, _worldConfig, _controls, _existingPlanetGroup, _existingSelectedHighlight, seed) {
  let currentWorldConfig = { ..._worldConfig };
  
  try {
    debug(`Generating planet with config: ${JSON.stringify(currentWorldConfig)}`);
    console.log('Current sphereSettings in generateAndDisplayPlanet:', {
      drawMode: sphereSettings.drawMode,
      algorithm: sphereSettings.algorithm,
      numPoints: sphereSettings.numPoints,
      jitter: sphereSettings.jitter,
      mapType: sphereSettings.mapType,
      outlineVisible: sphereSettings.outlineVisible,
      numPlates: sphereSettings.numPlates,
      viewMode: sphereSettings.viewMode,
      elevationBias: sphereSettings.elevationBias,
      currentSeed: sphereSettings.currentSeed
    });
    
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

    const oldGlowMesh = _scene.children.find(child => child.userData && child.userData.isGlow);
    if (oldGlowMesh) {
        _scene.remove(oldGlowMesh);
        if(oldGlowMesh.geometry) oldGlowMesh.geometry.dispose();
        if(oldGlowMesh.material) oldGlowMesh.material.dispose();
    }

    // Update worldConfig with current sphereSettings - this is critical!
    currentWorldConfig.sphereSettings = { ...sphereSettings };
    
    // Set the seed in config to ensure it's used consistently
    if (seed !== undefined) {
      console.log(`Setting explicit seed "${seed}" in worldConfig for generateWorld`);
      currentWorldConfig.seed = seed;
    } else if (sphereSettings.currentSeed) {
      console.log(`Using sphereSettings.currentSeed "${sphereSettings.currentSeed}" in worldConfig`);
      currentWorldConfig.seed = sphereSettings.currentSeed;
    }
    
    console.log('Passing updated worldConfig with sphereSettings to generateWorld:', currentWorldConfig);
    console.log('VERIFICATION: numPoints in sphereSettings being passed:', sphereSettings.numPoints);
    
    worldData = generateWorld(currentWorldConfig, seed);
    
    if (worldData && worldData.meshGroup) {
      planetGroup = worldData.meshGroup;
      planetGroup.rotation.y = 0; 
      planetGroup.userData = {
        ...planetGroup.userData,
        angularVelocity: new THREE.Vector3(0, 0, 0),
        targetAngularVelocity: new THREE.Vector3(0, 0, 0),
        isBeingDragged: false
      };

      const poleMarkerHeight = currentWorldConfig.radius * 0.20;
      const poleMarkerRadius = currentWorldConfig.radius * 0.03;
      const poleOffset = currentWorldConfig.radius * 0.02;   
      const poleGeometry = new THREE.CylinderGeometry(poleMarkerRadius, poleMarkerRadius, poleMarkerHeight, 8);
      
      const northPoleMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      const northPoleMarker = new THREE.Mesh(poleGeometry, northPoleMaterial);
      northPoleMarker.position.y = currentWorldConfig.radius + poleOffset + (poleMarkerHeight / 2);
      planetGroup.add(northPoleMarker);

      const southPoleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const southPoleMarker = new THREE.Mesh(poleGeometry, southPoleMaterial); 
      southPoleMarker.position.y = -(currentWorldConfig.radius + poleOffset + (poleMarkerHeight / 2));
      planetGroup.add(southPoleMarker);

      _scene.add(planetGroup);
      debug('Planet mesh group added to scene.');
    } else {
      error('Failed to generate planet mesh group. worldData:', worldData);
      const fallbackRadius = currentWorldConfig?.radius || _worldConfig?.radius || 6400;
      const fallbackGeometry = new THREE.SphereGeometry(fallbackRadius, 32, 32);
      const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
      planetGroup = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
      planetGroup.rotation.y = 0; 
      planetGroup.userData = { 
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
    // Return the actual seed that was used along with other data
    const actualSeed = worldData?.actualSeed || seed || (sphereSettings.currentSeed ? String(sphereSettings.currentSeed) : String(Date.now()));
    return { planetGroup, globe: worldData?.globe, actualSeed };

  } catch (err) {
    console.error('Caught error in generateAndDisplayPlanet. Original error object:', err);
    if (err && err.message) error('Error in generateAndDisplayPlanet (message): ', err.message);
    if (err && err.stack) console.error('Error stack trace:', err.stack);
    error('Error in generateAndDisplayPlanet: Processing fallback.'); 

    if (_existingPlanetGroup) _scene.remove(_existingPlanetGroup);
    const fallbackRadius = currentWorldConfig?.radius || _worldConfig?.radius || 6400;
    const fallbackGeometry = new THREE.SphereGeometry(fallbackRadius, 32, 32);
    const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    planetGroup = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    planetGroup.rotation.y = 0; 
    planetGroup.userData = { 
        angularVelocity: new THREE.Vector3(0, 0, 0),
        targetAngularVelocity: new THREE.Vector3(0, 0, 0),
        isBeingDragged: false
    };
    _scene.add(planetGroup);
    worldData = null; 
    return { planetGroup, worldData: null, actualSeed: seed || String(Date.now()) };
  }
}


export function updatePlanetColors() {
  if(!planetGroup) return;
  const mainMesh = planetGroup.children.find(c=>c.userData && c.userData.isMainMesh);
  if(!mainMesh) return;
  const colorsAttr = mainMesh.geometry.getAttribute('color');
  const tileIds = mainMesh.geometry.getAttribute('tileId');
  if(!colorsAttr || !tileIds) return;

  if (planetGroup && planetGroup.userData && planetGroup.userData.outlineLines) {
    planetGroup.userData.outlineLines.visible = sphereSettings.outlineVisible;
  }

  const tileTerrain = mainMesh.userData.tileTerrain || {};
  const tilePlate = mainMesh.userData.tilePlate || {};
  const plateColors = mainMesh.userData.plateColors || {};

  function hexToRgbArr(hex){
    return [ ((hex>>16)&255)/255, ((hex>>8)&255)/255, (hex&255)/255 ];
  }

  // const terrainColorCache = {}; // This seems unused, getColorForTerrain handles caching or direct calc
  // Object.values(Terrains).forEach(t=>{ terrainColorCache[t.id] = [ ((t.color>>16)&255)/255, ((t.color>>8)&255)/255, (t.color&255)/255 ]; });

  function elevationRGB(val){
    const elev = val + sphereSettings.elevationBias;
    const oceanHex = [
      0x0a0033, 0x0b003a, 0x0c0040, 0x0d0047, 0x0e004d, 0x0f0054, 0x10005a, 0x110061, 0x120067, 0x13006e,
      0x140074, 0x15007b, 0x160081, 0x170088, 0x18008e, 0x190095, 0x1a009b, 0x1b00a2, 0x1c00a8, 0x1d00af
    ];
    const landHex = [
      0xfff9e5, 0xfff3cc, 0xffecb2, 0xffe699, 0xffe080, 0xffb366, 0xff804d, 0xff4d33, 0xff1a1a, 0xf21616,
      0xe61212, 0xd90e0e, 0xcc0a0a, 0xbf0606, 0xb20202, 0xa60000, 0x990000, 0x7a0000, 0x5c0000, 0x3d0000
    ];
    if (elev < 0) {
      const idx = Math.max(0, Math.min(19, Math.floor((elev + 1) / (1 / 20))));
      const h = oceanHex[idx];
      return [((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255];
    } else {
      const idx = Math.max(0, Math.min(19, Math.floor(elev / (1 / 20))));
      const h = landHex[idx];
      return [((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255];
    }
  }

  const tempColor = new THREE.Color();

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
       tempColor.setHex(getColorForMoisture(moist));
       rgb = [tempColor.r, tempColor.g, tempColor.b];
    } else if (sphereSettings.viewMode === 'temperature') {
        // Assuming worldData and worldData.globe are accessible here, or tile data is on mainMesh.userData
        const tileData = worldData?.globe?.getTile(tId); // Example: find cell by ID
        if (tileData && tileData.temperature !== undefined) { // Adjust based on actual data structure
            tempColor.setHex(getColorForTemperature(tileData.temperature));
            rgb = [tempColor.r, tempColor.g, tempColor.b];
        } else {
            rgb = [0.5, 0.5, 0.5]; 
        }
    } else { 
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