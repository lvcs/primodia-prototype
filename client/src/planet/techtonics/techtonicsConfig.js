// --- Tectonic Plate Generation Constants ---

// Percentage chance for a new plate to be oceanic (0.0 to 1.0).
export const TECHTONICS_PLATE_OCEANIC_CHANCE = 0.7;

// Min/max base elevation for oceanic plates.
export const TECHTONICS_PLATE_OCEANIC_ELEVATION_MIN = -0.9;
export const TECHTONICS_PLATE_OCEANIC_ELEVATION_MAX = -0.5;

// Min/max base elevation for continental plates.
export const TECHTONICS_PLATE_CONTINENTAL_ELEVATION_MIN = 0.1;
export const TECHTONICS_PLATE_CONTINENTAL_ELEVATION_MAX = 0.5;

// --- Elevation Calculation Constants (Inspired by Red Blob Games) ---

// Defines how strongly plates must converge to form major features like mountains or deep trenches.
// Negative values indicate convergence. Article used -0.75; current value is less extreme.
export const TECHTONICS_CONVERGENCE_STRONG_THRESHOLD = -0.4;

// Target elevation for major mountain ranges resulting from plate collisions.
export const TECHTONICS_ELEVATION_MOUNTAIN = 1.0;

// Target elevation for coastlines on the edge of land plates (e.g., beaches).
export const TECHTONICS_ELEVATION_COASTLINE_LOWER = 0.0;

// Target elevation for coastlines on the edge of ocean plates (e.g., continental shelves, shallow ridges).
export const TECHTONICS_ELEVATION_COASTLINE_HIGHER = -0.15;

// Target elevation for mid-ocean ridges formed by strong oceanic-oceanic plate convergence.
export const TECHTONICS_ELEVATION_OCEAN_RIDGE = -0.1;

// Offset subtracted from an oceanic plate's base elevation to form deep ocean trenches.
export const TECHTONICS_ELEVATION_DEEP_OCEAN_TRENCH_OFFSET = -0.45;

// Default elevation for typical ocean floor when oceanic plates are not strongly converging.
export const TECHTONICS_ELEVATION_DEFAULT_OCEAN_FLOOR = -0.75;

// --- Elevation Priority Constants ---
// Used to determine which geological feature's elevation "wins" when multiple interactions affect a tile.
// Higher numbers indicate higher priority.
export const TECHTONICS_PRIORITY_BASE = 0;                 // Base elevation of the plate.
export const TECHTONICS_PRIORITY_OCEAN_FLOOR = 1;          // Standard ocean floor.
export const TECHTONICS_PRIORITY_COAST_RIDGE_TRENCH = 2;   // Coastlines, oceanic ridges, or trenches.
export const TECHTONICS_PRIORITY_MOUNTAIN = 3;             // Major mountain ranges.

// --- Elevation Smoothing Constants ---
// Number of passes for the elevation smoothing algorithm.
export const TECHTONICS_SMOOTHING_PASSES = 2;

// Blending factor for original elevation during smoothing (0.0 to 1.0). Higher retains more original features.
export const TECHTONICS_SMOOTHING_ORIGINAL_WEIGHT = 0.6;

// Blending factor for averaged elevation during smoothing (0.0 to 1.0).
export const TECHTONICS_SMOOTHING_AVERAGED_WEIGHT = 0.4;

// --- Noise Generation Constants ---
// Multipliers for the sine function in noise3 to create chaotic patterns.
export const TECHTONICS_NOISE3_X_MULTIPLIER = 12.9898;
export const TECHTONICS_NOISE3_Y_MULTIPLIER = 78.233;
export const TECHTONICS_NOISE3_Z_MULTIPLIER = 37.719;

// Default number of octaves for Fractional Brownian Motion (fBm) noise.
export const TECHTONICS_FBM_DEFAULT_OCTAVES = 4;

// Initial amplitude for the first octave of fBm noise.
export const TECHTONICS_FBM_INITIAL_AMPLITUDE = 0.5;

// Persistence factor for fBm noise; controls how much detail is added with each octave.
// Typically between 0 and 1. Higher values mean rougher noise.
export const TECHTONICS_FBM_PERSISTENCE = 0.5;

// Initial frequency for the first octave of fBm noise.
export const TECHTONICS_FBM_INITIAL_FREQUENCY = 1;

// --- Moisture Generation Constants ---
// Range for base moisture assigned to each tectonic plate.
export const TECHTONICS_MOISTURE_PLATE_BASE_MIN = 0.2;
export const TECHTONICS_MOISTURE_PLATE_BASE_MAX = 0.8;

// Multipliers for noise3 to generate moisture variation within a plate.
export const TECHTONICS_MOISTURE_NOISE_X_MULTIPLIER = 23.4;
export const TECHTONICS_MOISTURE_NOISE_Y_MULTIPLIER = 17.8;
export const TECHTONICS_MOISTURE_NOISE_Z_MULTIPLIER = 11.2;

// Amplitude of the moisture noise effect (scaled by this value).
export const TECHTONICS_MOISTURE_NOISE_AMPLITUDE = 0.05;

// Offset for the moisture noise (centers the noise effect around 0).
export const TECHTONICS_MOISTURE_NOISE_OFFSET = TECHTONICS_MOISTURE_NOISE_AMPLITUDE / 2;

// Default moisture value for tiles that somehow end up unassigned to a plate.
export const TECHTONICS_MOISTURE_DEFAULT_TILE = 0.5;

// --- Temperature and Ocean Constants ---
// Sea level threshold for ocean connectivity determination.
export const TECHTONICS_SEA_LEVEL = -0.05;

// Moisture profile constants for latitude
export const TECHTONICS_MOISTURE_EQUATOR_MAX = 0.9;  // Max moisture at the equator
export const TECHTONICS_MOISTURE_30_DEG_MIN = 0.1;   // Min moisture at 30 degrees latitude
export const TECHTONICS_MOISTURE_60_DEG_MID = 0.5;   // Medium moisture at 60 degrees latitude and towards poles

// Weights for combining latitudinal and plate-based moisture
export const TECHTONICS_MOISTURE_LATITUDE_WEIGHT = 0.7;
export const TECHTONICS_MOISTURE_PLATE_WEIGHT = 0.3; 