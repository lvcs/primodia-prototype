export const ANIMATION_DURATION_MS = 1500; // milliseconds

/**
 * Ease-in-out cubic easing function.
 * @param {number} t - Time progress, a value between 0 and 1.
 * @returns {number} Eased progress value.
 */
export const EASING_CURVE = t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; 