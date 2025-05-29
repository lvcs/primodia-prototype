
// Camera (from game.js) // TODO: Move to cameraConfig.js
export const CAMERA_FOV = 60;
export const CAMERA_NEAR_PLANE = 0.1;
export const CAMERA_FAR_PLANE = 100000;
export const CAMERA_MIN_DISTANCE_FACTOR = 1.02; // Min zoom distance as a factor of planet radius
export const CAMERA_MAX_DISTANCE_FACTOR = 5;   // Max zoom distance as a factor of planet radius

export const CAMERA_ZOOM_DISTANCE_DEFAULT = 16000; // TODO: This duplicated CAMERA_PLANET_VIEW_DISTANCE

// Camera Distance Constants
export const CAMERA_PLANET_VIEW_DISTANCE = 16000;
export const CAMERA_TILE_VIEW_DISTANCE = 9600;

// Easing functions
export const CAMERA_EASINGS = {
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  // Add more easing functions as needed
};

// Default animation parameters
export const CAMERA_DEFAULT_ANIMATION_DURATION_MS = 1500; // milliseconds
export const CAMERA_DEFAULT_EASING_CURVE = CAMERA_EASINGS.easeInOutCubic;

// Specific camera view configurations
export const CAMERA_VIEWS = {
  planet: {
    label: 'Planet',
    defaultPosition: { x: 0, y: CAMERA_PLANET_VIEW_DISTANCE, z: 0 }, // Use the constant
    defaultTilt: 30, // Degrees
    animation: {
      durationMs: 1500, // Can override CAMERA_DEFAULT_ANIMATION_DURATION_MS
      easing: CAMERA_EASINGS.easeInOutCubic, // Reference the unified easing function
    },
    icon: 'planet', // For UI icon reference
  },
  tile: {
    label: 'Tile',
    defaultDistance: CAMERA_TILE_VIEW_DISTANCE, // Use the constant
    defaultTilt: 60, // Degrees
    animation: {
      durationMs: 1200, // Can override CAMERA_DEFAULT_ANIMATION_DURATION_MS
      easing: CAMERA_EASINGS.easeInOutCubic, // Reference the unified easing function
    },
    icon: 'tile', // For UI icon reference
  },
  // Add more views here as needed
}; 