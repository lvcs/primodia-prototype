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

*   [ ] **1.1.** In `client/src/game/camera/camera.js` (or a new internal module like `cameraManager.js` which `camera.js` uses):
    *   [ ] Define an `initializeCameraSystem(canvasElement, initialWorldConfig)` function.
    *   [ ] **Inside `initializeCameraSystem`:**
        *   [ ] Get initial `fov`, `near`, `far`, `position`, `target`, `up` from `cameraStore.getState()` (which uses `getDefaultCameraState`).
        *   [ ] Create `THREE.PerspectiveCamera` instance using these initial values. Canvas aspect ratio will be needed.
        *   [ ] Create `OrbitControls` instance with the camera and `canvasElement`.
        *   [ ] Configure `OrbitControls` (damping, pan, min/max distance using `initialWorldConfig.radius` and factors from `gameConfig`, polar angles).
        *   [ ] Set initial camera position and target on `OrbitControls` based on store defaults: `controls.object.position.copy(storeState.position)`, `controls.target.copy(storeState.target)`, `controls.object.up.copy(storeState.up)`, then `controls.update()`.
        *   [ ] **Controls to Store Sync:** Attach `orbitControls.addEventListener('change', ...)` to call `useCameraStore.getState().syncFromOrbitControls(controls.object.position, controls.target, controls.object.up)`.
        *   [ ] **Store to Controls Sync:** Implement logic for this. This is the trickiest part. Ideas:
            *   The `camera.js` module can keep a reference to the created `camera` and `controls` instances.
            *   Subscribe `cameraStore` changes from within the `camera.js` module (outside of React components). When relevant store state (e.g. `target`, `position` set by an API call) changes, update `controls.target.copy()`, `controls.object.position.copy()`, `controls.object.up.copy()`, and call `controls.update()`.
            *   Similarly, for `fov`, `near`, `far`, update `camera.fov`, etc., and `camera.updateProjectionMatrix()`.
        *   [ ] Return `{ camera, controls }`.
    *   [ ] Add `getCameraInstance()` and `getControlsInstance()` to `camera.js` to return the managed instances.
*   [ ] **1.2.** `client/src/stores/cameraStore.js` (already largely updated, ensure actions are suitable for this new flow where API calls update store, and store updates trigger OrbitControls updates via the camera system).
    *   [ ] `syncFromOrbitControls` action remains as is.
    *   [ ] Actions like `setTarget`, `setPosition` will just update the store. The camera system's subscription handles pushing these to `OrbitControls`.
*   [ ] **1.3.** Modify `client/src/game/core/setup.js`:
    *   [ ] Remove direct `PerspectiveCamera` and `OrbitControls` creation.
    *   [ ] Import `initializeCameraSystem` from `camera.js`.
    *   [ ] Call `initializeCameraSystem(canvasElement, worldConfig)` and use the returned `camera` and `controls`.
*   [ ] **1.4.** `GLOBE_RADIUS` access for `latitudeLongitudeToXYZ` (remains in `camera.js`, imports from `gameConfig`).

### Phase 2: Basic API Implementation (Interacting with Store/Managed Instances)

*   [ ] **2.1.** Implement non-animating parts of API functions in `camera.js`:
    *   [ ] `getLookAt()`: Reads `target` from `cameraStore.getState()`.
    *   [ ] `getCameraPosition()`: Reads `position` from `cameraStore.getState()`.
    *   [ ] `getDistance()`: Uses `getControlsInstance()` to get controls, then `controls.getDistance()`. Handle if controls not initialized.
    *   [ ] `getViewMode()`: Reads from `cameraStore.getState()`.
    *   [ ] `isAnimating()`: Reads from `cameraStore.getState()`.
    *   [ ] `latitudeLongitudeToXYZ(...)`: Pure utility.

### Phase 3: Animation Logic & Animating API Functions (Driving Managed OrbitControls)

*   [ ] **3.1.** Animation utility (`animationUtils.js`) - same as before.
*   [ ] **3.2.** Implement animating API functions in `camera.js`. These will use `getControlsInstance()` and `getCameraInstance()`.
    *   [ ] `lookAt(x, y, z, animate, ...)`:
        *   If not animating: `controls.target.set(x,y,z); controls.update();` (Store syncs via 'change' event).
        *   If animating: `useCameraStore.getState().setAnimating(true);` Animate `controls.target` and `controls.object.position` (if needed), calling `controls.update()` each frame. `useCameraStore.getState().setAnimating(false);` on complete.
    *   [ ] `setDistance(distance, animate, ...)`:
        *   Calculate new camera position. If not animating: `controls.object.position.copy(newPos); controls.update();`.
        *   If animating: Animate `controls.object.position` to newPos, calling `controls.update()` each frame.
    *   [ ] `setViewMode(mode, animate, ...)`:
        *   Get view config. If not animating: update `controls.target`, `controls.object.position`, `controls.object.up`; call `controls.update()`. Update store `viewMode`.
        *   If animating: Animate controls properties. Update store `viewMode`.
    *   [ ] `focusOnLatLong(...)`: Chain `lookAt` and `setDistance`.

### Phase 4: Fine-tuning Synchronization and Camera Properties (Focus in `camera.js`)

*   [ ] **4.1.** Ensure the **Store to Controls Sync** within `camera.js` (or its internal module) is robust. Test that API calls that modify store state (e.g., `setTarget` via API -> store change) correctly update the `OrbitControls` instance and the rendered view.
*   [ ] **4.2.** Ensure `PerspectiveCamera` properties like `fov` (if changed via `cameraStore.setFov`) correctly update `cameraInstance.fov` and trigger `cameraInstance.updateProjectionMatrix()` from within the camera system's store subscription.

### Phase 5: Refactor Existing Code

*   [ ] **5.1.** Update `client/src/game/core/eventHandlers.js`:
    *   [ ] Remove imports of old camera classes.
    *   [ ] Import and use functions from `camera.js`.
*   [ ] **5.2.** Delete old camera controller files:
    *   [ ] `client/src/game/camera/BaseCameraController.js`
    *   [ ] `client/src/game/camera/TileCameraController.js`
    *   [ ] `client/src/game/camera/CameraOrbitController.js`
    *   [ ] `client/src/game/camera/Camera.js` (the old class)
*   [ ] **5.3.** Search codebase for any other usages of the old camera system and update them.

### Phase 6: Testing and Refinement

*   [ ] **6.1.** Test all API functions thoroughly, including animations.
*   [ ] **6.2.** Test user interaction via `OrbitControls` and ensure store syncs correctly.
*   [ ] **6.3.** Test view modes.
*   [ ] **6.4.** Verify keyboard controls (if any are linked to camera) still work via `eventHandlers.js` and new API (may involve OrbitControls key bindings).
*   [ ] **6.5.** Performance testing.
*   [ ] **6.6.** Review and refine code.

## 4. Debugging Log (To be filled during implementation)

*   **Issue:**
    *   **Solution:** 