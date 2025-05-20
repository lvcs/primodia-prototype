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
export const MAX_TECHTONIC_PLATES = 512;    // From UI slider max
export const DEFAULT_TECHTONIC_PLATES = 128; // From sphereSettings default
export const STEP_TECHTONIC_PLATES = 1;     // From UI slider step

// Jitter
export const MIN_JITTER = 0;
export const MAX_JITTER = 1;
export const DEFAULT_JITTER = 0.5;
export const STEP_JITTER = 0.01;

// Globe Radius / Size
export const GLOBE_RADIUS = 6400; // Fixed radius for the globe, in kilometers
export const MIN_GLOBE_RADIUS = 6400; // Minimum radius (fixed for Earth scale)
export const MAX_GLOBE_RADIUS = 6400; // Maximum radius (fixed for Earth scale)
export const DEFAULT_GLOBE_RADIUS = 6400; // Default radius (fixed for Earth scale)
export const STEP_GLOBE_RADIUS = 1; // Kept for reference

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
export const CAMERA_FAR_PLANE = 100000;
export const CAMERA_MIN_DISTANCE_FACTOR = 1.02; // Min zoom distance as a factor of globe radius
export const CAMERA_MAX_DISTANCE_FACTOR = 5;   // Max zoom distance as a factor of globe radius
export const CAMERA_INITIAL_POS_Y_FACTOR = 0; // Initial camera Y position factor
export const CAMERA_INITIAL_POS_Z_FACTOR = 2.5; // Initial camera Z position factor

// Scene (from game.js)
export const SCENE_BACKGROUND_COLOR = 0x0a0a2a;

// Planetary Glow (from game.js)
export const PLANETARY_GLOW_RADIUS_FACTOR = 1.15; // Multiplies worldConfig.radius
export const PLANETARY_GLOW_OPACITY = 0.15;
export const PLANETARY_GLOW_COLOR = 0x5c95ff;

// Camera and Controls
export const MOUSE_PAN_SPEED = 0.0025; // Sensitivity of mouse panning (halved from 0.005)
export const KEYBOARD_ZOOM_SPEED = 0.1; // Amount to zoom in/out per key press
// New: Keyboard rotation speed scaling factors based on zoom
export const KEYBOARD_SPEED_SCALE_AT_MIN_ZOOM = 0.1; // e.g., 1% of base speed at max zoom-in
export const KEYBOARD_SPEED_SCALE_AT_MAX_ZOOM = 4.0;  // e.g., 200% of base speed at max zoom-out

// Globe Rotation Damping and Inertia
export const GLOBE_ANGULAR_DAMPING_FACTOR = 0.95; // Factor to slow down globe rotation each frame (e.g., 0.95 = 5% slowdown)
export const KEYBOARD_TARGET_ANGULAR_SPEED = 0.0075; // Target angular speed (radians/sec) when a rotation key is held (reduced from 1.0)
export const KEYBOARD_ROTATION_ACCELERATION_FACTOR = 0.1; // How quickly globe reaches target speed from keyboard (0-1)
export const MOUSE_RELEASE_INERTIA_FACTOR = 30.0; // Multiplier for mouse delta to initial angular velocity on release 

// Tile View Angle
export const TILE_VIEW_TILT_ANGLE = -Math.PI / 4; // -45 degrees 
export const TILE_VIEW_SPHERE_DISTANCE = 16000; // Distance from globe center for tile view (2.5x radius)
export const TILE_VIEW_ZOOM = 1.0; // Default zoom level for tile view 

// UI Specific Constants
export const DrawMode = {
  POINTS: 'points',
  DELAUNAY: 'delaunay',
  VORONOI: 'voronoi',
  CENTROID: 'centroid'
};

export const mockMapTypes = {
  CONTINENTS: { id: 'continents', name: 'Continents', description: 'Large landmasses.' },
  PANGAEA: { id: 'pangaea', name: 'Pangaea', description: 'One supercontinent.' },
  FRACTAL: { id: 'fractal', name: 'Fractal', description: 'Chaotic coastlines.' },
  ARCHIPELAGO: { id: 'archipelago', name: 'Archipelago', description: 'Small islands.' },
  ISLAND_PLATES: { id: 'island_plates', name: 'Island Plates', description: 'Mix of small-to-medium islands.'},
  HIGHLANDS: { id: 'highlands', name: 'Highlands', description: 'Mostly hills and mountains.'},
  LAKES: { id: 'lakes', name: 'Lakes', description: 'Tons of small inland lakes.'},
  DRY: { id: 'dry', name: 'Dry', description: 'Arid terrain.'},
};
export const defaultMapType = 'continents';

export const DEFAULT_VIEW_MODE = 'elevation';

export const globeViewOptions = [
  { value: 'terrain', label: 'Terrain' },
  { value: 'plates', label: 'Tectonic Plates' },
  { value: 'elevation', label: 'Elevation' },
  { value: 'moisture', label: 'Moisture' },
  { value: 'temperature', label: 'Temperature' }
];

export const algorithms = [1, 2]; 