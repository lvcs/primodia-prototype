import * as THREE from 'three';

// Animation
export const DEFAULT_ANIMATION_DURATION_MS = 750;
export const EASING_CURVE_FUNCTION = t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad

// Camera Rig Starting Values
export const INITIAL_CAMERA_YAW_DEG = 0;
export const INITIAL_CAMERA_PITCH_DEG = 45; // Angle from XZ plane (0 = horizon, 90 = top-down)
export const INITIAL_CAMERA_DISTANCE_FACTOR = 2.5; // Multiplied by globe radius

// Camera Rig Limits
// Pitch is angle from XZ plane towards Y. 0 = horizon, 90 = top down.
// We define "tilt" in UI as 0 = top-down, 80 = very oblique.
// So, MinPitch for rig = 90 - MaxUITilt, MaxPitch for rig = 90 - MinUITilt
export const MIN_UI_TILT_DEG = 0;    // Corresponds to max pitch (e.g., 90 deg)
export const MAX_UI_TILT_DEG = 85;   // Corresponds to min pitch (e.g., 5 deg)

export const MIN_PITCH_RAD = THREE.MathUtils.degToRad(90 - MAX_UI_TILT_DEG); // e.g., 5 degrees from horizon
export const MAX_PITCH_RAD = THREE.MathUtils.degToRad(90 - MIN_UI_TILT_DEG); // e.g., 90 degrees (straight down)

export const MIN_DISTANCE_FACTOR = 1.1; // Multiplied by globe radius
export const MAX_DISTANCE_FACTOR = 10.0; // Multiplied by globe radius

// Interaction
export const MOUSE_DRAG_SENSITIVITY_YAW = 0.005; // Radians per pixel
export const MOUSE_DRAG_SENSITIVITY_PITCH = 0.005; // Radians per pixel
export const MOUSE_WHEEL_ZOOM_SENSITIVITY = 0.001; // Distance change per wheel delta unit

// ADD Keyboard interaction constants
export const KEYBOARD_YAW_STEP_RAD = THREE.MathUtils.degToRad(2.5); // Radians per key press interval for yaw
export const KEYBOARD_PITCH_STEP_RAD = THREE.MathUtils.degToRad(2.5); // Radians per key press interval for pitch
export const KEYBOARD_ZOOM_STEP_FACTOR = 0.05; // Zoom by 5% of current distance per key press interval
export const KEYBOARD_ANIMATION_DURATION_MS = 100; // Short animation for keyboard steps

// Click-to-tile behavior
export const CLICK_FOCUS_TILT_DEG = 60; // Target tilt when focusing on a tile
export const CLICK_FOCUS_DISTANCE_FACTOR = 1.5; // Target distance (factor of globe radius) when focusing

// Old constants (may or may not be used, kept for now)
export const ANIMATION_DURATION_MS = 750; // From old cameraConfig
export const TILT_ANGLE_DEG = 80; // From old cameraConfig, likely superseded by MAX_UI_TILT_DEG
export const EASING_CURVE = t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // From old cameraConfig 