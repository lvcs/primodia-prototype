# PLAN: Camera System Refactor

## 1. Objectives
As outlined in `Requirements.md`:
- Establish `cameraStore` (Zustand) as the single source of truth for camera parameters.
- Implement a `GameCameraController` class for camera operations.
- Ensure reliable two-way synchronization between the store and the game camera.
- Simplify camera logic and improve maintainability.

## 2. Potential Solutions

Given the detailed nature of `Requirements.md`, the solution is largely pre-defined. The primary "solution" is to implement the architecture as specified.

### 2.1. Proposed Architecture (from Requirements.md)

*   **`cameraStore` (Zustand):**
    *   Holds: `zoom`, `target`, `phi`, `theta`, `viewMode`, `isAnimating`.
    *   Provides actions: `setZoom`, `setTarget`, `setRotation`, `setViewMode`.
*   **`GameCameraController` Class:**
    *   Manages `THREE.PerspectiveCamera` and `THREE.OrbitControls`.
    *   Subscribes to `cameraStore` for Store-to-Game synchronization.
    *   Listens to `OrbitControls` `'change'` event for Game-to-Store synchronization (throttled).
    *   Provides methods for programmatic animations (e.g., `flyToTile`, `animateToGlobeView`), which update `OrbitControls` and rely on the `'change'` listener to update the store.
*   **UI Layer (React Components):**
    *   Subscribes to `cameraStore` for display.
    *   Calls `cameraStore` actions for updates.
*   **System Integration:**
    *   `GameCameraController` created during game initialization.
    *   Existing camera logic refactored/replaced.
    *   `dispose` method for cleanup.

### 2.2. Alternatives Considered

No major architectural alternatives are being considered at this stage, as the PRD provides a clear direction. Minor implementation details might vary, but the core components (`cameraStore`, `GameCameraController`) and their responsibilities are set.

## 3. Decision

The decision is to proceed with the implementation of the architecture outlined in `Requirements.md` and detailed in section 2.1 of this plan.

## 4. Implementation TODO

### Phase 1: Core `cameraStore` and `GameCameraController` Setup

-   [ ] **Create `cameraStore.js`:**
    -   [ ] Define initial state: `zoom`, `target` (default `THREE.Vector3(0,0,0)`), `phi` (default `Math.PI / 2`), `theta` (default `0`), `viewMode` (default `'globe'`), `isAnimating` (default `false`).
    -   [ ] Implement actions: `setZoom(zoom)`, `setTarget(target)`, `setPhi(phi)`, `setTheta(theta)`, `setRotation({ phi, theta })`, `setViewMode(mode)`, `setIsAnimating(isAnimating)`.
-   [ ] **Create `GameCameraController.js` (initial structure):**
    -   [ ] Constructor:
        -   [ ] Initialize `this.camera = new THREE.PerspectiveCamera(...)`.
        -   [ ] Initialize `this.controls = new THREE.OrbitControls(this.camera, renderer.domElement)`.
        -   [ ] Store references to `renderer.domElement` if needed for `OrbitControls`.
        -   [ ] Configure basic `OrbitControls` properties (e.g., `enableDamping`, `dampingFactor`).
    -   [ ] `dispose()` method:
        -   [ ] Remove event listeners.
        -   [ ] Dispose `OrbitControls`.
-   [ ] **Integrate `GameCameraController` into game initialization:**
    -   [ ] Instantiate `GameCameraController` in the main game setup flow.
    -   [ ] Pass the `renderer.domElement` to the `GameCameraController` constructor.
    -   [ ] Ensure the `GameCameraController`'s camera is used by the renderer.

### Phase 2: Store-to-Game Synchronization (REQ-CAM-R-006)

-   [ ] **`GameCameraController` subscribes to `cameraStore`:**
    -   [ ] In `GameCameraController` constructor or an `init` method, subscribe to `cameraStore` changes using `store.subscribe()`.
    -   [ ] Handle `zoom` changes: Update `this.controls.target` (if necessary, as OrbitControls adjusts distance from target) or camera position directly if not using target-distance for zoom. The requirement implies `zoom` is distance/radius, so `this.controls.object.position` might need adjustment based on `target` and new `zoom`, then `this.controls.update()`. Alternatively, if `OrbitControls` uses a distance parameter directly, update that. OrbitControls typically manages its distance via user input, but programmatic changes to `this.controls.object.position` and then `this.controls.update()` are common. Let's assume `zoom` directly maps to the camera's distance from the target.
        *   More directly: `OrbitControls` updates its internal state when its `object` (the camera) is moved. After setting `camera.position` based on new `zoom`, `phi`, `theta` from store, and ensuring `camera.lookAt(target)` is maintained, `controls.update()` should sync `OrbitControls`.
    -   [ ] Handle `target` changes: Update `this.controls.target.copy(newTarget)` and call `this.controls.update()`.
    -   [ ] Handle `phi` and `theta` changes:
        -   Convert spherical coordinates (phi, theta, current zoom/distance) to Cartesian for the camera's position relative to the target.
        -   Update `this.camera.position.set(x, y, z)`.
        -   Update `this.camera.lookAt(this.controls.target)`.
        -   Call `this.controls.update()`.
    -   [ ] Handle `viewMode` changes (e.g., switch controls, camera settings if necessary - TBD based on existing mode logic). For now, this might just be a state change.

### Phase 3: Game-to-Store Synchronization (REQ-CAM-R-007)

-   [ ] **`GameCameraController` listens to `OrbitControls` `'change'` event:**
    -   [ ] Add `this.controls.addEventListener('change', this.handleControlsChange)`.
    -   [ ] Implement `handleControlsChange` method (bound correctly).
    -   [ ] Inside `handleControlsChange`:
        -   [ ] Get current distance: `this.controls.getDistance()`.
        -   [ ] Get current target: `this.controls.target.clone()`.
        -   [ ] Get current orientation (phi, theta):
            -   Calculate from `this.camera.position` and `this.controls.target`.
            -   `const spherical = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target))`
            -   `phi = spherical.phi`, `theta = spherical.theta`.
        -   [ ] Call `cameraStore` actions: `setZoom()`, `setTarget()`, `setRotation()`.
        -   [ ] Implement throttling for these store updates (e.g., using `lodash.throttle` or a simple timeout mechanism).

### Phase 4: Programmatic Animations (REQ-CAM-R-008)

-   [ ] **Implement animation methods in `GameCameraController`:**
    -   [ ] `flyToTarget(newTarget, newZoom, newPhi, newTheta, duration)`:
        -   [ ] Use a tweening library (like TWEEN.js, or a simple manual tween loop) to animate camera properties.
        -   [ ] Animate `this.controls.target`.
        -   [ ] Animate camera position (derived from zoom, phi, theta).
        -   [ ] Call `this.controls.update()` in each animation frame.
        -   [ ] The existing `'change'` listener should update the store during animation.
        -   [ ] Set `cameraStore.setIsAnimating(true)` at the start and `false` at the end.
    -   [ ] `flyToTile(tileCoordinates, duration)` (example):
        -   [ ] Calculate target position, zoom, orientation for the tile.
        -   [ ] Call `flyToTarget()`.
    -   [ ] `animateToGlobeView(duration)` (example):
        -   [ ] Define globe view parameters (target, zoom, orientation).
        -   [ ] Call `flyToTarget()`.

### Phase 5: UI Layer Integration (REQ-CAM-R-009, REQ-CAM-R-010)

-   [ ] **Refactor `CameraTab.jsx` (and other relevant UI components):**
    -   [ ] Subscribe to `cameraStore` using `useCameraStore()` hook.
    -   [ ] Display camera info (`zoom`, `target`, `phi`, `theta`, `viewMode`) from the store.
    -   [ ] UI controls (sliders, buttons) should call actions on `cameraStore` (e.g., `cameraStore.getState().setZoom(newZoomValue)`).

### Phase 6: Refactor Existing Logic & Cleanup (REQ-CAM-R-012)

-   [ ] **Identify all existing camera control code:**
    -   [ ] `client/src/game/camera/Camera.js`
    -   [ ] `client/src/game/controls/CameraOrbitController.js` (if this is related to eventHandlers.js)
    -   [ ] `client/src/game/camera/GlobeCameraController.js`
    -   [ ] `client/src/game/camera/TileCameraController.js`
    -   [ ] Any camera logic within `eventHandlers.js` or other scattered places.
-   [ ] **Refactor/Remove Old Code:**
    -   [ ] Gradually move functionality into `GameCameraController` or `cameraStore`.
    -   [ ] Delete old files/classes once their responsibilities are fully covered.
    -   [ ] Ensure all camera interactions (user input, programmatic) go through the new system.

### Phase 7: Testing and Debugging

-   [ ] Test Store-to-Game sync: Modifying store values via UI or console updates the 3D camera.
-   [ ] Test Game-to-Store sync: Moving camera via OrbitControls updates the store and UI.
-   [ ] Test programmatic animations: `flyToTarget` and other animation methods work correctly and store stays in sync.
-   [ ] Test `viewMode` switching if it involves more than just a state flag.
-   [ ] Test `dispose` method for cleanup.
-   [ ] Debug any discrepancies or issues.

## 5. Issues Encountered & Solutions

*(This section will be filled during implementation)* 