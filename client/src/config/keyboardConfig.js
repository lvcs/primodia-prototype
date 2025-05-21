export const Keybindings = {
  zoomIn: ['Equal', 'NumpadAdd'],
  zoomOut: ['Minus', 'NumpadSubtract'],
  rotateNorth: ['ArrowUp'],
  rotateSouth: ['ArrowDown'],
  rotateEast: ['ArrowRight'],
  rotateWest: ['ArrowLeft'],
};

export const Actions = {
  ZOOM_IN: 'ZOOM_IN',
  ZOOM_OUT: 'ZOOM_OUT',
  ROTATE_NORTH: 'ROTATE_NORTH',
  ROTATE_SOUTH: 'ROTATE_SOUTH',
  ROTATE_EAST: 'ROTATE_EAST',
  ROTATE_WEST: 'ROTATE_WEST',
};

// Helper to map key codes to actions
export function getActionForKey(keyCode) {
  if (Keybindings.zoomIn.includes(keyCode)) return Actions.ZOOM_IN;
  if (Keybindings.zoomOut.includes(keyCode)) return Actions.ZOOM_OUT;
  if (Keybindings.rotateNorth.includes(keyCode)) return Actions.ROTATE_NORTH;
  if (Keybindings.rotateSouth.includes(keyCode)) return Actions.ROTATE_SOUTH;
  if (Keybindings.rotateEast.includes(keyCode)) return Actions.ROTATE_EAST;
  if (Keybindings.rotateWest.includes(keyCode)) return Actions.ROTATE_WEST;
  return null;
} 