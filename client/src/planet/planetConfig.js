
// Planet Tiles (Points) // TODO: Move to planetConfig.js
export const PLANET_TILES_MIN = 50;
export const PLANET_TILES_MAX = 128000;
export const PLANET_TILES_DEFAULT = 1280;
export const PLANET_TILES_STEP = 50;

// Tectonic Plates // TODO: Move to planetConfig.js
export const PLANET_TECHTONIC_PLATES_MIN = 4;
export const PLANET_TECHTONIC_PLATES_MAX = 128;
export const PLANET_TECHTONIC_PLATES_DEFAULT = 16;
export const PLANET_TECHTONIC_PLATES_STEP = 1;

// Jitter // TODO: Move to planetConfig.js
export const PLANET_JITTER_MIN = 0;
export const PLANET_JITTER_MAX = 1;
export const PLANET_JITTER_DEFAULT = 0.5;
export const PLANET_JITTER_STEP = 0.01;

// Planet Radius / Size // TODO: Move to planetConfig.js
export const PLANET_RADIUS = 6400; // Fixed radius for the planet, in kilometers

// Elevation Bias // TODO: Move to planetConfig.js
export const PLANET_ELEVATION_BIAS_MIN = -0.5;
export const PLANET_ELEVATION_BIAS_MAX = 0.5;
export const PLANET_ELEVATION_BIAS_DEFAULT = 0;
export const PLANET_ELEVATION_BIAS_STEP = 0.01;


// Planetary Glow (from game.js) // TODO: Move to planetConfig.js
export const PLANET_GLOW_RADIUS_FACTOR = 1.15; // Multiplies worldConfig.radius
export const PLANET_GLOW_OPACITY = 0.15;
export const PLANET_GLOW_COLOR = 0x5c95ff;


// UI Specific Constants // TODO: Move to planetConfig.js
export const PLANET_DRAW_MODE = {
  POINTS: 'points',
  DELAUNAY: 'delaunay',
  VORONOI: 'voronoi',
  CENTROID: 'centroid'
};

export const PLANET_VIEW_MODES = [
  { value: 'terrain', label: 'Terrain' },
  { value: 'plates', label: 'Tectonic Plates' },
  { value: 'elevation', label: 'Elevation' },
  { value: 'moisture', label: 'Moisture' },
  { value: 'temperature', label: 'Temperature' }
];
export const PLANET_VIEW_MODE_DEFAULT = 'elevation';

export const PLANET_RENDERING_ALGORITHMS = [1, 2]; 
