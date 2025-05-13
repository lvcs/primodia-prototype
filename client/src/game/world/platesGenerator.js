import * as THREE from 'three';
import Plate from './model/Plate.js';

// Utility hash-based pseudo-noise
function noise3(x, y, z) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719);
  return s - Math.floor(s);
}

function fbmNoise(vec, octaves = 4) {
  let total = 0;
  let freq = 1;
  let amp = 0.5;
  for (let i = 0; i < octaves; i++) {
    total += noise3(vec.x * freq, vec.y * freq, vec.z * freq) * amp;
    freq *= 2;
    amp *= 0.5;
  }
  return total; // 0..~1
}

/**
 * Partition globe into tectonic plates and assign elevations & plate ids.
 * @param {import('./model/WorldGlobe.js').default} globe
 * @param {number} numPlates
 * @returns {{plates: Plate[], tilePlate: Object}}
 */
export function generatePlates(globe, numPlates = 16) {
  const tileIds = Array.from(globe.tiles.keys());
  if (tileIds.length === 0) {
    return { plates: [], tilePlate: {} };
  }

  // Pick random seed tiles
  const seedIds = [];
  while (seedIds.length < numPlates && seedIds.length < tileIds.length) {
    const candidate = tileIds[Math.floor(Math.random() * tileIds.length)];
    if (!seedIds.includes(candidate)) seedIds.push(candidate);
  }

  // Build Plate objects
  const plates = seedIds.map((seedId, idx) => {
    const seedTile = globe.getTile(seedId);
    const center = seedTile.center;
    // Random motion direction perpendicular to center vector to keep tangent motion
    const randomVec = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    const motion = new THREE.Vector3().fromArray(center)
      .cross(randomVec) // cross to get tangent
      .normalize();
    return new Plate({ id: idx, seedTileId: seedId, center, motion: [motion.x, motion.y, motion.z] });
  });

  // Helper convert array to Vector3 quickly
  function vec3From(arr) {
    return new THREE.Vector3(arr[0], arr[1], arr[2]);
  }

  // Assign tiles to plates using random flood-fill for contiguous, organic regions
  const tilePlate = {};
  const queue = [];

  // Seed queue with plate seeds
  seedIds.forEach((seedId, idx) => {
    tilePlate[seedId] = idx;
    queue.push(seedId);
  });

  // Random-order BFS
  while(queue.length) {
    const randIdx = Math.floor(Math.random() * queue.length);
    const currentId = queue.splice(randIdx, 1)[0];
    const currentPlate = tilePlate[currentId];
    const tile = globe.getTile(currentId);
    if(!tile) continue;
    tile.neighbors.forEach(nId => {
      if(tilePlate[nId] === undefined){
        tilePlate[nId] = currentPlate;
        queue.push(nId);
      }
    });
  }

  // Apply plate ids to tiles
  globe.tiles.forEach(tile => { tile.plate = tilePlate[tile.id]; });

  // Update plate centers to average of assigned tiles
  plates.forEach(p=>{
    const accum = new THREE.Vector3();
    let count = 0;
    globe.tiles.forEach(tile=>{
      if(tile.plate===p.id){
        accum.add(new THREE.Vector3(tile.center[0], tile.center[1], tile.center[2]));
        count++;
      }
    });
    if(count>0){
      accum.divideScalar(count).normalize();
      p.center = [accum.x, accum.y, accum.z];
    }
  });

  // Build adjacency neighbor lists if not present to detect boundaries
  if (globe.tiles.values().next().value && !globe.tiles.values().next().value.neighbors.length) {
    // We cannot compute neighbors here; expected to be filled elsewhere.
  }

  // Assign base elevation per plate (range -0.3 .. 0.3)
  const plateBaseElev = plates.map(()=> (Math.random()*0.6 - 0.3));

  // Elevation assignment
  globe.tiles.forEach(tile => {
    // Determine if tile is at a plate boundary by checking neighbor plates
    const isBoundary = tile.neighbors.some(nId => globe.getTile(nId)?.plate !== tile.plate);
    if (isBoundary) {
      // Determine convergent/divergent based on average neighbor plate motion vs tile plate motion
      let divergence = 0;
      const plate = plates[tile.plate];
      const plateMotion = vec3From(plate.motion);

      tile.neighbors.forEach(nId => {
        const nTile = globe.getTile(nId);
        if (!nTile) return;
        if (nTile.plate !== tile.plate) {
          const nMotion = vec3From(plates[nTile.plate].motion);
          divergence += plateMotion.dot(nMotion);
        }
      });
      const avgDiv = divergence / (tile.neighbors.length || 1);
      if (avgDiv < -0.25) {
        // convergent -> mountain
        tile.elevation = Math.min(1, 0.5 + Math.abs(avgDiv));
      } else if (avgDiv > 0.25) {
        // divergent -> trench
        tile.elevation = Math.max(-1, -0.5 - Math.abs(avgDiv));
      } else {
        tile.elevation = plateBaseElev[tile.plate];
      }
    } else {
      const local = fbmNoise(new THREE.Vector3(tile.center[0], tile.center[1], tile.center[2])) * 0.3; // -0.3..0.3
      tile.elevation = plateBaseElev[tile.plate] + local;
    }
    tile.elevation = Math.max(-1, Math.min(1, tile.elevation));
  });

  // Simple erosion/smoothing: weighted average with neighbors, 3 passes
  for(let pass=0; pass<3; pass++){
    const newElev = new Map();
    globe.tiles.forEach(tile=>{
      let sum = tile.elevation;
      let count = 1;
      tile.neighbors.forEach(nId=>{
        const nTile = globe.getTile(nId);
        if(nTile){ sum += nTile.elevation; count++; }
      });
      newElev.set(tile.id, sum / count);
    });
    globe.tiles.forEach(tile=>{
      tile.elevation = (tile.elevation + newElev.get(tile.id))*0.5; // blend to keep features
    });
  }

  // Assign moisture per plate (simple)
  const plateMoist = plates.map(()=>Math.random());
  globe.tiles.forEach(tile=>{
    const base = plateMoist[tile.plate];
    const noise = noise3(tile.center[0]*23, tile.center[1]*17, tile.center[2]*11)*0.4 - 0.2;
    tile.moisture = Math.min(1, Math.max(0, base + noise));
  });

  return { plates, tilePlate };
} 