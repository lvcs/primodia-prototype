import * as THREE from 'three';
import { generatePlanetGeometryGroup, sphereSettings, classifyTerrain } from './planetSphereVoronoi.js';
import WorldGlobe from './model/WorldGlobe.js';
import Tile from './model/Tile.js';
import { terrainById } from './registries/TerrainRegistry.js';
import { generatePlates } from './platesGenerator.js';

/**
 * Generates globe mesh (legacy) plus OO WorldGlobe description.
 * @param {{radius:number}} config
 * @returns {{ meshGroup: THREE.Group, globe: WorldGlobe, config: any }}
 */
export function generateWorld(config){
  const meshGroup = generatePlanetGeometryGroup(config);
  const mainMesh = meshGroup.children.find(c=>c.userData && c.userData.isMainMesh);
  if(!mainMesh){
    return { meshGroup, globe:null, config };
  }
  const idsAttr = mainMesh.geometry.getAttribute('tileId');
  const posAttr = mainMesh.geometry.getAttribute('position');
  const tileTerrain = mainMesh.userData.tileTerrain || {};

  const globe = new WorldGlobe({
    drawMode: sphereSettings.drawMode,
    algorithm: sphereSettings.algorithm,
    numTiles: sphereSettings.numPoints,
    jitter: sphereSettings.jitter,
    size: config.radius,
    rotation: sphereSettings.rotation
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
    globe.addTile(new Tile({ id, terrain, center, neighbors: [] }));
  });

  // Use neighbor map from mesh if provided
  if(mainMesh && mainMesh.userData.tileNeighbors){
    const neighborObj = mainMesh.userData.tileNeighbors;
    Object.keys(neighborObj).forEach(idStr=>{
      const tile = globe.getTile(parseInt(idStr,10));
      if(tile){ tile.neighbors = neighborObj[idStr].map(n=>parseInt(n,10)); }
    });
  }

  // Generate tectonic plates and elevations
  const numPlates = sphereSettings.numPlates || 16;
  const { plates, tilePlate } = generatePlates(globe, numPlates);

  // Store tilePlate mapping in mainMesh for coloring later
  if(mainMesh){
    mainMesh.userData.tilePlate = tilePlate;
    // Generate plate colors
    const plateColors = {};
    plates.forEach(p=>{
      const color = new THREE.Color().setHSL(Math.random(), 0.6, 0.5);
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