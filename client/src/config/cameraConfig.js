// Camera Distance Constants
export const PLANET_VIEW_CAMERA_DISTANCE = 16000;
export const TILE_VIEW_CAMERA_DISTANCE = 9600;

// Easing functions
export const CAMERA_EASINGS = {
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  // Add more easing functions as needed
};

// Default animation parameters
export const DEFAULT_ANIMATION_DURATION_MS = 1500; // milliseconds
export const DEFAULT_EASING_CURVE = CAMERA_EASINGS.easeInOutCubic;

// Specific camera view configurations
export const CAMERA_VIEWS = {
  planet: {
    label: 'Planet',
    defaultPosition: { x: 0, y: PLANET_VIEW_CAMERA_DISTANCE, z: 0 }, // Use the constant
    defaultTilt: 30, // Degrees
    animation: {
      durationMs: 1500, // Can override DEFAULT_ANIMATION_DURATION_MS
      easing: CAMERA_EASINGS.easeInOutCubic, // Reference the unified easing function
    },
    icon: 'planet', // For UI icon reference
  },
  tile: {
    label: 'Tile',
    defaultDistance: TILE_VIEW_CAMERA_DISTANCE, // Use the constant
    defaultTilt: 60, // Degrees
    animation: {
      durationMs: 1200, // Can override DEFAULT_ANIMATION_DURATION_MS
      easing: CAMERA_EASINGS.easeInOutCubic, // Reference the unified easing function
    },
    icon: 'tile', // For UI icon reference
  },
  // Add more views here as needed
}; 