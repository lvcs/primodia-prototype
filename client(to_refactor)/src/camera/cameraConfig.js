// The duration (in milliseconds) for camera animations. 1000 ms = 1 second.
export const ANIMATION_DURATION_MS = 1500; // milliseconds

/**
 * Ease-in-out cubic easing function.
 * This function makes animations start slow, speed up, then slow down again at the end.
 * This feels more natural than moving at a constant speed.
 * @param {number} t - Time progress, a value between 0 (start) and 1 (end).
 * @returns {number} Eased progress value, also between 0 and 1.
 */
export const EASING_CURVE = t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; 