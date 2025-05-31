import * as THREE from 'three';
import Plate from './Plate.js';
import RandomService from '@game/core/RandomService.js';
import {
  TECHTONICS_PLATE_OCEANIC_CHANCE,
  TECHTONICS_PLATE_OCEANIC_ELEVATION_MIN,
  TECHTONICS_PLATE_OCEANIC_ELEVATION_MAX,
  TECHTONICS_PLATE_CONTINENTAL_ELEVATION_MIN,
  TECHTONICS_PLATE_CONTINENTAL_ELEVATION_MAX,
  TECHTONICS_CONVERGENCE_STRONG_THRESHOLD,
  TECHTONICS_ELEVATION_MOUNTAIN,
  TECHTONICS_ELEVATION_COASTLINE_LOWER,
  TECHTONICS_ELEVATION_COASTLINE_HIGHER,
  TECHTONICS_ELEVATION_OCEAN_RIDGE,
  TECHTONICS_ELEVATION_DEEP_OCEAN_TRENCH_OFFSET,
  TECHTONICS_ELEVATION_DEFAULT_OCEAN_FLOOR,
  TECHTONICS_PRIORITY_BASE,
  TECHTONICS_PRIORITY_OCEAN_FLOOR,
  TECHTONICS_PRIORITY_COAST_RIDGE_TRENCH,
  TECHTONICS_PRIORITY_MOUNTAIN,
  TECHTONICS_SMOOTHING_PASSES,
  TECHTONICS_SMOOTHING_ORIGINAL_WEIGHT,
  TECHTONICS_SMOOTHING_AVERAGED_WEIGHT,
  TECHTONICS_NOISE3_X_MULTIPLIER,
  TECHTONICS_NOISE3_Y_MULTIPLIER,
  TECHTONICS_NOISE3_Z_MULTIPLIER,
  TECHTONICS_FBM_DEFAULT_OCTAVES,
  TECHTONICS_FBM_INITIAL_AMPLITUDE,
  TECHTONICS_FBM_PERSISTENCE,
  TECHTONICS_FBM_INITIAL_FREQUENCY,
  TECHTONICS_MOISTURE_PLATE_BASE_MIN,
  TECHTONICS_MOISTURE_PLATE_BASE_MAX,
  TECHTONICS_MOISTURE_NOISE_X_MULTIPLIER,
  TECHTONICS_MOISTURE_NOISE_Y_MULTIPLIER,
  TECHTONICS_MOISTURE_NOISE_Z_MULTIPLIER,
  TECHTONICS_MOISTURE_NOISE_AMPLITUDE,
  TECHTONICS_MOISTURE_DEFAULT_TILE,
  TECHTONICS_SEA_LEVEL,
  TECHTONICS_MOISTURE_EQUATOR_MAX,
  TECHTONICS_MOISTURE_30_DEG_MIN,
  TECHTONICS_MOISTURE_60_DEG_MID,
  TECHTONICS_MOISTURE_LATITUDE_WEIGHT,
  TECHTONICS_MOISTURE_PLATE_WEIGHT
} from './techtonicsConfig.js';

// Utility hash-based pseudo-noise (simple and fast)
// Generates a deterministic pseudo-random value between 0 and 1 based on 3D input coordinates.
// Uses sine function with arbitrary multipliers for chaotic behavior.
function noise3(x, y, z) {
  const s = Math.sin(x * TECHTONICS_NOISE3_X_MULTIPLIER + y * TECHTONICS_NOISE3_Y_MULTIPLIER + z * TECHTONICS_NOISE3_Z_MULTIPLIER);
  return s - Math.floor(s); // Returns a value between 0 and 1
}

// Fractional Brownian Motion (fBm) noise for more natural-looking terrain variations
// Combines multiple "octaves" of the basic noise3 function at different frequencies and amplitudes
// to create more complex and natural-looking patterns.
function fbmNoise(vec, octaves = TECHTONICS_FBM_DEFAULT_OCTAVES) {
  let total = 0;
  let frequency = TECHTONICS_FBM_INITIAL_FREQUENCY;
  let amplitude = TECHTONICS_FBM_INITIAL_AMPLITUDE;

  for (let i = 0; i < octaves; i++) {
    total += noise3(vec.x * frequency, vec.y * frequency, vec.z * frequency) * amplitude;
    frequency *= 2; // Double frequency for finer detail
    amplitude *= TECHTONICS_FBM_PERSISTENCE; // Reduce amplitude for finer detail
  }
  return total; // Typically 0 to ~1, sum of amplitudes
}

/**
 * Generates tectonic plates, assigns tiles to them, and calculates tile elevations
 * based on plate interactions and noise, following principles from Red Blob Games.
 * @param {import('@game/world/model/WorldPlanet.js').default} planet The world planet object containing tiles.
 * @param {number} numPlates The desired number of tectonic plates.
 * @returns {{plates: Plate[], tilePlate: Object}} An object containing the list of plates and a map of tile IDs to plate IDs.
 */
export function generatePlates(planet, numPlates = 16) {
  const tileIds = Array.from(planet.tiles.keys());
  if (tileIds.length === 0) {
    console.warn("No tiles in planet to generate plates for.");
    return { plates: [], tilePlate: {} };
  }

  // 1. Create Plates: Randomly select seed tiles for each plate.
  const seedIds = [];
  const availableTileIds = [...tileIds]; // Clone to allow modification
  RandomService.shuffleArray(availableTileIds);
  for (let i = 0; i < numPlates && i < availableTileIds.length; i++) {
    seedIds.push(availableTileIds[i]);
  }
  if (seedIds.length < numPlates) {
    console.warn(`Could only create ${seedIds.length} plates out of ${numPlates} requested (not enough unique tiles).`);
  }

  const plates = seedIds.map((seedId, idx) => {
    const seedTile = planet.getTile(seedId);
    if (!seedTile) {
        console.error("Seed tile not found for ID:", seedId);
        // Provide a fallback Plate to prevent crashes
        const fallbackMotion = new THREE.Vector3(RandomService.nextFloat() - 0.5, RandomService.nextFloat() - 0.5, RandomService.nextFloat() - 0.5).normalize();
        return new Plate({
            id: idx, seedTileId: seedId, center: [0,0,0], 
            motion: [fallbackMotion.x, fallbackMotion.y, fallbackMotion.z],
            isOceanic: RandomService.nextFloat() < TECHTONICS_PLATE_OCEANIC_CHANCE,
            baseElevation: TECHTONICS_PLATE_OCEANIC_ELEVATION_MIN 
        });
    }
    const center = seedTile.center;
    // Generate a random motion vector for the plate, tangent to the planet surface at its center.
    const randomVec = new THREE.Vector3(RandomService.nextFloat() - 0.5, RandomService.nextFloat() - 0.5, RandomService.nextFloat() - 0.5).normalize();
    const motion = new THREE.Vector3().fromArray(center).cross(randomVec).normalize(); // Cross product ensures perpendicular motion vector

    // Determine if the plate is oceanic or continental and assign a base elevation.
    const isOceanic = RandomService.nextFloat() < TECHTONICS_PLATE_OCEANIC_CHANCE;
    const baseElevation = isOceanic
      ? (RandomService.nextFloat() * (TECHTONICS_PLATE_OCEANIC_ELEVATION_MAX - TECHTONICS_PLATE_OCEANIC_ELEVATION_MIN) + TECHTONICS_PLATE_OCEANIC_ELEVATION_MIN)
      : (RandomService.nextFloat() * (TECHTONICS_PLATE_CONTINENTAL_ELEVATION_MAX - TECHTONICS_PLATE_CONTINENTAL_ELEVATION_MIN) + TECHTONICS_PLATE_CONTINENTAL_ELEVATION_MIN);

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
    if (planet.getTile(plate.seedTileId)) { // Ensure seed tile exists before adding to queue
        tilePlate[plate.seedTileId] = plate.id;
        queue.push(plate.seedTileId);
    }
  });

  // Shuffle the initial queue to make the flood fill order less dependent on plate creation order.
  RandomService.shuffleArray(queue);

  let head = 0; // Use a head index for efficient queue processing instead of splice
  while(head < queue.length) {
    // Randomly pick an item from the unprocessed part of the queue (from index head to queue.length - 1)
    const unprocessedCount = queue.length - head;
    // Generate a random index within the unprocessed part of the queue
    const randomIndexInUnprocessedPortion = Math.floor(RandomService.nextFloat() * unprocessedCount);
    const actualIndexInQueue = head + randomIndexInUnprocessedPortion;
    
    const selectedTileId = queue[actualIndexInQueue]; // Get the randomly selected tile

    // Swap this randomly selected tile with the element at the current 'head' position
    queue[actualIndexInQueue] = queue[head];
    queue[head] = selectedTileId; 
    // Now, queue[head] holds the selectedTileId, which we will process next.

    const currentTileId = queue[head]; // The tile to process
    const currentPlateId = tilePlate[currentTileId];
    const tile = planet.getTile(currentTileId);

    head++; // Advance head, as queue[head-1] (formerly queue[head]) is now being processed

    if (!tile) continue;

    // Create a mutable copy of neighbors and shuffle them for more local randomness
    const neighbors = [...tile.neighbors]; 
    RandomService.shuffleArray(neighbors); 

    neighbors.forEach(neighborId => {
      if (tilePlate[neighborId] === undefined) { // If neighbor not yet assigned
        tilePlate[neighborId] = currentPlateId;
        queue.push(neighborId); // Add to queue for later processing
      }
    });
  }

  // Apply plate IDs to tile objects
  planet.tiles.forEach(tile => {
    tile.plate = tilePlate[tile.id];
    if (tile.plate === undefined) {
        // This might happen if some tiles are disconnected from all seed points.
        // Assign to a default plate or handle as an error. For now, assign to plate 0 if it exists.
        if (plates.length > 0) tile.plate = 0;
    }
  });

  // 3. (Optional but good) Recalculate Plate Centers: Based on the average position of their assigned tiles.
  // This step refines the plate's conceptual center to be the geometric average of all its tiles,
  // which can be more representative than the initial seed tile, especially for irregularly shaped plates.
  plates.forEach(p => {
    const assignedTileCenters = [];
    planet.tiles.forEach(tile => {
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
  planet.tiles.forEach(tile => {
    const currentPlate = plates[tile.plate];
    if (!currentPlate) {
      // Should be handled by the assignment logic above, but as a fallback:
      tile.elevation = 0;
      return;
    }

    let finalElevation = currentPlate.baseElevation;
    let maxPriority = TECHTONICS_PRIORITY_BASE;
    let isBoundaryTile = false;
    const tileCenterVec = vec3From(tile.center);

    tile.neighbors.forEach(neighborId => {
      const neighborTile = planet.getTile(neighborId);
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

      const isStrongConvergence = convergenceScore < TECHTONICS_CONVERGENCE_STRONG_THRESHOLD;
      const cpIsOceanic = currentPlate.isOceanic;
      const npIsOceanic = neighborPlate.isOceanic;

      let candidateElevation = currentPlate.baseElevation;
      let candidatePriority = TECHTONICS_PRIORITY_BASE;

      // Determine elevation based on Red Blob Games' simplified rules:
      if (!cpIsOceanic && !npIsOceanic) { // Land + Land
        if (isStrongConvergence) {
          candidateElevation = TECHTONICS_ELEVATION_MOUNTAIN;
          candidatePriority = TECHTONICS_PRIORITY_MOUNTAIN;
        }
        // Else: "do nothing" (tile keeps its plate's baseElevation), priority remains PRIORITY_BASE.
      } else if (!cpIsOceanic && npIsOceanic) { // Current: Land, Neighbor: Ocean
        if (isStrongConvergence) { // Land over Ocean -> Coastal Mountains on land side
          candidateElevation = TECHTONICS_ELEVATION_MOUNTAIN;
          candidatePriority = TECHTONICS_PRIORITY_MOUNTAIN;
        } else { // "Coastline"
          candidateElevation = TECHTONICS_ELEVATION_COASTLINE_LOWER;
          candidatePriority = TECHTONICS_PRIORITY_COAST_RIDGE_TRENCH;
        }
      } else if (cpIsOceanic && !npIsOceanic) { // Current: Ocean, Neighbor: Land
        if (isStrongConvergence) { // Ocean under Land -> Trench on ocean side
          candidateElevation = currentPlate.baseElevation + TECHTONICS_ELEVATION_DEEP_OCEAN_TRENCH_OFFSET;
          candidatePriority = TECHTONICS_PRIORITY_COAST_RIDGE_TRENCH;
        } else { // "Coastline"
          candidateElevation = TECHTONICS_ELEVATION_COASTLINE_HIGHER;
          candidatePriority = TECHTONICS_PRIORITY_COAST_RIDGE_TRENCH;
        }
      } else { // Ocean + Ocean
        if (isStrongConvergence) { // Oceanic Ridge / Islands
          candidateElevation = TECHTONICS_ELEVATION_OCEAN_RIDGE;
          candidatePriority = TECHTONICS_PRIORITY_COAST_RIDGE_TRENCH;
        } else { // "Ocean" floor
          candidateElevation = TECHTONICS_ELEVATION_DEFAULT_OCEAN_FLOOR;
          candidatePriority = TECHTONICS_PRIORITY_OCEAN_FLOOR;
        }
      }

      // Update finalElevation if this interaction has higher priority,
      // or same priority but results in a more "extreme" (usually higher) elevation.
      if (candidatePriority > maxPriority) {
        maxPriority = candidatePriority;
        finalElevation = candidateElevation;
      } else if (candidatePriority === maxPriority && candidatePriority > TECHTONICS_PRIORITY_BASE) {
        // For ties in priority (e.g. two mountain-forming interactions), pick the higher elevation.
        // For coast/ridge/trench ties, also pick higher (favors ridges over trenches if priorities accidentally match).
        finalElevation = Math.max(finalElevation, candidateElevation);
      }
    }); // End neighbor loop

    if (!isBoundaryTile) {
      // Interior tile: Set to plate's base elevation.
      // Noise was causing horizontal line artifacts.
      // Smoothing passes will help blend this with boundary elevations.
      finalElevation = currentPlate.baseElevation;
    }
    
    // Clamp elevation to be within [-1, 1] range.
    tile.elevation = Math.max(-1.0, Math.min(1.0, finalElevation));
  }); // End tiles loop

  // 5. Smooth Elevations: Apply a few passes of simple averaging with neighbors.
  for (let pass = 0; pass < TECHTONICS_SMOOTHING_PASSES; pass++) {
    const newElevations = new Map(); // Temporarily stores newly calculated elevations for this pass.
    planet.tiles.forEach(tile => {
      let elevationSum = tile.elevation;
      let neighborCount = 1;
      tile.neighbors.forEach(neighborId => {
        const neighborTile = planet.getTile(neighborId);
        if (neighborTile) {
          elevationSum += neighborTile.elevation;
          neighborCount++;
        }
      });
      newElevations.set(tile.id, elevationSum / neighborCount);
    });

    // Blend current elevation with the new smoothed elevation to retain some features from before smoothing,
    // while also incorporating the averaged values for a smoother overall look.
    planet.tiles.forEach(tile => {
      tile.elevation = (tile.elevation * TECHTONICS_SMOOTHING_ORIGINAL_WEIGHT) + (newElevations.get(tile.id) * TECHTONICS_SMOOTHING_AVERAGED_WEIGHT);
    });
  }

  // 6. Assign Moisture (Latitudinal gradient modulated by plate and with noise)
  // Pre-calculate sine values for latitudes
  const SIN_30_DEG = Math.sin(30 * Math.PI / 180);
  const SIN_60_DEG = Math.sin(60 * Math.PI / 180);

  // Assign a base moisture influence to each plate
  const plateMoistureFactors = plates.map(() => 
    RandomService.nextFloat() * (TECHTONICS_MOISTURE_PLATE_BASE_MAX - TECHTONICS_MOISTURE_PLATE_BASE_MIN) + TECHTONICS_MOISTURE_PLATE_BASE_MIN
  );

  planet.tiles.forEach(tile => {
    if (!tile.center || tile.center.length < 3) {
        tile.moisture = TECHTONICS_MOISTURE_DEFAULT_TILE; 
        return;
    }

    // Calculate latitudinal base moisture
    const absLatY = Math.abs(tile.center[1]); 
    let latitudinalBaseMoisture;
    if (absLatY <= SIN_30_DEG) { 
      const t = absLatY / SIN_30_DEG; 
      latitudinalBaseMoisture = TECHTONICS_MOISTURE_EQUATOR_MAX - t * (TECHTONICS_MOISTURE_EQUATOR_MAX - TECHTONICS_MOISTURE_30_DEG_MIN);
    } else if (absLatY <= SIN_60_DEG) { 
      const t = (absLatY - SIN_30_DEG) / (SIN_60_DEG - SIN_30_DEG); 
      latitudinalBaseMoisture = TECHTONICS_MOISTURE_30_DEG_MIN + t * (TECHTONICS_MOISTURE_60_DEG_MID - TECHTONICS_MOISTURE_30_DEG_MIN);
    } else { 
      latitudinalBaseMoisture = TECHTONICS_MOISTURE_60_DEG_MID;
    }

    // Get plate's moisture factor
    let plateMoistureFactor = TECHTONICS_MOISTURE_DEFAULT_TILE; // Default if plate info is missing
    if (tile.plate !== undefined && plates[tile.plate] && plateMoistureFactors[tile.plate] !== undefined) {
        plateMoistureFactor = plateMoistureFactors[tile.plate];
    }

    // Combine latitudinal and plate moisture influences
    const combinedBaseMoisture = (TECHTONICS_MOISTURE_LATITUDE_WEIGHT * latitudinalBaseMoisture) + 
                               (TECHTONICS_MOISTURE_PLATE_WEIGHT * plateMoistureFactor);

    // Add local noise
    const scaledNoise = noise3(tile.center[0] * TECHTONICS_MOISTURE_NOISE_X_MULTIPLIER, 
                               tile.center[1] * TECHTONICS_MOISTURE_NOISE_Y_MULTIPLIER, 
                               tile.center[2] * TECHTONICS_MOISTURE_NOISE_Z_MULTIPLIER);
    const moistureNoiseVal = (scaledNoise - 0.5) * TECHTONICS_MOISTURE_NOISE_AMPLITUDE;
                                   
    tile.moisture = Math.max(0, Math.min(1, combinedBaseMoisture + moistureNoiseVal));
  });

  // 7. Assign Temperature (Latitude and Elevation based)
  planet.tiles.forEach(tile => {
    if (!tile.center || tile.center.length < 3) {
      tile.temperature = 0.5; // Default for bad data
      return;
    }
    // tile.center[1] is y-coordinate, assuming normalized [-1 (S pole), 1 (N pole)]
    // Latitude effect: 1.0 at equator (y=0), 0.0 at poles (y= +/-1)
    const latitudeEffect = 1.0 - Math.abs(tile.center[1]);

    // Elevation effect: Higher elevation means colder.
    // tile.elevation is typically [-1, 1]. Positive elevation reduces temperature.
    // The factor 0.25 means 1.0 elevation can reduce temp by up to 0.25.
    const elevationEffect = tile.elevation > 0 ? tile.elevation * 0.25 : 0;
    
    let calculatedTemperature = latitudeEffect - elevationEffect;

    // Further adjustment: Very low elevations (deep water) might be slightly colder than surface water at same latitude
    if (tile.elevation < -0.5) { // If it's deep ocean
        calculatedTemperature -= 0.05; // Slightly colder
    }

    tile.temperature = Math.max(0, Math.min(1, calculatedTemperature));
  });

  // 8. Identify Ocean-Connected Water Tiles (for Lake differentiation)
  const oceanSeedTiles = new Set();
  planet.tiles.forEach(tile => {
    tile.isOceanConnected = false; // Reset/initialize
    if (tile.elevation < TECHTONICS_SEA_LEVEL) {
      oceanSeedTiles.add(tile.id);
    }
  });

  const oceanQueue = Array.from(oceanSeedTiles); // Renamed from queue
  let oceanHead = 0; // Renamed from head
  while(oceanHead < oceanQueue.length) {
    const currentTileId = oceanQueue[oceanHead++]; // Use renamed variables
    const currentTile = planet.getTile(currentTileId);
    if (currentTile) { 
        currentTile.isOceanConnected = true;
        currentTile.neighbors.forEach(neighborId => {
            const neighborTile = planet.getTile(neighborId);
            if (neighborTile && neighborTile.elevation < TECHTONICS_SEA_LEVEL && !neighborTile.isOceanConnected && !oceanQueue.includes(neighborId)) {
                if (!oceanSeedTiles.has(neighborId)) { 
                    oceanQueue.push(neighborId);
                    oceanSeedTiles.add(neighborId); 
                }
            }
        });
    }
  }
  // Any tile with elevation < SEA_LEVEL and isOceanConnected = false could be a lake.

  return { plates, tilePlate };
} 