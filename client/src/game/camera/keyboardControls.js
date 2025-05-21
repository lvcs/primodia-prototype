import { Actions, getActionForKey } from '@config/keyboardConfig';
import { getCameraInstance, getControlsInstance, setDistance, latitudeLongitudeToXYZ, lookAt } from './cameraSystem';
import { KEYBOARD_ZOOM_SPEED, GLOBE_RADIUS } from '@config/gameConfig';
import * as THREE from 'three';

/**
 * Process a keyboard action for camera controls
 * @param {string} action - The action from keyboardConfig.Actions
 * @returns {boolean} - Whether the action was handled
 */
export function handleKeyboardAction(action) {
  const camera = getCameraInstance();
  const controls = getControlsInstance();
  
  if (!camera || !controls) return false;
  
  switch (action) {
    case Actions.ZOOM_IN:
      setDistance(controls.getDistance() * (1 - KEYBOARD_ZOOM_SPEED), true);
      return true;
      
    case Actions.ZOOM_OUT:
      setDistance(controls.getDistance() * (1 + KEYBOARD_ZOOM_SPEED), true);
      return true;
      
    case Actions.ROTATE_NORTH:
      rotateCamera(0, -10);
      return true;
      
    case Actions.ROTATE_SOUTH:
      rotateCamera(0, 10);
      return true;
      
    case Actions.ROTATE_EAST:
      rotateCamera(10, 0);
      return true;
      
    case Actions.ROTATE_WEST:
      rotateCamera(-10, 0);
      return true;
      
    default:
      return false;
  }
}

/**
 * Rotates the camera around the globe by changing the lookAt target
 * @param {number} longitudeDelta - Degrees to rotate longitude
 * @param {number} latitudeDelta - Degrees to rotate latitude
 */
function rotateCamera(longitudeDelta, latitudeDelta) {
  const controls = getControlsInstance();
  if (!controls) return;
  
  // Get current target position
  const target = controls.target;
  
  // Convert target to latitude/longitude
  const targetVector = new THREE.Vector3().copy(target).normalize();
  const latitude = Math.asin(targetVector.y) * (180 / Math.PI);
  const longitude = Math.atan2(targetVector.z, targetVector.x) * (180 / Math.PI);
  
  // Calculate new latitude/longitude
  const newLatitude = Math.max(-85, Math.min(85, latitude + latitudeDelta));
  const newLongitude = (longitude + longitudeDelta) % 360;
  
  // Convert back to XYZ
  const newTarget = latitudeLongitudeToXYZ(newLatitude, newLongitude, GLOBE_RADIUS);
  
  // Update camera target
  lookAt(newTarget.x, newTarget.y, newTarget.z, true);
} 