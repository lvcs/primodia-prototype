import { debug } from '@utils/debug.js';
import { planetSettings } from '@game/world/planetVoronoi.js'; 
import { generateWorld } from '@game/world/worldGenerator.js';
import { getColorForTerrain } from '@game/planet/terrain/index.js';
import { clearTrees } from '@game/planet/tree';
import { createHemosphere, removeHemosphere } from './hemosphere';
import { addPolarIndicators } from './polarIndicator';
import { applyElevationColors } from './elevation';
import { applyMoistureColors } from './moisture';
import { applyTemperatureColors } from './temperature';
import { applyPlateColors } from './techtonics';
import { useSceneStore } from '@stores';

let planetGroup;
let worldData;

export const getPlanetGroup = () => planetGroup;
export const getWorldData = () => worldData;

export function generateAndDisplayPlanet(_worldConfig, _controls, _existingPlanetGroup, _existingSelectedHighlight) {
  const scene = useSceneStore.getState().getScene();
  
  try {
    if (_existingPlanetGroup) {
      scene.remove(_existingPlanetGroup);      
      clearTrees();
      
      _existingPlanetGroup.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    removeHemosphere();

    const currentWorldConfig = {
      planetSettings: { ...planetSettings }
    };   
    
    worldData = generateWorld(currentWorldConfig);
    
    if (worldData && worldData.meshGroup) {
      planetGroup = worldData.meshGroup;

      addPolarIndicators(planetGroup);

      scene.add(planetGroup);
    }

    if (worldData && worldData.cells) {
        debug('Simplified world data log:', {cellCount: worldData.cells.length, config: worldData.config});
    }
    
    createHemosphere();
    updatePlanetColors(); 

    return { planetGroup, planet: worldData?.planet };

  } catch (err) {
    console.error('Caught error in generateAndDisplayPlanet. Original error object:', err);
  }
}

function hexToRgbArray(hex) {
  return [ ((hex>>16)&255)/255, ((hex>>8)&255)/255, (hex&255)/255 ];
}

export function updatePlanetColors() {
  if(!planetGroup) return;
  const mainMesh = planetGroup.children.find(c=>c.userData && c.userData.isMainMesh);
  if(!mainMesh) return;
  const colorsAttr = mainMesh.geometry.getAttribute('color');
  const tileIds = mainMesh.geometry.getAttribute('tileId');
  if(!colorsAttr || !tileIds) return;

  if (planetGroup && planetGroup.userData && planetGroup.userData.outlineLines) {
    planetGroup.userData.outlineLines.visible = planetSettings.outlineVisible;
  }

  const tileTerrain = mainMesh.userData.tileTerrain || {};

  if(planetSettings.viewMode === 'plates') {
    applyPlateColors(mainMesh, colorsAttr, tileIds);
  } else if(planetSettings.viewMode === 'elevation') {
    applyElevationColors(mainMesh, colorsAttr, tileIds);
  } else if(planetSettings.viewMode === 'moisture') {
    applyMoistureColors(mainMesh, colorsAttr, tileIds);
  } else if (planetSettings.viewMode === 'temperature') {
    applyTemperatureColors(mainMesh, colorsAttr, tileIds, worldData);
  } else { 
    // Default terrain view
    for(let i = 0; i < tileIds.count; i++) {
      const tileId = tileIds.array[i];
      const terrain = tileTerrain[tileId];
      const elevation = mainMesh.userData.tileElevation ? mainMesh.userData.tileElevation[tileId] : 0;
      const terrainColorHex = getColorForTerrain(terrain, elevation);
      const rgb = hexToRgbArray(terrainColorHex);
      
      colorsAttr.array[i * 3] = rgb[0];
      colorsAttr.array[i * 3 + 1] = rgb[1];
      colorsAttr.array[i * 3 + 2] = rgb[2];
    }
  }
  
  colorsAttr.needsUpdate = true;
} 