import * as THREE from 'three';
import Plate from './model/Plate.js';
import RandomService from '../core/RandomService.js';

// --- Tectonic Plate Generation Constants ---

// Percentage chance for a new plate to be oceanic (0.0 to 1.0).
const OCEANIC_PLATE_CHANCE = 0.7;
// Min/max base elevation for oceanic plates.
const OCEANIC_BASE_ELEVATION_MIN = -0.6;
const OCEANIC_BASE_ELEVATION_MAX = -0.3;
// Min/max base elevation for continental plates.
const CONTINENTAL_BASE_ELEVATION_MIN = 0.05;
const CONTINENTAL_BASE_ELEVATION_MAX = 0.25;

// --- Elevation Calculation Constants (Inspired by Red Blob Games) ---

// Defines how strongly plates must converge to form major features like mountains or deep trenches.
// Negative values indicate convergence. Article used -0.75; current value is less extreme.
const STRONG_CONVERGENCE_THRESHOLD = -0.4;
// Target elevation for major mountain ranges resulting from plate collisions.
const MOUNTAIN_ELEVATION = 0.7;
// Target elevation for coastlines on the edge of land plates (e.g., beaches).
const COASTLINE_LOWER_ELEVATION = 0.0;
// Target elevation for coastlines on the edge of ocean plates (e.g., continental shelves, shallow ridges).
const COASTLINE_HIGHER_ELEVATION = -0.15;
// Target elevation for mid-ocean ridges formed by strong oceanic-oceanic plate convergence.
const OCEAN_RIDGE_ELEVATION = -0.1;
// Offset subtracted from an oceanic plate's base elevation to form deep ocean trenches.
const DEEP_OCEAN_TRENCH_OFFSET = -0.3;
// Default elevation for typical ocean floor when oceanic plates are not strongly converging.
const DEFAULT_OCEAN_FLOOR = -0.4;

// --- Elevation Priority Constants ---
// Used to determine which geological feature's elevation "wins" when multiple interactions affect a tile.
// Higher numbers indicate higher priority.
const PRIORITY_BASE = 0;                 // Base elevation of the plate.
const PRIORITY_OCEAN_FLOOR = 1;          // Standard ocean floor.
const PRIORITY_COAST_RIDGE_TRENCH = 2;   // Coastlines, oceanic ridges, or trenches.
const PRIORITY_MOUNTAIN = 3;             // Major mountain ranges.

// --- Elevation Smoothing Constants ---
// Number of passes for the elevation smoothing algorithm.
const ELEVATION_SMOOTHING_PASSES = 3;
// Blending factor for original elevation during smoothing (0.0 to 1.0). Higher retains more original features.
const ELEVATION_SMOOTHING_ORIGINAL_WEIGHT = 0.6;
// Blending factor for averaged elevation during smoothing (0.0 to 1.0).
const ELEVATION_SMOOTHING_AVERAGED_WEIGHT = 0.4;

// --- Noise Generation Constants ---
// Multipliers for the sine function in noise3 to create chaotic patterns.
const NOISE3_X_MULTIPLIER = 12.9898;
const NOISE3_Y_MULTIPLIER = 78.233;
const NOISE3_Z_MULTIPLIER = 37.719;

// Default number of octaves for Fractional Brownian Motion (fBm) noise.
const FBM_DEFAULT_OCTAVES = 4;
// Initial amplitude for the first octave of fBm noise.
const FBM_INITIAL_AMPLITUDE = 0.5;
// Persistence factor for fBm noise; controls how much detail is added with each octave.
// Typically between 0 and 1. Higher values mean rougher noise.
const FBM_PERSISTENCE = 0.5;
// Initial frequency for the first octave of fBm noise.
const FBM_INITIAL_FREQUENCY = 1;

// --- Moisture Generation Constants ---
// Range for base moisture assigned to each tectonic plate.
const PLATE_MOISTURE_BASE_MIN = 0.2;
const PLATE_MOISTURE_BASE_MAX = 0.8; // Max = PLATE_MOISTURE_BASE_MIN + 0.6 (from original code)
// Multipliers for noise3 to generate moisture variation within a plate.
const MOISTURE_NOISE_X_MULTIPLIER = 23.4;
const MOISTURE_NOISE_Y_MULTIPLIER = 17.8;
const MOISTURE_NOISE_Z_MULTIPLIER = 11.2;
// Amplitude of the moisture noise effect (scaled by this value).
const MOISTURE_NOISE_AMPLITUDE = 0.4;
// Offset for the moisture noise (centers the noise effect around 0; e.g. if amplitude is 0.4, noise ranges from -0.2 to 0.2).
const MOISTURE_NOISE_OFFSET = MOISTURE_NOISE_AMPLITUDE / 2;

// Default moisture value for tiles that somehow end up unassigned to a plate.
const DEFAULT_TILE_MOISTURE = 0.5;


// Utility hash-based pseudo-noise (simple and fast)
// Generates a deterministic pseudo-random value between 0 and 1 based on 3D input coordinates.
// Uses sine function with arbitrary multipliers for chaotic behavior.
// TODO: Define magic numbers as constants
function noise3(x, y, z) {
  const s = Math.sin(x * NOISE3_X_MULTIPLIER + y * NOISE3_Y_MULTIPLIER + z * NOISE3_Z_MULTIPLIER);
  return s - Math.floor(s); // Returns a value between 0 and 1
}

// Fractional Brownian Motion (fBm) noise for more natural-looking terrain variations
// Combines multiple "octaves" of the basic noise3 function at different frequencies and amplitudes
// to create more complex and natural-looking patterns.
// TODO: Define magic numbers/defaults as constants
function fbmNoise(vec, octaves = FBM_DEFAULT_OCTAVES) {
  let total = 0;
  let frequency = FBM_INITIAL_FREQUENCY;
  let amplitude = FBM_INITIAL_AMPLITUDE;
  // const persistence = FBM_PERSISTENCE; // Renamed from FBM_PERSISTENCE to avoid conflict with the loop var

  for (let i = 0; i < octaves; i++) {
    total += noise3(vec.x * frequency, vec.y * frequency, vec.z * frequency) * amplitude;
    frequency *= 2; // Double frequency for finer detail
    amplitude *= FBM_PERSISTENCE; // Reduce amplitude for finer detail
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
  RandomService.shuffleArray(availableTileIds);
  for (let i = 0; i < numPlates && i < availableTileIds.length; i++) {
    seedIds.push(availableTileIds[i]);
  }
  if (seedIds.length < numPlates) {
    console.warn(`Could only create ${seedIds.length} plates out of ${numPlates} requested (not enough unique tiles).`);
  }

  const plates = seedIds.map((seedId, idx) => {
    const seedTile = globe.getTile(seedId);
    if (!seedTile) {
        console.error("Seed tile not found for ID:", seedId);
        // Provide a fallback Plate to prevent crashes
        const fallbackMotion = new THREE.Vector3(RandomService.nextFloat() - 0.5, RandomService.nextFloat() - 0.5, RandomService.nextFloat() - 0.5).normalize();
        return new Plate({
            id: idx, seedTileId: seedId, center: [0,0,0], 
            motion: [fallbackMotion.x, fallbackMotion.y, fallbackMotion.z],
            isOceanic: RandomService.nextFloat() < OCEANIC_PLATE_CHANCE,
            baseElevation: OCEANIC_BASE_ELEVATION_MIN 
        });
    }
    const center = seedTile.center;
    // Generate a random motion vector for the plate, tangent to the sphere surface at its center.
    const randomVec = new THREE.Vector3(RandomService.nextFloat() - 0.5, RandomService.nextFloat() - 0.5, RandomService.nextFloat() - 0.5).normalize();
    const motion = new THREE.Vector3().fromArray(center).cross(randomVec).normalize(); // Cross product ensures perpendicular motion vector

    // Determine if the plate is oceanic or continental and assign a base elevation.
    const isOceanic = RandomService.nextFloat() < OCEANIC_PLATE_CHANCE;
    const baseElevation = isOceanic
      ? (RandomService.nextFloat() * (OCEANIC_BASE_ELEVATION_MAX - OCEANIC_BASE_ELEVATION_MIN) + OCEANIC_BASE_ELEVATION_MIN)
      : (RandomService.nextFloat() * (CONTINENTAL_BASE_ELEVATION_MAX - CONTINENTAL_BASE_ELEVATION_MIN) + CONTINENTAL_BASE_ELEVATION_MIN);

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
    const tile = globe.getTile(currentTileId);

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
  // This step refines the plate's conceptual center to be the geometric average of all its tiles,
  // which can be more representative than the initial seed tile, especially for irregularly shaped plates.
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
  // This section iterates through each tile and determines its elevation.
  // For boundary tiles, elevation is based on the interaction between its plate and neighboring plates.
  // For interior tiles, elevation is based on the plate's base elevation.
  // Constants for elevation effects, inspired by Red Blob Games article's logic.
  // These values define the "target" elevation for different geological features.
  // const STRONG_CONVERGENCE_THRESHOLD = -0.4; // How much plates must push together for major features. (Article used -0.75, this is less extreme)
  // const MOUNTAIN_ELEVATION = 0.7;            // Elevation for major mountain ranges.
  // const COASTLINE_LOWER_ELEVATION = 0.0;     // Elevation for coastlines on the edge of land plates (e.g. beaches).
  // const COASTLINE_HIGHER_ELEVATION = -0.15;   // Elevation for coastlines on edge of ocean plates (e.g. continental shelf / shallow ridges).
  // const OCEAN_RIDGE_ELEVATION = -0.1;        // Elevation for mid-ocean ridges (O+O strong convergence).
  // const DEEP_OCEAN_TRENCH_OFFSET = -0.3;     // Added to ocean plate base for trenches.
  // const DEFAULT_OCEAN_FLOOR = -0.4;          // Typical ocean floor depth for O+O non-strong convergence.

  // Elevation priorities: Higher number means this feature "wins" over lower priority ones.
  // const PRIORITY_BASE = 0;
  // const PRIORITY_OCEAN_FLOOR = 1;
  // const PRIORITY_COAST_RIDGE_TRENCH = 2;
  // const PRIORITY_MOUNTAIN = 3;

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
      // Interior tile: Set to plate's base elevation.
      // Noise was causing horizontal line artifacts.
      // Smoothing passes will help blend this with boundary elevations.
      finalElevation = currentPlate.baseElevation;
    }
    
    // Clamp elevation to be within [-1, 1] range.
    tile.elevation = Math.max(-1.0, Math.min(1.0, finalElevation));
  }); // End tiles loop

  // 5. Smooth Elevations: Apply a few passes of simple averaging with neighbors.
  // This helps blend harsh transitions between different elevation zones (e.g., mountains and coasts)
  // and creates more natural-looking slopes across the terrain.
  // const smoothingPasses = 3;
  for (let pass = 0; pass < ELEVATION_SMOOTHING_PASSES; pass++) {
    const newElevations = new Map(); // Temporarily stores newly calculated elevations for this pass.
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

    // Blend current elevation with the new smoothed elevation to retain some features from before smoothing,
    // while also incorporating the averaged values for a smoother overall look.
    globe.tiles.forEach(tile => {
      tile.elevation = (tile.elevation * ELEVATION_SMOOTHING_ORIGINAL_WEIGHT) + (newElevations.get(tile.id) * ELEVATION_SMOOTHING_AVERAGED_WEIGHT);
    });
  }

  // 6. Assign Moisture (Simple placeholder logic)
  // This is a very basic model for distributing moisture. A more sophisticated climate simulation
  // would be needed for realistic moisture patterns (e.g., considering wind, mountains, large water bodies).
  // TODO: Define magic numbers as constants
  const plateMoistureBase = plates.map(() => RandomService.nextFloat() * (PLATE_MOISTURE_BASE_MAX - PLATE_MOISTURE_BASE_MIN) + PLATE_MOISTURE_BASE_MIN);
  globe.tiles.forEach(tile => {
    if (tile.plate === undefined || !plates[tile.plate]) {
        tile.moisture = DEFAULT_TILE_MOISTURE; // Default if plate info is missing
        return;
    }
    const baseMoisture = plateMoistureBase[tile.plate];
    // Add some noise based on location for variation within a plate.
    const moistureNoiseVal = noise3(tile.center[0] * MOISTURE_NOISE_X_MULTIPLIER, tile.center[1] * MOISTURE_NOISE_Y_MULTIPLIER, tile.center[2] * MOISTURE_NOISE_Z_MULTIPLIER) * MOISTURE_NOISE_AMPLITUDE - MOISTURE_NOISE_OFFSET;
    tile.moisture = Math.max(0, Math.min(1, baseMoisture + moistureNoiseVal));
  });

  return { plates, tilePlate };
} 