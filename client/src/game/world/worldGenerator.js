import * as THREE from 'three';
import { generatePlanetGeometryGroup, sphereSettings, classifyTerrain } from './planetSphereVoronoi.js';
import WorldGlobe from './model/WorldGlobe.js';
import Tile from './model/Tile.js';
import { terrainById } from './registries/TerrainRegistry.js';
import { generatePlates } from './platesGenerator.js';
import RandomService from '../core/RandomService.js';

/**
 * Generates globe mesh (legacy) plus OO WorldGlobe description.
 * @param {{radius:number}} config
 * @returns {{ meshGroup: THREE.Group, globe: WorldGlobe, config: any }}
 */
export function generateWorld(config, seed){
  // Initialize the global random service with the provided seed.
  // All subsequent procedural generation steps will use this seeded PRNG.
  RandomService.initialize(seed);

  // Bind RandomService.nextFloat for convenience where needed in this scope or passed down
  const randomFloat = RandomService.nextFloat.bind(RandomService);

  const meshGroup = generatePlanetGeometryGroup(config);
  const mainMesh = meshGroup.children.find(c=>c.userData && c.userData.isMainMesh);
  if(!mainMesh){
    return { meshGroup, globe:null, config };
  }
  const idsAttr = mainMesh.geometry.getAttribute('tileId');
  const posAttr = mainMesh.geometry.getAttribute('position');
  const tileTerrain = mainMesh.userData.tileTerrain || {};
  const tileSphericalExcesses = mainMesh.userData.tileSphericalExcesses || {}; // Get excesses
  const sphereRadius = config.radius; // Actual radius of the sphere

  const globe = new WorldGlobe({
    drawMode: sphereSettings.drawMode,
    algorithm: sphereSettings.algorithm,
    numTiles: sphereSettings.numPoints,
    jitter: sphereSettings.jitter,
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
    const terrId = tileTerrain[id] || classifyTerrain(centerVec, randomFloat);
    const terrain = terrainById(terrId) || terrainById('PLAINS');
    
    // Calculate actual area
    const sphericalExcess = tileSphericalExcesses[id] !== undefined ? tileSphericalExcesses[id] : 0.0;
    const area = sphericalExcess * sphereRadius * sphereRadius;
    
    globe.addTile(new Tile({ id, terrain, center, neighbors: [], area }));
  });

  // Use neighbor map from mesh if provided
  if(mainMesh && mainMesh.userData.tileNeighbors){
    const neighborObj = mainMesh.userData.tileNeighbors;
    Object.keys(neighborObj).forEach(idStr=>{
      const tile = globe.getTile(parseInt(idStr,10));
      if(tile){ tile.neighbors = neighborObj[idStr].map(n=>parseInt(n,10)); }
    });
  }

  // Generate tectonic plates and elevations using the now-initialized RandomService.
  // Calculate numPlates based on numPoints (sphereSettings.numPoints)
  // Linear relationship: (480 points, 4 plates), (128000 points, 32 plates)
  const N = sphereSettings.numPoints;
  const m = (32 - 4) / (128000 - 480); // slope
  const c_intercept = 4 - m * 480; // y-intercept
  let calculatedNumPlates = m * N + c_intercept;
  calculatedNumPlates = Math.round(calculatedNumPlates);
  calculatedNumPlates = Math.max(4, Math.min(32, calculatedNumPlates)); // Clamp between 4 and 32

  // TODO: Make number of tectonic plates slightly random in relation to the number of points.
  // For example, add a small random +/- variation to calculatedNumPlates, ensuring it stays within reasonable min/max bounds.

  const numPlatesToUse = calculatedNumPlates;
  // generatePlates will internally use RandomService for its random choices.
  const { plates, tilePlate } = generatePlates(globe, numPlatesToUse);

  // Store tilePlate mapping in mainMesh for coloring later
  if(mainMesh){
    mainMesh.userData.tilePlate = tilePlate;
    // Generate plate colors using the seeded PRNG for consistency.
    const plateColors = {};
    plates.forEach(p=>{
      // Use RandomService for reproducible colors if the seed is the same.
      const color = new THREE.Color().setHSL(RandomService.nextFloat(), 0.6, 0.5);
      plateColors[p.id] = color.getHex();
    });
    mainMesh.userData.plateColors = plateColors;
  }

  if(mainMesh){
    const tileElevation = {};
    const tileMoisture = {};
    globe.tiles.forEach(tile=>{
      tileElevation[tile.id] = tile.elevation;
      tileMoisture[tile.id] = tile.moisture;
    });
    mainMesh.userData.tileElevation = tileElevation;
    mainMesh.userData.tileMoisture = tileMoisture;
  }

  meshGroup.userData.globe = globe;
  return { meshGroup, globe, config };
} 