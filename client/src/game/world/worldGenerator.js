import * as THREE from 'three';
import { generatePlanetGeometryGroup, sphereSettings, classifyTerrain, classifyTileTerrainFromProperties, DEFAULT_VIEW_MODE } from './planetSphereVoronoi.js';
import WorldGlobe from './model/WorldGlobe.js';
import Tile from './model/Tile.js';
import { terrainById, Terrains, getColorForTerrain } from './registries/TerrainRegistry.js';
import { getColorForTemperature } from './registries/TemperatureRegistry.js';
import { getColorForMoisture } from './registries/MoistureRegistry.js';
import { generatePlates } from './platesGenerator.js';
import RandomService from '@game/core/RandomService';
import * as Const from '@config/gameConfig';

// All radius values are now in kilometers (1 unit = 1 km)

/**
 * Generates globe mesh (legacy) plus OO WorldGlobe description.
 * @param {{radius:number, sphereSettings?:object}} config
 * @returns {{ meshGroup: THREE.Group, globe: WorldGlobe, config: any, actualSeed: string }}
 */
export function generateWorld(config, seed){
  try {
    console.log('Starting generateWorld with config:', JSON.stringify(config));
    
    // If config contains sphereSettings, use it to override the global sphereSettings object
    if (config.sphereSettings) {
      console.log('Using config.sphereSettings to update sphereSettings');
      Object.assign(sphereSettings, config.sphereSettings);
      console.log('Updated sphereSettings:', JSON.stringify(sphereSettings));
    }
    
    if (!config.radius) {
      console.error('Error: No radius in config for generateWorld');
      config.radius = Const.GLOBE_RADIUS;
      console.log('Using default GLOBE_RADIUS:', config.radius);
    }
    
    // Set up random seed for planet generation
    let actualSeed = seed || config.seed || String(Date.now());
    RandomService.setSeed(actualSeed);
    console.log('Using seed for planet generation:', actualSeed);
    
    // Generate the geometry for the planet
    console.log('Generating planet geometry with numPoints:', sphereSettings.numPoints);
    const { result, terrainMap, tileToPlateMap, plateColors } = generatePlanetGeometryGroup(config.radius, sphereSettings);
    
    if (!result || !result.children || result.children.length === 0) {
      console.error('Error: generatePlanetGeometryGroup returned empty or invalid result');
      return null;
    }
    
    console.log('Planet geometry successfully generated with children:', result.children.length);
    
    // Create the WorldGlobe OO model
    console.log('Creating WorldGlobe object model');
    const globe = new WorldGlobe(config.radius);
    
    // Set up the tiles for the WorldGlobe
    console.log('Setting up tiles for WorldGlobe');
    const mainMesh = result.children.find(child => child.userData && child.userData.isMainMesh);
    if (!mainMesh) {
      console.error('Error: Main mesh not found in generatePlanetGeometryGroup result');
      return { meshGroup: result, globe, config, actualSeed };
    }
    
    // Create and return the final world data
    const worldData = {
      meshGroup: result,
      globe,
      config,
      actualSeed
    };
    
    console.log('World generation successful!');
    return worldData;
  } catch (error) {
    console.error('Error in generateWorld:', error);
    // Return null to indicate failure, let the calling function handle the fallback
    return null;
  }
} 