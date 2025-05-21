# Camera Refactor Plan

## 1. Potential Solutions

### Solution A: Minimal Pure Functions + Zustand

*   **Description:** Create a `camera.js` with pure functions that directly manipulate a `cameraStore.js` (Zustand). Animations are handled by utility functions (e.g., a simple tweening mechanism or integrating a micro-library like TWEEN.js) called from the API, which update the store incrementally. The Three.js camera object in the main scene subscribes to the store and updates itself reactively.
*   **Pros:**
    *   Aligns perfectly with the "no classes" and "functional API" requirements.
    *   Clear separation of concerns: API for control, Store for state, Three.js for rendering.
    *   Zustand provides efficient state management and React bindings.
    *   Relatively straightforward to implement.
*   **Cons:**
    *   Animation logic needs careful implementation to ensure smooth updates to the store and subsequently the camera.
    *   Reactive updates from store to Three.js camera need to be efficient.

### Solution B: Service-Oriented Approach with Event Emitter

*   **Description:** A `CameraService` module (not a class, but a collection of functions and an internal state managed perhaps with a simple object or a vanilla Zustand store). It would emit events for camera changes. API functions would call methods in this service. The Three.js camera would listen to these events.
*   **Pros:**
    *   Decouples the camera logic from React components more explicitly if Zustand hooks are not desired directly in the game loop.
    *   Could be easier to integrate with non-React parts of the game if any.
*   **Cons:**
    *   Still requires a state management solution internally, potentially reinventing parts of what Zustand offers.
    *   Event emitters can become complex to debug ("who triggered what?").
    *   Less aligned with the "two-way bind all camera properties with the `cameraStore` (Zustand store)" requirement if a separate eventing mechanism is the primary way of communication.

### Solution C: Class-based approach (Ruled out by requirements)

*   **Description:** Encapsulate all logic within a CameraManager class.
*   **Pros:** Traditional OOP, might be familiar.
*   **Cons:** Directly violates the "no classes" and "no inheritance" requirements.

## 2. Decision

**Solution A: Minimal Pure Functions + Zustand** is the most promising.

*   It directly addresses all core requirements: functional API, no classes, Zustand for state.
*   Zustand's nature is well-suited for reactive updates to the Three.js camera.
*   The clear separation of API, state, and rendering logic will lead to a maintainable and understandable system.
*   The animation challenges can be mitigated by using a robust tweening approach and ensuring store updates are batched or throttled if performance issues arise (though unlikely with Zustand's efficiency).

## 3. Implementation TODO

### Phase 1: Centralized Camera System Setup (`client/src/game/camera/`)

*   [x] **1.1.** In `client/src/game/camera/cameraSystem.js`:
    *   [x] Define an `initializeCameraSystem(canvasElement, initialWorldConfig)` function.
    *   [x] **Inside `initializeCameraSystem`:**
        *   [x] Get initial `fov`, `near`, `far` from CONFIG
        *   [x] Get  `position`, `target`, `up` from `cameraStore.getState()` (which uses `getDefaultCameraState`).
        *   [x] Create `THREE.PerspectiveCamera` instance using these initial values. Canvas aspect ratio will be needed.
        *   [x] Create `OrbitControls` instance with the camera and `canvasElement`.
        *   [x] Configure `OrbitControls` (damping, pan, min/max distance using `initialWorldConfig.radius` and factors from `gameConfig`, polar angles).
        *   [x] Set initial camera position and target on `OrbitControls` based on store defaults: `controls.object.position.copy(storeState.position)`, `controls.target.copy(storeState.target)`, `controls.object.up.copy(storeState.up)`, then `controls.update()`.
        *   [x] **Controls to Store Sync:** Attach `orbitControls.addEventListener('change', ...)` to call `useCameraStore.getState().syncFromOrbitControls(controls.object.position, controls.target, controls.object.up)`.
        *   [x] **Store to Controls Sync:** Implement logic for this.
        *   [x] Return `{ camera, controls }`.
    *   [x] Add `getCameraInstance()` and `getControlsInstance()` to `camera.js` to return the managed instances.
*   [x] **1.2.** `client/src/stores/cameraStore.js` (already largely updated, ensure actions are suitable for this new flow where API calls update store, and store updates trigger OrbitControls updates via the camera system).
    *   [x] `syncFromOrbitControls` action remains as is.
    *   [x] Actions like `setTarget`, `setPosition` will just update the store. The camera system's subscription handles pushing these to `OrbitControls`.
*   [x] **1.3.** Modify `client/src/game/core/setup.js`:
    *   [x] Remove direct `PerspectiveCamera` and `OrbitControls` creation.
    *   [x] Import `initializeCameraSystem` from `camera.js`.
    *   [x] Call `initializeCameraSystem(canvasElement, worldConfig)` and use the returned `camera` and `controls`.
    *   [x] **Complete responsibility shift:** All camera and controls creation, configuration, and setup now belongs in the camera system, not in setup.js.
    *   [x] Remove the `setupOrbitControls` function entirely, as this functionality should now be handled by `initializeCameraSystem`.
    *   [x] Update `setupThreeJS` to no longer create a camera - it should only create the scene and renderer.


### Phase 2: Basic API Implementation (Interacting with Store/Managed Instances)

*   [x] **2.1.** Implement non-animating parts of API functions in `camera.js`:
    *   [x] `getLookAt()`: Reads `target` from `cameraStore.getState()`.
    *   [x] `getCameraPosition()`: Reads `position` from `cameraStore.getState()`.
    *   [x] `getDistance()`: Uses `getControlsInstance()` to get controls, then `controls.getDistance()`. Handle if controls not initialized.
    *   [x] `getViewMode()`: Reads from `cameraStore.getState()`.
    *   [x] `isAnimating()`: Reads from `cameraStore.getState()`.


### Phase 3: Animation Logic & Animating API Functions (Driving Managed OrbitControls)

*   [x] **3.1.** Animation utility (`animationUtils.js`) - same as before.
*   [x] **3.2.** Implement animating API functions in `camera.js`. These will use `getControlsInstance()` and `getCameraInstance()`.
    *   [x] `lookAt(x, y, z, animate, ...)`:
        *   If not animating: `controls.target.set(x,y,z); controls.update();` (Store syncs via 'change' event).
        *   If animating: `useCameraStore.getState().setAnimating(true);` Animate `controls.target` and `controls.object.position` (if needed), calling `controls.update()` each frame. `useCameraStore.getState().setAnimating(false);` on complete.
    *   [x] `setDistance(distance, animate, ...)`:
        *   Calculate new camera position. If not animating: `controls.object.position.copy(newPos); controls.update();`.
        *   If animating: Animate `controls.object.position` to newPos, calling `controls.update()` each frame.
    *   [x] `setViewMode(mode, animate, ...)`:
        *   Get view config. If not animating: update `controls.target`, `controls.object.position`, `controls.object.up`; call `controls.update()`. Update store `viewMode`.
        *   If animating: Animate controls properties. Update store `viewMode`.
    *   [x] `focusOnLatLong(...)`: Chain `lookAt` and `setDistance`.

### Phase 4: Fine-tuning Synchronization and Camera Properties (Focus in `camera.js`)

*   [x] **4.1.** Ensure the **Store to Controls Sync** within `camera.js` (or its internal module) is robust. Test that API calls that modify store state (e.g., `setTarget` via API -> store change) correctly update the `OrbitControls` instance and the rendered view.


### Phase 4B: Keyboard Control Integration

*   [x] **4B.1.** Import and integrate keyboard controls from `@config/keyboardConfig.js`:
    *   [x] Create a new file `client/src/game/camera/keyboardControls.js` that:
        *   [x] Imports `Actions` and `getActionForKey` from `@config/keyboardConfig.js`
        *   [x] Imports camera API functions from `camera.js`
        *   [x] Exports a `handleKeyboardAction(action)` function that maps keyboard actions to camera operations
        *   [x] Maps `ZOOM_IN`/`ZOOM_OUT` to appropriate `setDistance` calls
        *   [x] Maps `ROTATE_NORTH`/`ROTATE_SOUTH`/`ROTATE_EAST`/`ROTATE_WEST` to appropriate camera rotation operations
*   [x] **4B.2.** Update `initializeCameraSystem` to accept an optional `enableKeyboardControls` parameter (default: true)
*   [x] **4B.3.** Ensure the new keyboard controls function correctly with the camera API and don't conflict with any default OrbitControls keyboard bindings

### Phase 4C: Control Panel Integration

*   [ ] **4C.1.** Ensure the control-panel camera tab correctly reads from and updates the cameraStore:
    *   [ ] Update the control-panel camera tab component to use the cameraStore for displaying current target (x, y, z) and zoom values
    *   [ ] Implement input handlers in the control-panel that update the cameraStore when users change values
    *   [ ] Connect any control panel camera buttons/controls to the appropriate camera API functions
    *   [ ] Test that changes from the control panel are reflected in the actual camera view
    *   [ ] Test that camera changes from other sources (API, OrbitControls interaction) are reflected in the control panel
*   [ ] **4C.2.** Ensure all numeric inputs are properly formatted and validated
*   [ ] **4C.3.** Add any necessary debouncing for control panel inputs to prevent performance issues during rapid changes

### Phase 5: Refactor Existing Code

*   [x] **5.1.** Update `client/src/game/core/eventHandlers.js`:
    *   [x] Remove imports of old camera classes.
    *   [x] Import and use functions from `camera.js`.
*   [x] **5.2.** Delete old camera controller files:
    *   [x] `client/src/game/camera/BaseCameraController.js`
    *   [x] `client/src/game/camera/TileCameraController.js`
    *   [x] `client/src/game/camera/CameraOrbitController.js`
    *   [x] `client/src/game/camera/Camera.js` (the old class)
*   [x] **5.3.** Search codebase for any other usages of the old camera system and update them.

### Phase 6: Testing and Refinement

*   [ ] **6.1.** Test all API functions thoroughly, including animations.
*   [ ] **6.2.** Test user interaction via `OrbitControls` and ensure store syncs correctly.
*   [ ] **6.3.** Test view modes.
*   [ ] **6.4.** Verify keyboard controls (if any are linked to camera) still work via `eventHandlers.js` and new API (may involve OrbitControls key bindings).
*   [ ] **6.5.** Performance testing.
*   [ ] **6.6.** Review and refine code.

## 4. Debugging Log (To be filled during implementation)

*   **Issue: File case sensitivity conflicts**
    *   **Solution:** Created a renamed file `cameraSystem.js` instead of `camera.js` to avoid conflicts with existing `Camera.js` (PascalCase). This fixed linting errors about file name casing.
*   **Issue: OrbitController integration with keyboard/mouse controls**
    *   **Solution:** Simplified control handlers by directly using our new camera API functions from keyboard actions rather than relying on separate orbitController instances.
*   **Issue: Camera state management**
    *   **Solution:** Completely refactored cameraStore to match the new requirements, with position, target and up vector maintaining the single source of truth. 