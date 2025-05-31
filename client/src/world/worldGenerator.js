import * as THREE from 'three';
import { generatePlanetGeometryGroup, planetSettings, classifyTerrain, classifyTileTerrainFromProperties } from './planetVoronoi.js';
import WorldPlanet from './model/WorldPlanet.js';
import Tile from './model/Tile.js';
import { terrainById, getColorForTerrain } from '@game/planet/terrain/index.js';
import { getColorForTemperature } from '@/planet/temperature';
import { getColorForMoisture } from '@/planet/moisture';
import { generatePlates } from '@game/planet/techtonics';
import { nextFloat } from '@game/core/RandomService';

import { 
  shouldHaveTrees,
  addTreesToScene,
} from '@game/planet/tree';

/**
 * Generates planet mesh (legacy) plus OO WorldPlanet description.
 * @param {{radius:number, planetSettings?:object}} config
 * @returns {{ meshGroup: THREE.Group, planet: WorldPlanet, config: any, actualSeed: string }}
 */
export function generateWorld(config){
  
  // If config contains planetSettings, use it to override the global planetSettings object
  if (config.planetSettings) {
    
    // Update the global planetSettings with the values from config
    planetSettings.drawMode = config.planetSettings.drawMode;
    planetSettings.algorithm = config.planetSettings.algorithm;
    planetSettings.numPoints = config.planetSettings.numPoints;
    planetSettings.jitter = config.planetSettings.jitter;

    planetSettings.outlineVisible = config.planetSettings.outlineVisible;
    planetSettings.numPlates = config.planetSettings.numPlates;
    planetSettings.viewMode = config.planetSettings.viewMode;
    planetSettings.elevationBias = config.planetSettings.elevationBias;
    
  } else {
    console.warn('[generateWorld] No planetSettings received in config, using existing values');
  }
  
   
  const meshGroup = generatePlanetGeometryGroup(config);
  const mainMesh = meshGroup.children.find(c=>c.userData && c.userData.isMainMesh);
  if(!mainMesh){
    return { meshGroup, planet:null, config };
  }
  const idsAttr = mainMesh.geometry.getAttribute('tileId');
  const posAttr = mainMesh.geometry.getAttribute('position');
  const tileTerrain = mainMesh.userData.tileTerrain || {};
  const tileSphericalExcesses = mainMesh.userData.tileSphericalExcesses || {}; // Get excesses
  const planetRadius = config.radius; // Actual radius of the planet

  const planet = new WorldPlanet({
    drawMode: planetSettings.drawMode,
    algorithm: planetSettings.algorithm,
    numTiles: planetSettings.numPoints,
    jitter: planetSettings.jitter,
    size: config.radius
  });

  // compute centroid per tile
  const sums = {};
  const counts = {};
  for(let i=0;i<idsAttr.count;i++){
    const id = idsAttr.array[i];
    if(!sums[id]){ sums[id] = new THREE.Vector3(); counts[id]=0; }
    sums[id].add(new THREE.Vector3(posAttr.array[i*3], posAttr.array[i*3+1], posAttr.array[i*3+2]));
    counts[id]++;
  }

  Object.keys(sums).forEach(idStr=>{
    const id = parseInt(idStr,10);
    const centerVec = sums[id].divideScalar(counts[id]).normalize();
    const center = [centerVec.x, centerVec.y, centerVec.z];
    const terrId = tileTerrain[id] || classifyTerrain(centerVec);
    const terrain = terrainById(terrId) || terrainById('PLAINS');
    
    // Calculate actual area
    const sphericalExcess = tileSphericalExcesses[id] !== undefined ? tileSphericalExcesses[id] : 0.0;
    const area = sphericalExcess * planetRadius * planetRadius;
    
    const tile = new Tile({ id, terrain, center, neighbors: [], area });
    // Initial terrain classification based on simple geometry (e.g., from planetPlanetVoronoi)
    // This initialTerrain might come from mainMesh.userData.tileTerrain[tileId] if set during geometry generation
    const initialTerrainIdFromGeometry = mainMesh.userData.tileTerrain ? mainMesh.userData.tileTerrain[id] : undefined;
    tile.terrain = initialTerrainIdFromGeometry || classifyTileTerrainFromProperties(tile); // Fallback if needed, though tile lacks elevation etc. here

    // Set a very basic color or leave for later; full classification needs elevation/moisture
    // tile.color = Terrains[tile.terrain] ? (typeof Terrains[tile.terrain].color === 'number' ? Terrains[tile.terrain].color : Terrains[tile.terrain].color.default) : 0xffffff;
    
    planet.addTile(tile);
  });

  // Use neighbor map from mesh if provided
  if(mainMesh && mainMesh.userData.tileNeighbors){
    const neighborObj = mainMesh.userData.tileNeighbors;
    Object.keys(neighborObj).forEach(idStr=>{
      const tile = planet.getTile(parseInt(idStr,10));
      if(tile){ tile.neighbors = neighborObj[idStr].map(n=>parseInt(n,10)); }
    });
  }

  // Generate tectonic plates and elevations using the now-initialized RandomService.
  // Calculate numPlates based on numPoints (planetSettings.numPoints)
  // Linear relationship: (480 points, 4 plates), (128000 points, 32 plates)
  // const N = planetSettings.numPoints;
  // const m = (32 - 4) / (128000 - 480); // slope
  // const c_intercept = 4 - m * 480; // y-intercept
  // let calculatedNumPlates = m * N + c_intercept;
  // calculatedNumPlates = Math.round(calculatedNumPlates);
  // calculatedNumPlates = Math.max(4, Math.min(32, calculatedNumPlates)); // Clamp between 4 and 32

  // TODO: Make number of tectonic plates slightly random in relation to the number of points.
  // For example, add a small random +/- variation to calculatedNumPlates, ensuring it stays within reasonable min/max bounds.

  // Use the value directly from planetSettings, which is controlled by the UI slider
  let numPlatesToUse = planetSettings.numPlates;
  // Ensure it's within a reasonable range if not already clamped by UI/constants
  // (Assuming PLANET_TECHTONIC_PLATES_MIN and PLANET_TECHTONIC_PLATES_MAX are defined and used by the slider)
  // For safety, we can re-apply a clamp here if needed, though ideally the constants are the source of truth.
  // numPlatesToUse = Math.max(PLANET_TECHTONIC_PLATES_MIN || 2, Math.min(numPlatesToUse, PLANET_TECHTONIC_PLATES_MAX || 50));
  // The SliderControl in ui/index.js already uses PLANET_TECHTONIC_PLATES_MIN and PLANET_TECHTONIC_PLATES_MAX from Const,
  // so planetSettings.numPlates should already be within this valid range.

  // generatePlates will internally use RandomService for its random choices.
  const { plates, tilePlate } = generatePlates(planet, numPlatesToUse);

  // Store tilePlate mapping in mainMesh for coloring later
  if(mainMesh){
    mainMesh.userData.tilePlate = tilePlate;
    // Generate plate colors using the seeded PRNG for consistency.
    const plateColors = {};
    plates.forEach(p=>{
      // Use the functional API for reproducible colors if the seed is the same.
      const color = new THREE.Color().setHSL(nextFloat(), 0.6, 0.5);
      plateColors[p.id] = color.getHex();
    });
    mainMesh.userData.plateColors = plateColors;
  }

  // Re-classify terrain for each tile and update mesh colors
  if (mainMesh && mainMesh.geometry.getAttribute('color')) {
    const colorsAttribute = mainMesh.geometry.getAttribute('color');
    const idsAttribute = mainMesh.geometry.getAttribute('tileId'); 
    const newTileTerrain = {}; 

    // First, update terrain type for each tile in the planet object
    planet.tiles.forEach(tile => {
      // Use the new classification function that takes the whole tile object
      const newTerrainId = classifyTileTerrainFromProperties(tile);
      tile.terrain = terrainById(newTerrainId); 
      newTileTerrain[tile.id] = newTerrainId; 
    });
    mainMesh.userData.tileTerrain = newTileTerrain; 

    // After all tile properties (elevation, moisture, final terrain ID) are set,
    // calculate and store the definitive color for each tile.
    planet.tiles.forEach(tile => {
      if (tile.terrain && tile.terrain.id) { // Ensure terrain and its id are set
        // console.log(`Coloring Tile ID: ${tile.id}, Terrain ID: ${tile.terrain.id}, Elevation: ${tile.elevation}`); // DEBUG LINE - Commented out
        // Use getColorForTerrain with the tile's actual elevation
        tile.color = getColorForTerrain(tile.terrain.id, tile.elevation);
        // console.log(`Assigned color: 0x${tile.color.toString(16)}`); // DEBUG LINE - Commented out
      } else {
        tile.color = 0x808080; // Default grey if terrain is not properly set
        // console.warn(`Tile ${tile.id} missing terrain or terrain.id for color calculation. Defaulting to grey.`); // DEBUG LINE - Commented out, can be re-enabled if needed
      }
      // Optionally, update mainMesh.userData.tileColors if it's used directly elsewhere.
      // This might be redundant if rendering always pulls from planet.tiles[tileId].color.
      if (mainMesh && mainMesh.userData.tileColors) { // Assuming tileColors is an object {[id]: color}
          mainMesh.userData.tileColors[tile.id] = tile.color;
      }
    });

    // Update vertex colors
    const tempColor = new THREE.Color(); // For color conversion

    if (planetSettings.viewMode === 'temperature') {
      for (let i = 0; i < idsAttribute.count; i++) {
        const tileId = idsAttribute.getX(i);
        const tile = planet.getTile(tileId);
        if (tile && tile.temperature !== undefined) {
          tempColor.setHex(getColorForTemperature(tile.temperature));
          colorsAttribute.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
        }
      }
    } else if (planetSettings.viewMode === 'elevation') {
      for (let i = 0; i < idsAttribute.count; i++) {
        const tileId = idsAttribute.getX(i);
        const tile = planet.getTile(tileId); 
        const elev = tile ? tile.elevation : (mainMesh.userData.tileElevation ? mainMesh.userData.tileElevation[tileId] : 0);
        const biasedElev = elev + planetSettings.elevationBias;
        if (biasedElev < -0.5) tempColor.setHex(0x0000FF); 
        else if (biasedElev < 0) tempColor.setHex(0x00BFFF); 
        else if (biasedElev < 0.3) tempColor.setHex(0x90EE90); 
        else if (biasedElev < 0.6) tempColor.setHex(0x32CD32); 
        else tempColor.setHex(0x8B4513); 
        colorsAttribute.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
      }
    } else if (planetSettings.viewMode === 'moisture') {
      for (let i = 0; i < idsAttribute.count; i++) {
        const tileId = idsAttribute.getX(i);
        const tile = planet.getTile(tileId);
        if (tile && tile.moisture !== undefined) {
            tempColor.setHex(getColorForMoisture(tile.moisture));
            colorsAttribute.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
        } else {
            colorsAttribute.setXYZ(i, 0.5, 0.5, 0.5); 
        }
      }
    } else if (planetSettings.viewMode === 'plates') {
      for (let i = 0; i < idsAttribute.count; i++) {
        const tileId = idsAttribute.getX(i); 
        const plateId = mainMesh.userData.tilePlate ? mainMesh.userData.tilePlate[tileId] : null;
        if (plateId !== null && mainMesh.userData.plateColors && mainMesh.userData.plateColors[plateId] !== undefined) {
            tempColor.setHex(mainMesh.userData.plateColors[plateId]);
            colorsAttribute.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
        } else {
            colorsAttribute.setXYZ(i, 0.3, 0.3, 0.3); // Default color for unassigned/missing plate color
        }
      }
    } else { // Default to terrain view
      for (let i = 0; i < idsAttribute.count; i++) {
        const tileId = idsAttribute.getX(i);
        const tile = planet.getTile(tileId); // Get the tile object
        if (tile && tile.color !== undefined) { // Check if the tile and its pre-calculated color exist
            tempColor.setHex(tile.color); // Use the stored tile.color
            colorsAttribute.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
        } else {
            // Fallback for missing tile or if tile.color was somehow not set
            colorsAttribute.setXYZ(i, 0.2, 0.2, 0.2); 
        }
      }
    }
    colorsAttribute.needsUpdate = true; // IMPORTANT: Notify Three.js to update the colors
  }

  if(mainMesh){
    const tileElevation = {};
    const tileMoisture = {};
    planet.tiles.forEach(tile=>{
      tileElevation[tile.id] = tile.elevation;
      tileMoisture[tile.id] = tile.moisture;
    });
    mainMesh.userData.tileElevation = tileElevation;
    mainMesh.userData.tileMoisture = tileMoisture;
  }

  meshGroup.userData.planet = planet;
  // meshGroup.userData.actualSeed = effectiveSeed; // Store seed in userData for easy access

  // Add trees to qualifying tiles using optimized system
  
  // Get polygon vertices from mesh if available (only for Voronoi mode)
  const tilePolygonVertices = mainMesh && mainMesh.userData.tilePolygonVertices ? mainMesh.userData.tilePolygonVertices : {};
  
  // Create an array of tile data for tree generation
  const tilesForTrees = [];
  planet.tiles.forEach(tile => {
    if (shouldHaveTrees(tile.terrain.id)) {
      // Convert tile center from normalized coordinates to world coordinates
      const worldCenter = {
        x: tile.center[0] * config.radius,
        y: tile.center[1] * config.radius,
        z: tile.center[2] * config.radius
      };
      
      // Get polygon vertices for this tile if available and convert to world coordinates
      let polygonVertices = null;
      if (tilePolygonVertices[tile.id]) {
        polygonVertices = tilePolygonVertices[tile.id].map(vertex => ({
          x: vertex.x * config.radius,
          y: vertex.y * config.radius,
          z: vertex.z * config.radius
        }));
      }
      
      tilesForTrees.push({
        id: tile.id,
        terrainId: tile.terrain.id,
        center: worldCenter,
        area: tile.area || 0,
        polygonVertices: polygonVertices // Pass polygon vertices if available
      });
    }
  });



  // Add optimized trees to the scene
  if (tilesForTrees.length > 0) {
    const treeResult = addTreesToScene(tilesForTrees, meshGroup);
    
    // Store tree data for potential cleanup
    meshGroup.userData.treeData = treeResult;
    
    if (treeResult.stats) {
      console.log(`[Trees] Generated ${treeResult.stats.totalTrees} trees using instanced rendering (Memory: ${(treeResult.stats.memoryUsage / 1024 / 1024).toFixed(2)} MB)`);
    }
  } else {
    console.log(`[Trees] No forest tiles found - no trees generated`);
  }

  return { meshGroup, planet, config };
} 