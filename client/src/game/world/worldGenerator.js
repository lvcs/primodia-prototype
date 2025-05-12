import * as THREE from 'three';
import { generatePlanetGeometryGroup, sphereSettings, classifyTerrain } from './planetSphereVoronoi.js';
import WorldGlobe from './model/WorldGlobe.js';
import Tile from './model/Tile.js';
import { terrainById } from './registries/TerrainRegistry.js';

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
    const center = sums[id].divideScalar(counts[id]).normalize();
    const lat = THREE.MathUtils.radToDeg(Math.asin(center.y));
    const lon = THREE.MathUtils.radToDeg(Math.atan2(center.z, center.x));
    const terrId = tileTerrain[id] || classifyTerrain(center);
    const terrain = terrainById(terrId) || terrainById('PLAINS');
    globe.addTile(new Tile({ id, terrain, lat, lon }));
  });

  meshGroup.userData.globe = globe;
  return { meshGroup, globe, config };
} 