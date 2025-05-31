# PLAN: Camera Control Enhancements

## 1. Objective
Address issues with camera zoom synchronization with `cameraStore`, initialization, hardcoded distance values, and incorrect camera control assumptions, as outlined in `Requirements.md`.

## 2. Potential Solutions

### Solution A: Direct CameraStore Update from Game Engine
- **Description:** The game camera directly updates the `cameraStore.zoom` value in real-time as the camera's zoom attribute changes.
- **Pros:** Ensures `cameraStore` always reflects the absolute latest game camera zoom.
- **Cons:** Could lead to a high frequency of store updates, potentially impacting UI rendering performance if not managed (e.g., with debouncing or throttling). Difficult to manage bi-directional updates if UI also needs to command the camera zoom.

### Solution B: Event-Driven Updates
- **Description:** The game camera emits zoom change events. The `cameraStore` subscribes to these events. Conversely, UI actions update `cameraStore`, which then emits an event or calls a function to adjust the game camera.
- **Pros:** Decouples the camera system from the store. More controlled updates.
- **Cons:** Requires careful event management to prevent race conditions, missed updates, or circular dependencies. Can become complex if many components interact with zoom.

### Solution C: Combined Approach (Throttled Direct Updates + Controlled Bi-directional Sync)
- **Description:** 
    1.  Game camera zoom changes (e.g., via mouse wheel) directly update `cameraStore.zoom`, but these updates are throttled to prevent performance issues.
    2.  UI interactions or programmatic changes that need to set a specific zoom level will update `cameraStore.zoom`. A listener/effect on `cameraStore.zoom` will then command the game camera to adjust to this new zoom level.
    3.  Initialize `cameraStore.zoom` on game load using a default constant (e.g., `CAMERA_PLANET_VIEW_DISTANCE`).
    4.  Systematically replace hardcoded camera distance values (like `16000`) with defined constants (`CAMERA_PLANET_VIEW_DISTANCE`, `CAMERA_TILE_VIEW_DISTANCE`).
- **Pros:** Balanced approach. Provides responsiveness for direct camera manipulation while maintaining control for UI-initiated changes. Addresses initialization and constant usage.
- **Cons:** Slightly more complex to implement than a single-direction update mechanism, but offers better overall behavior and maintainability.

## 3. Chosen Solution
**Solution C: Combined Approach** is selected. It offers the best balance of responsiveness, performance, and controlled synchronization for both game-driven and UI-driven zoom changes, while also directly addressing the initialization and hardcoding problems.

## 4. Implementation TODO

### [X] **Phase 1: Constants and Initialization**
-   [X] **Define/Locate Constants:**
    -   [X] Identify or create a dedicated configuration file for camera settings (`client/src/config/cameraConfig.js`).
    -   [X] Define `CAMERA_PLANET_VIEW_DISTANCE` (`16000`) and `CAMERA_TILE_VIEW_DISTANCE` (`6800`).
-   [X] **CameraStore Initialization:**
    -   [X] Import `CAMERA_PLANET_VIEW_DISTANCE` and `CAMERA_TILE_VIEW_DISTANCE`.
    -   [X] Set the initial `zoom` state appropriately based on view mode.

### [ ] **Phase 2: Synchronization Logic**
-   [X] **Identify Core Camera Control:** 
    -   [X] Initially assumed `CameraOrbitController.js` was the primary controller.
    -   [X] **Correction:** Discovered `client/src/game/camera/Camera.js` is the main manager, delegating to `PlanetCameraController.js` and `TileCameraController.js`. It interacts with `THREE.OrbitControls` but doesn't solely rely on a separate `CameraOrbitController` for all state management and store updates.
-   [ ] **Game Camera to CameraStore Sync:**
    -   [X] `Camera.js` has an `_updateCameraStoreState` method.
    -   [X] **FIXED:** Modified `_updateCameraStoreState` to correctly calculate camera distance from target (using `orbitControls.getDistance()` or `position.distanceTo(target)`) instead of using `PerspectiveCamera.zoom` property for the store's zoom value.
    -   [X] **FIXED:** Ensured that `animateToPlanet` and `animateToTile` in `Camera.js` pass the correct target distances (`CAMERA_PLANET_VIEW_DISTANCE`, `CAMERA_TILE_VIEW_DISTANCE`) to `_updateCameraStoreState` instead of `1.0`.
    -   [ ] **TODO:** Need to verify that general mouse wheel zooming (if handled by `THREE.OrbitControls` directly) and other camera manipulations correctly trigger an update to the `cameraStore` via `_updateCameraStoreState` or a similar mechanism. This might involve ensuring `Camera.js` or its sub-controllers are notified of `OrbitControls` changes to then update the store.
-   [ ] **CameraStore to Game Camera Sync:**
    -   [X] `client/src/game/core/eventHandlers.js` subscribes to `cameraStore.zoom` changes.
    -   [X] It calls `orbitController.setSpherical()` to update the game camera's zoom/radius. **Note:** The `orbitController` instance used here is the one created in `eventHandlers.js` (`new CameraOrbitController(...)`). There is a potential conflict/confusion if `Camera.js` also tries to manage the same `THREE.OrbitControls` instance passed to it, or if they are different instances/abstractions.
    -   [ ] **INVESTIGATE:** The interaction between `Camera.js` (which receives an `orbitControls` instance) and the `CameraOrbitController` created in `eventHandlers.js` needs clarification. Are they meant to work together? Is one obsolete? This is crucial for store-to-game sync.
    -   [X] **FIXED (related):** Corrected `Camera.js` constructor to not misuse `cameraStore.zoom` (a distance) to set `PerspectiveCamera.zoom` (a frustum scaler), which was causing initial view issues.

### [X] **Phase 3: Refactor Hardcoded Values & Mocks**
-   [X] **Search and Replace Constants:** (Mostly done, verified)
    -   [X] Performed a global search for `16000`.
    -   [X] Replaced instances in `client/src/components/control-panel/CameraTab.jsx` (mock state) and `client/src/game/core/setup.js` (initial camera position) with `CAMERA_PLANET_VIEW_DISTANCE`.
    -   [X] Ensured `CAMERA_TILE_VIEW_DISTANCE` is used in `cameraStore.js` for 'tile' view initialization.
    -   [X] Removed duplicate `CAMERA_PLANET_VIEW_DISTANCE` and `CAMERA_TILE_VIEW_DISTANCE` from `client/src/config/gameConfig.js` to centralize in `cameraConfig.js`.
    -   [X] **Refactor `CameraTab.jsx`:** Removed mock data and integrated with `useCameraStore` for zoom slider. Target/rotation sliders disabled pending further work.

### [ ] **Phase 4: Testing and Verification (Post-Fixes)**
-   [ ] **Initialization Test:** 
    -   [ ] **VERIFY:** On game load, `cameraStore.zoom` is correctly initialized (e.g. `CAMERA_PLANET_VIEW_DISTANCE`).
    -   [ ] **VERIFY:** Game camera's visual zoom respects `cameraStore.zoom` on initial load (should not be too close).
-   [ ] **Game-to-Store Sync Test:**
    -   [ ] **VERIFY:** Use game controls (e.g., mouse wheel, if applicable through `OrbitControls`) to zoom in and out. `cameraStore.zoom` should update accordingly.
    -   [ ] **VERIFY:** Clicking a tile zooms to `CAMERA_TILE_VIEW_DISTANCE` and `cameraStore.zoom` reflects this (should not be `1`).
-   [ ] **Store-to-Game Sync Test:**
    -   [ ] **VERIFY:** Use UI zoom slider in `CameraTab.jsx`. `cameraStore.zoom` should update, and game camera should visually change its zoom level to match.
    -   [ ] **VERIFY:** Programmatic changes to `cameraStore.zoom` (if any test mechanism exists) update the game camera.
-   Identified that `CameraOrbitController` uses `radius` for zoom. This `radius` is now synced with `cameraStore.zoom`.
    Identified that `Camera.js` (using `PlanetCameraController` and `TileCameraController`) is the primary camera logic. It was incorrectly using `PerspectiveCamera.zoom` for store updates. This has been fixed to use actual camera distance.
    The relationship and potential conflict between `Camera.js` (and its use of a passed-in `orbitControls` instance) and the separate `CameraOrbitController` instance created in `eventHandlers.js` (which subscribes to store changes) needs clarification. The `CameraOrbitController` was the one assumed to be doing game-to-store sync via `throttledSetStoreZoom`.

## 5. Known Issues/Risks
-   **Performance:** Throttling needs to be tuned correctly to balance responsiveness and performance.
-   **Synchronization Loops:** Care must be taken to avoid scenarios where an update to the store triggers a camera update, which in turn triggers a store update, leading to a loop. This is often managed by checking if the new value is significantly different before dispatching an update.
-   **Camera Abstraction:** The exact method of getting/setting game camera zoom depends on the specific THREE.js camera type (`OrthographicCamera` vs. `PerspectiveCamera`) and how camera controls are implemented. Need to inspect existing camera control code.

## 6. Debugging Notes (To be filled during implementation)
-   Identified that `CameraOrbitController` uses `radius` for zoom. This `radius` is now synced with `cameraStore.zoom`.
-   Initial camera position in `setup.js` was `camera.position.set(0, 0, 16000)`. Changed to use `CAMERA_PLANET_VIEW_DISTANCE` for Z. This is an initial setup value, `OrbitControls` later takes over and its positioning is based on factors of world radius or driven by the `cameraStore` via `CameraOrbitController`.
-   Centralized camera distance constants (`CAMERA_PLANET_VIEW_DISTANCE`, `CAMERA_TILE_VIEW_DISTANCE`) into `client/src/config/cameraConfig.js` and removed duplicates from `gameConfig.js`.
-   The `CameraTab.jsx` component uses mock state; its default zoom is now set using `CAMERA_PLANET_VIEW_DISTANCE`. For full functionality, it should integrate with `useCameraStore`. 