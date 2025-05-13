/**
 * Game-wide constants for configuration and tuning.
 */

// Globe Tiles (Points)
export const MAX_NUMBER_OF_GLOBE_TILES = 128000;
export const DEFAULT_NUMBER_OF_GLOBE_TILES = 96000;
export const MIN_NUMBER_OF_GLOBE_TILES = 50; // From UI slider min
export const STEP_NUMBER_OF_GLOBE_TILES = 50; // From UI slider step

// Tectonic Plates
export const MIN_TECHTONIC_PLATES = 4;    // From UI slider min
export const MAX_TECHTONIC_PLATES = 64;    // From UI slider max
export const DEFAULT_TECHTONIC_PLATES = 16; // From sphereSettings default
export const STEP_TECHTONIC_PLATES = 1;     // From UI slider step

// Jitter
export const MIN_JITTER = 0;
export const MAX_JITTER = 1;
export const DEFAULT_JITTER = 0.5;
export const STEP_JITTER = 0.01;

// Globe Radius / Size
export const MIN_GLOBE_RADIUS = 5;
export const MAX_GLOBE_RADIUS = 50;
export const DEFAULT_GLOBE_RADIUS = 10;
export const STEP_GLOBE_RADIUS = 1;

// Elevation Bias
export const MIN_ELEVATION_BIAS = -0.5;
export const MAX_ELEVATION_BIAS = 0.5;
export const DEFAULT_ELEVATION_BIAS = 0;
export const STEP_ELEVATION_BIAS = 0.01;

// World Config (from game.js)
export const DEFAULT_WORLD_DETAIL = 2; // Initial value for worldConfig.detail

// Camera (from game.js)
export const CAMERA_FOV = 60;
export const CAMERA_NEAR_PLANE = 0.1;
export const CAMERA_FAR_PLANE = 1000;
export const CAMERA_MIN_DISTANCE_FACTOR = 1.02;    // Multiplies worldConfig.radius - reduced for close-up views
export const CAMERA_MAX_DISTANCE_FACTOR = 5;      // Multiplies worldConfig.radius
export const CAMERA_INITIAL_POS_Y_FACTOR = 0.5; // Multiplies worldConfig.radius for y position
export const CAMERA_INITIAL_POS_Z_FACTOR = 2.5; // Multiplies worldConfig.radius for z position

// Scene (from game.js)
export const SCENE_BACKGROUND_COLOR = 0x0a0a2a;

// Planetary Glow (from game.js)
export const PLANETARY_GLOW_RADIUS_FACTOR = 1.15; // Multiplies worldConfig.radius
export const PLANETARY_GLOW_OPACITY = 0.15;
export const PLANETARY_GLOW_COLOR = 0x5c95ff; 