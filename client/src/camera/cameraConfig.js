import * as THREE from 'three';

// General Animation
export const ANIMATION_DURATION_MS = 1000; // Default animation duration
export const EASING_CURVE = t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; // easeInOutCubic

// Globe Click-to-Zoom-Tilt Animation
export const CLICK_ANIMATION_DURATION_MS = 1200;
export const CLICK_ZOOM_TILT_DEGREES = 45; // Target camera pitch/tilt in degrees
export const CLICK_ZOOM_TARGET_DISTANCE_FACTOR = 1.0; // Factor of globe radius for close-up distance
export const CLICK_ZOOM_INITIAL_AZIMUTH_DEGREES = 0; // Camera's horizontal angle after targeting tile
export const CLICK_ZOOM_INITIAL_POLAR_DEGREES = 0;  // Camera's vertical angle (looking straight at tile) before tilt aniamtion

// UI Tilt Slider Control (0-80 range)
export const UI_TILT_SLIDER_MAX_DEGREES = 80;
// At slider = 80:
export const UI_TILT_MAX_GLOBE_ROTATION_X_DEGREES = -45; // Globe pitches forward (negative X rotation)
export const UI_TILT_MAX_CAMERA_Y_OFFSET_FACTOR = 0.5; // Camera moves up by 0.5 * globeRadius
export const UI_TILT_MAX_CAMERA_DISTANCE_FACTOR = 1.2; // Camera moves closer, distance = 1.2 * globeRadius

// Default/Far Camera State (when UI Tilt slider is at 0)
export const INITIAL_CAMERA_DISTANCE_FACTOR = 3.0; // Default orbital distance (factor of globeRadius)
export const INITIAL_CAMERA_POLAR_DEGREES = 0; // Looking straight at equator
export const INITIAL_CAMERA_AZIMUTH_DEGREES = 0; // Facing front

// OrbitControls limits (can be used by CameraRig or setup)
export const MIN_ORBIT_POLAR_ANGLE_RAD = THREE.MathUtils.degToRad(5);  // Min pitch (looking slightly down)
export const MAX_ORBIT_POLAR_ANGLE_RAD = THREE.MathUtils.degToRad(175); // Max pitch (looking slightly up from below)
export const MIN_DISTANCE_FACTOR = 0.5; // Min zoom distance
export const MAX_DISTANCE_FACTOR = 10;  // Max zoom distance 