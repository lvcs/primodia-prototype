import * as THREE from 'three';
import { DEFAULT_ANIMATION_DURATION_MS, DEFAULT_EASING_CURVE, CAMERA_EASINGS } from '@config/cameraConfig';

/**
 * Simple tweening function.
 * @param {object} options
 * @param {object} options.startValue - The starting value (scalar or THREE.Vector3).
 * @param {object} options.endValue - The ending value (scalar or THREE.Vector3).
 * @param {number} [options.duration=DEFAULT_ANIMATION_DURATION_MS] - Duration of the animation in ms.
 * @param {Function} [options.easing=CAMERA_EASINGS[DEFAULT_EASING_CURVE]] - Easing function (e.g., t => t for linear).
 * @param {Function} options.onUpdate - Callback function called with the tweened value on each frame.
 * @param {Function} [options.onComplete] - Callback function called when the animation completes.
 * @returns {Function} A function to cancel the animation frame request.
 */
export function tweenValue({ 
  startValue,
  endValue,
  duration = DEFAULT_ANIMATION_DURATION_MS,
  easing = CAMERA_EASINGS[DEFAULT_EASING_CURVE] || ((t) => t), // Fallback to linear if default not found
  onUpdate,
  onComplete,
}) {
  let animationFrameId;
  const startTime = performance.now();

  const isVector = startValue instanceof THREE.Vector3 && endValue instanceof THREE.Vector3;
  
  // Ensure endValue is cloned if it's a vector to avoid modifying the original
  const targetEndValue = isVector ? endValue.clone() : endValue;
  // Clone startValue as well if it's a vector
  const currentAnimatedValue = isVector ? startValue.clone() : startValue;

  function animate() {
    const elapsedTime = performance.now() - startTime;
    let progress = Math.min(elapsedTime / duration, 1);
    const easedProgress = easing(progress);

    if (isVector) {
      currentAnimatedValue.lerpVectors(startValue, targetEndValue, easedProgress);
      onUpdate(currentAnimatedValue.clone()); // Pass clone to prevent modification by consumer
    } else { // Scalar
      const newValue = startValue + (targetEndValue - startValue) * easedProgress;
      onUpdate(newValue);
    }

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      // Ensure final value is set precisely
      if (isVector) {
        onUpdate(targetEndValue.clone());
      } else {
        onUpdate(targetEndValue);
      }
      if (onComplete) {
        onComplete();
      }
    }
  }

  animationFrameId = requestAnimationFrame(animate);

  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };
} 