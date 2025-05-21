/**
 * Simple animation utility for camera transitions
 */

/**
 * Animates a value over time using requestAnimationFrame
 * @param {Object} options - Animation options
 * @param {number} options.duration - Duration in milliseconds
 * @param {Function} options.easing - Easing function that takes progress (0-1) and returns adjusted progress
 * @param {Function} options.onUpdate - Function called on each frame with current progress (0-1)
 * @param {Function} options.onComplete - Function called when animation completes
 */
export function animate({ duration, easing, onUpdate, onComplete }) {
  const startTime = performance.now();
  
  const tick = (currentTime) => {
    let elapsed = currentTime - startTime;
    let rawProgress = Math.min(elapsed / duration, 1);
    let progress = easing ? easing(rawProgress) : rawProgress;
    
    onUpdate(progress);
    
    if (rawProgress < 1) {
      requestAnimationFrame(tick);
    } else {
      if (onComplete) onComplete();
    }
  };
  
  requestAnimationFrame(tick);
} 