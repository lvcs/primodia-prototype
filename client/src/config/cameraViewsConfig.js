// Centralized configuration for camera views and animation parameters

export const CAMERA_VIEWS = {
  globe: {
    label: 'Globe',
    defaultPosition: { x: 0, y: 16000, z: 0 }, // 16,000 units above the center (0,0,0)
    defaultTilt: 30, // Degrees
    animation: {
      durationMs: 1500,
      easing: 'easeInOutCubic',
    },
    icon: 'globe', // For UI icon reference
  },
  tile: {
    label: 'Tile',
    defaultDistance: 6800, // Distance from center in units
    defaultTilt: 60, // Degrees
    animation: {
      durationMs: 1200,
      easing: 'easeInOutCubic',
    },
    icon: 'tile', // For UI icon reference
  },
  // Add more views here as needed
};

// Easing functions can be mapped here if needed
export const CAMERA_EASINGS = {
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  // Add more easing functions as needed
}; 