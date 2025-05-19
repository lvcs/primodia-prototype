# Camera Debug Requirements

## Camera Control Panel
- Provide sliders on `CameraRig` for:
  - `lookAt` target coordinates (X, Y, Z).
  - Zoom distance (distance from the lookAt target).
- Provide sliders on the `Camera` child for local rotations:
  - Pitch (rotation around the X axis).
  - Yaw (rotation around the Y axis).
  - Roll (rotation around the Z axis).

## Technical Investigation
- Determine feasibility of using a parent-child rig to decouple lookAt, zoom, and camera rotations:
  - Can `CameraRig.lookAt` target and rig position (zoom) be controlled independently?
  - Can the `Camera` child maintain independent pitch, yaw, and roll rotations without affecting the lookAt target?
  - If possible, document the approach and any limitations.
  - If not possible, document technical constraints or propose alternatives.
