# Camera Debug Plan

## Objectives
- Provide sliders on `CameraRig` for:
  - `lookAt` target coordinates (X, Y, Z).
  - Zoom distance (distance from the target point).
- Provide sliders on the `Camera` child for local rotations (pitch, yaw, roll).
- Verify that the rig-based approach correctly decouples translation (target & zoom) from camera rotations and document any limitations.

## Potential Solutions
1. **Parent-Child Camera Hierarchy**
   - Attach a child camera to a parent object locked via `lookAt`. Apply roll/rotation on the child.
   - Pros: Utilizes Three.js scene graph; easy to visualize separate transforms.
   - Cons: Additional object overhead; more scene management complexity.

2. **Quaternion Composition**
   - Compute an orientation quaternion from `lookAt`, then compose with a roll quaternion about the camera's forward axis.
   - Pros: Direct control without extra objects; minimal overhead.
   - Cons: Requires quaternion math; potential for gimbal issues if misapplied.

3. **Custom View Matrix Construction**
   - Manually build the camera's view matrix by combining translation, target alignment, and rotation steps.
   - Pros: Maximum low-level control.
   - Cons: Higher complexity; error-prone matrix math.

## Solution Evaluation
| Solution                   | Pros                                     | Cons                                      |
|----------------------------|------------------------------------------|-------------------------------------------|
| Parent-Child Hierarchy     | Leverages scene graph; intuitive          | Slight overhead; extra object management. |
| Quaternion Composition     | Precise control; no extra objects         | Requires quaternion expertise; edge cases.|
| Custom View Matrix         | Full control; flexible                    | Low-level; high complexity.               |

**Decision:**
We will proceed with the **Parent-Child Camera Hierarchy** approach for its easier calculations, simpler code structure, and more straightforward debugging.

## Implementation TODO
- [ ] Create a parent `Object3D` called `CameraRig` to isolate orientation transforms and attach the camera as its child (camera fixed at rig origin).
- [ ] Extend debug panel UI to include sliders for:
  - `lookAt` target coordinates (X, Y, Z) (default to 0, 0, 0 for globe view).
  - local camera rotations around X, Y, and Z axes (pitch, yaw, roll).
  - zoom distance: specify the distance of `CameraRig` from the lookAt target.
- [ ] On slider changes, update:
  - `cameraRig.lookAt(targetX, targetY, targetZ)` to orient the rig toward the target point.
  - `camera.rotation.set(rotX, rotY, rotZ)` (in radians) to apply child camera rotations.
- [ ] Test zoom logic:
  - Compute direction vector from target to rig:
    ```js
    const dir = new THREE.Vector3();
    cameraRig.getWorldDirection(dir).negate();
    ```
  - Update `cameraRig.position` to `targetVector.clone().add(dir.multiplyScalar(zoomDistance));` to set the desired distance.
- [ ] Integrate these updates into the render loop for real-time debugging feedback.
- [ ] Write test cases to confirm:
  - Rig points at the correct target.
  - Camera child rotations (pitch, yaw, roll) are independent.
  - Zoom distance is applied correctly.
- [ ] Document any debugging insights or technical constraints encountered during implementation.

## Notes
- The `CameraRig` locked to the target point simplifies globe view tuning, while dynamic targeting supports tile view and other pivots.
- Camera child remains fixed at the rig origin and cannot translate; it only rotates based on slider values.
- Zoom is now refactored to move the `CameraRig` closer to or farther from the target point, preserving existing zoom UX.
- Record any debugging insights or challenges encountered during development.

## Debugging Insights and Known Issues

- Issue: Panning (rotating) left or right via mouse drag (CameraOrbitController) or keyboard arrows also changes the camera's zoom (radius), resulting in unintended zoom when rotating.
- Investigation: The `CameraOrbitController.rotate()` method recalculates the camera position based on its `radius`, and because the debug rig integration derives zoom distance from `cameraRig.position.length()`, subsequent calls to `rotate()` and `zoom` can interact unexpectedly.

### Potential Solutions
1. Refactor `CameraOrbitController` to operate directly on the `CameraRig` parent instead of the child camera, so rotation only affects child orientation and does not adjust parent radius.
2. Separate rotation and zoom state entirely: maintain distinct state variables for rotation angles (phi, theta) and zoom distance, then on each frame compute the rig position from these cleanly without coupling.
3. Delegate panning/rotation to Three.js `OrbitControls` exclusively and reserve the debug rig only for manual slider-driven transforms, disabling orbit-based zooming.

### Proposed Approach
We will pursue solution #2 in the short term for minimal changes: store independent `rotationAngles` and a separate `zoomDistance` state in the debug module, then derive `cameraRig.position` from these on each UI change or animation step. This ensures that rotate operations only modify angles and do not accidentally modify zoom.

- [ ] Define state variables `[phi, theta]` and `zoomDistance` in the debug module.
- [ ] Update `applyCameraDebugControls()` to use these states when computing `cameraRig.position`.
- [ ] Modify `CameraOrbitController.rotate()` to update only rotation angles without recalculating radius.
- [ ] Disable `CameraOrbitController.zoom()` or redirect it to update `zoomDistance` state.
- [ ] Test that rotate and zoom sliders/controls operate independently with no side effects.

## Next Steps
- Implement the refactored state in `debug.js` and update `CameraOrbitController` accordingly.
- Write test cases to verify that rotation does not change zoom and vice versa.
- Document findings and any residual limitations.