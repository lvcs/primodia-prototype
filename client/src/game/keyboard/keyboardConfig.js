export const KEYBOARD_BINDINGS = {
  zoomIn: ['Equal', 'NumpadAdd'],
  zoomOut: ['Minus', 'NumpadSubtract'],
  rotateNorth: ['ArrowUp'],
  rotateSouth: ['ArrowDown'],
  rotateEast: ['ArrowRight'],
  rotateWest: ['ArrowLeft'],
};

export const KEYBOARD_ACTIONS = {
  ZOOM_IN: 'ZOOM_IN',
  ZOOM_OUT: 'ZOOM_OUT',
  ROTATE_NORTH: 'ROTATE_NORTH',
  ROTATE_SOUTH: 'ROTATE_SOUTH',
  ROTATE_EAST: 'ROTATE_EAST',
  ROTATE_WEST: 'ROTATE_WEST',
};

// Helper to map key codes to actions
export function getActionForKey(keyCode) {
  if (KEYBOARD_BINDINGS.zoomIn.includes(keyCode)) return KEYBOARD_ACTIONS.ZOOM_IN;
  if (KEYBOARD_BINDINGS.zoomOut.includes(keyCode)) return KEYBOARD_ACTIONS.ZOOM_OUT;
  if (KEYBOARD_BINDINGS.rotateNorth.includes(keyCode)) return KEYBOARD_ACTIONS.ROTATE_NORTH;
  if (KEYBOARD_BINDINGS.rotateSouth.includes(keyCode)) return KEYBOARD_ACTIONS.ROTATE_SOUTH;
  if (KEYBOARD_BINDINGS.rotateEast.includes(keyCode)) return KEYBOARD_ACTIONS.ROTATE_EAST;
  if (KEYBOARD_BINDINGS.rotateWest.includes(keyCode)) return KEYBOARD_ACTIONS.ROTATE_WEST;
  return null;
} 