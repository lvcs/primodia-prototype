import * as THREE from 'three';
import Plate from './model/Plate.js';

// Utility hash-based pseudo-noise (simple and fast)
function noise3(x, y, z) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719);
  return s - Math.floor(s); // Returns a value between 0 and 1
}

// Fractional Brownian Motion (fBm) noise for more natural-looking terrain variations
function fbmNoise(vec, octaves = 4) {
  let total = 0;
  let frequency = 1;
  let amplitude = 0.5;
  const persistence = 0.5; // How much detail is added with each octave

  for (let i = 0; i < octaves; i++) {
    total += noise3(vec.x * frequency, vec.y * frequency, vec.z * frequency) * amplitude;
    frequency *= 2; // Double frequency for finer detail
    amplitude *= persistence; // Reduce amplitude for finer detail
  }
  return total; // Typically 0 to ~1, sum of amplitudes
}

/**
 * Generates tectonic plates, assigns tiles to them, and calculates tile elevations
 * based on plate interactions and noise, following principles from Red Blob Games.
 * @param {import('./model/WorldGlobe.js').default} globe The world globe object containing tiles.
 * @param {number} numPlates The desired number of tectonic plates.
 * @returns {{plates: Plate[], tilePlate: Object}} An object containing the list of plates and a map of tile IDs to plate IDs.
 */
export function generatePlates(globe, numPlates = 16) {
  const tileIds = Array.from(globe.tiles.keys());
  if (tileIds.length === 0) {
    console.warn("No tiles in globe to generate plates for.");
    return { plates: [], tilePlate: {} };
  }

  // 1. Create Plates: Randomly select seed tiles for each plate.
  const seedIds = [];
  const availableTileIds = [...tileIds]; // Clone to allow modification
  while (seedIds.length < numPlates && availableTileIds.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableTileIds.length);
    const candidate = availableTileIds.splice(randomIndex, 1)[0]; // Remove to avoid duplicates
    seedIds.push(candidate);
  }
  if (seedIds.length < numPlates) {
    console.warn(`Could only create ${seedIds.length} plates out of ${numPlates} requested.`);
  }

  const plates = seedIds.map((seedId, idx) => {
    const seedTile = globe.getTile(seedId);
    if (!seedTile) { // Should not happen if tileIds are valid
        console.error("Seed tile not found for ID:", seedId);
        // Provide a fallback Plate to prevent crashes, though this indicates a deeper issue
        return new Plate({ id: idx, seedTileId: seedId, center: [0,0,0], motion: [0,0,0], isOceanic: true, baseElevation: -0.5 });
    }
    const center = seedTile.center;
    // Generate a random motion vector for the plate, tangent to the sphere surface at its center.
    const randomVec = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    const motion = new THREE.Vector3().fromArray(center).cross(randomVec).normalize(); // Cross product ensures perpendicular motion vector

    // Determine if the plate is oceanic or continental and assign a base elevation.
    // These values are inspired by typical Earth elevations.
    const isOceanic = Math.random() < 0.7; // 70% chance of being an oceanic plate
    const baseElevation = isOceanic
      ? (Math.random() * 0.3 - 0.6) // Oceanic: -0.6 to -0.3 (deeper)
      : (Math.random() * 0.2 + 0.05); // Continental: 0.05 to 0.25 (higher)

    return new Plate({
      id: idx,
      seedTileId: seedId,
      center,
      motion: [motion.x, motion.y, motion.z],
      isOceanic,
      baseElevation
    });
  });

  // Helper to convert [x,y,z] array to THREE.Vector3
  const vec3From = (arr) => new THREE.Vector3(arr[0], arr[1], arr[2]);

  // 2. Assign Tiles to Plates: Use a random-order flood fill (BFS) for organic plate shapes.
  const tilePlate = {}; // Maps tileId to plateId
  const queue = [];

  plates.forEach(plate => {
    if (globe.getTile(plate.seedTileId)) { // Ensure seed tile exists before adding to queue
        tilePlate[plate.seedTileId] = plate.id;
        queue.push(plate.seedTileId);
    }
  });

  while (queue.length > 0) {
    const randIdx = Math.floor(Math.random() * queue.length);
    const currentTileId = queue.splice(randIdx, 1)[0];
    const currentPlateId = tilePlate[currentTileId];
    const tile = globe.getTile(currentTileId);

    if (!tile) continue;

    tile.neighbors.forEach(neighborId => {
      if (tilePlate[neighborId] === undefined) { // If neighbor not yet assigned
        tilePlate[neighborId] = currentPlateId;
        queue.push(neighborId);
      }
    });
  }

  // Apply plate IDs to tile objects
  globe.tiles.forEach(tile => {
    tile.plate = tilePlate[tile.id];
    if (tile.plate === undefined) {
        // This might happen if some tiles are disconnected from all seed points.
        // Assign to a default plate or handle as an error. For now, assign to plate 0 if it exists.
        // console.warn(`Tile ${tile.id} was not assigned to any plate. Assigning to plate 0 or leaving undefined.`);
        if (plates.length > 0) tile.plate = 0;
    }
  });

  // 3. (Optional but good) Recalculate Plate Centers: Based on the average position of their assigned tiles.
  plates.forEach(p => {
    const assignedTileCenters = [];
    globe.tiles.forEach(tile => {
      if (tile.plate === p.id) {
        assignedTileCenters.push(vec3From(tile.center));
      }
    });

    if (assignedTileCenters.length > 0) {
      const averageCenter = new THREE.Vector3();
      assignedTileCenters.forEach(centerVec => averageCenter.add(centerVec));
      averageCenter.divideScalar(assignedTileCenters.length).normalize();
      p.center = [averageCenter.x, averageCenter.y, averageCenter.z];
    }
  });


  // 4. Assign Tile Elevations based on Plate Interactions and Noise
  // Constants for elevation effects, inspired by Red Blob Games article's logic.
  // These values define the "target" elevation for different geological features.
  const STRONG_CONVERGENCE_THRESHOLD = -0.4; // How much plates must push together for major features. (Article used -0.75, this is less extreme)
  const MOUNTAIN_ELEVATION = 0.7;            // Elevation for major mountain ranges.
  const COASTLINE_LOWER_ELEVATION = 0.0;     // Elevation for coastlines on the edge of land plates (e.g. beaches).
  const COASTLINE_HIGHER_ELEVATION = -0.15;   // Elevation for coastlines on edge of ocean plates (e.g. continental shelf / shallow ridges).
  const OCEAN_RIDGE_ELEVATION = -0.1;        // Elevation for mid-ocean ridges (O+O strong convergence).
  const DEEP_OCEAN_TRENCH_OFFSET = -0.3;     // Added to ocean plate base for trenches.
  const DEFAULT_OCEAN_FLOOR = -0.4;          // Typical ocean floor depth for O+O non-strong convergence.

  // Elevation priorities: Higher number means this feature "wins" over lower priority ones.
  const PRIORITY_BASE = 0;
  const PRIORITY_OCEAN_FLOOR = 1;
  const PRIORITY_COAST_RIDGE_TRENCH = 2;
  const PRIORITY_MOUNTAIN = 3;

  globe.tiles.forEach(tile => {
    const currentPlate = plates[tile.plate];
    if (!currentPlate) {
      // Should be handled by the assignment logic above, but as a fallback:
      tile.elevation = 0;
      // console.warn(`Tile ${tile.id} has no plate assigned during elevation calculation.`);
      return;
    }

    let finalElevation = currentPlate.baseElevation;
    let maxPriority = PRIORITY_BASE;
    let isBoundaryTile = false;
    const tileCenterVec = vec3From(tile.center);

    tile.neighbors.forEach(neighborId => {
      const neighborTile = globe.getTile(neighborId);
      if (!neighborTile || neighborTile.plate === tile.plate) {
        return; // Skip if same plate or neighbor doesn't exist
      }

      isBoundaryTile = true;
      const neighborPlate = plates[neighborTile.plate];
      if (!neighborPlate) return; // Skip if neighbor plate doesn't exist

      // Calculate convergence: Negative means converging, Positive means diverging.
      const plate1Motion = vec3From(currentPlate.motion);
      const plate2Motion = vec3From(neighborPlate.motion);
      const boundaryNormal = vec3From(neighborTile.center).sub(tileCenterVec).normalize(); // From current tile to neighbor tile
      const relativeMotion = plate1Motion.clone().sub(plate2Motion);
      const convergenceScore = relativeMotion.dot(boundaryNormal);

      const isStrongConvergence = convergenceScore < STRONG_CONVERGENCE_THRESHOLD;
      const cpIsOceanic = currentPlate.isOceanic;
      const npIsOceanic = neighborPlate.isOceanic;

      let candidateElevation = currentPlate.baseElevation;
      let candidatePriority = PRIORITY_BASE;

      // Determine elevation based on Red Blob Games' simplified rules:
      if (!cpIsOceanic && !npIsOceanic) { // Land + Land
        if (isStrongConvergence) {
          candidateElevation = MOUNTAIN_ELEVATION;
          candidatePriority = PRIORITY_MOUNTAIN;
        }
        // Else: "do nothing" (tile keeps its plate's baseElevation), priority remains PRIORITY_BASE.
      } else if (!cpIsOceanic && npIsOceanic) { // Current: Land, Neighbor: Ocean
        if (isStrongConvergence) { // Land over Ocean -> Coastal Mountains on land side
          candidateElevation = MOUNTAIN_ELEVATION;
          candidatePriority = PRIORITY_MOUNTAIN;
        } else { // "Coastline"
          candidateElevation = COASTLINE_LOWER_ELEVATION;
          candidatePriority = PRIORITY_COAST_RIDGE_TRENCH;
        }
      } else if (cpIsOceanic && !npIsOceanic) { // Current: Ocean, Neighbor: Land
        if (isStrongConvergence) { // Ocean under Land -> Trench on ocean side
          candidateElevation = currentPlate.baseElevation + DEEP_OCEAN_TRENCH_OFFSET;
          candidatePriority = PRIORITY_COAST_RIDGE_TRENCH;
        } else { // "Coastline"
          candidateElevation = COASTLINE_HIGHER_ELEVATION;
          candidatePriority = PRIORITY_COAST_RIDGE_TRENCH;
        }
      } else { // Ocean + Ocean
        if (isStrongConvergence) { // Oceanic Ridge / Islands
          candidateElevation = OCEAN_RIDGE_ELEVATION;
          candidatePriority = PRIORITY_COAST_RIDGE_TRENCH;
        } else { // "Ocean" floor
          candidateElevation = DEFAULT_OCEAN_FLOOR;
          candidatePriority = PRIORITY_OCEAN_FLOOR;
        }
      }

      // Update finalElevation if this interaction has higher priority,
      // or same priority but results in a more "extreme" (usually higher) elevation.
      if (candidatePriority > maxPriority) {
        maxPriority = candidatePriority;
        finalElevation = candidateElevation;
      } else if (candidatePriority === maxPriority && candidatePriority > PRIORITY_BASE) {
        // For ties in priority (e.g. two mountain-forming interactions), pick the higher elevation.
        // For coast/ridge/trench ties, also pick higher (favors ridges over trenches if priorities accidentally match).
        finalElevation = Math.max(finalElevation, candidateElevation);
      }
    }); // End neighbor loop

    if (!isBoundaryTile) {
      // Interior tile: Apply FBM noise to the plate's base elevation.
      // Noise range approx -0.1 to +0.1 for fbmNoise*0.2-0.1
      const noiseVal = fbmNoise(tileCenterVec, 4) * 0.2 - 0.1;
      finalElevation = currentPlate.baseElevation + noiseVal;
    }
    
    // Clamp elevation to be within [-1, 1] range.
    tile.elevation = Math.max(-1.0, Math.min(1.0, finalElevation));
  }); // End tiles loop

  // 5. Smooth Elevations: Apply a few passes of simple averaging with neighbors.
  // This helps blend harsh transitions and create more natural slopes.
  const smoothingPasses = 3;
  for (let pass = 0; pass < smoothingPasses; pass++) {
    const newElevations = new Map();
    globe.tiles.forEach(tile => {
      let elevationSum = tile.elevation;
      let neighborCount = 1;
      tile.neighbors.forEach(neighborId => {
        const neighborTile = globe.getTile(neighborId);
        if (neighborTile) {
          elevationSum += neighborTile.elevation;
          neighborCount++;
        }
      });
      newElevations.set(tile.id, elevationSum / neighborCount);
    });

    // Blend current elevation with the new smoothed elevation to retain some features.
    globe.tiles.forEach(tile => {
      tile.elevation = (tile.elevation * 0.6) + (newElevations.get(tile.id) * 0.4);
    });
  }

  // 6. Assign Moisture (Simple placeholder logic)
  // This is a very basic model; more sophisticated climate simulation would be needed for realistic moisture.
  const plateMoistureBase = plates.map(() => Math.random() * 0.6 + 0.2); // Base moisture per plate (0.2-0.8)
  globe.tiles.forEach(tile => {
    if (tile.plate === undefined || !plates[tile.plate]) {
        tile.moisture = 0.5; // Default if plate info is missing
        return;
    }
    const baseMoisture = plateMoistureBase[tile.plate];
    // Add some noise based on location for variation within a plate.
    const moistureNoise = noise3(tile.center[0] * 23.4, tile.center[1] * 17.8, tile.center[2] * 11.2) * 0.4 - 0.2; // Range -0.2 to 0.2
    tile.moisture = Math.max(0, Math.min(1, baseMoisture + moistureNoise));
  });

  return { plates, tilePlate };
} 