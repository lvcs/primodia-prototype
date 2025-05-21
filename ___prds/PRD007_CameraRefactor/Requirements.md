# PRD007: Camera System Refactor

## 1. Overview
This document outlines the requirements for refactoring the camera control system to establish a clear, robust, and maintainable architecture. The goal is to ensure a single source of truth for camera state and a unidirectional data flow, leveraging Zustand for state management and a unified controller for game logic.

## 2. Goals
- Establish `cameraStore` (Zustand) as the single source of truth for all relevant camera parameters (zoom, target, orientation, mode).
- Implement a `GameCameraController` class as the primary interface for all camera operations within the game logic layer.
- Ensure reliable two-way synchronization: Store changes update the game camera, and game camera changes (from user input or programmatic animations) update the store.
- Simplify camera logic by centralizing control and reducing potential conflicts between multiple controlling entities.
- Improve maintainability and ease of debugging for the camera system.

## 3. Requirements

### 3.1. `cameraStore` (Zustand)
- **REQ-CAM-R-001:** The `cameraStore` must define and hold the definitive state for:
    - `zoom` (distance/radius from target)
    - `target` (THREE.Vector3 focus point)
    - `phi` (polar angle for orientation)
    - `theta` (azimuthal angle for orientation)
    - `viewMode` ('globe', 'tile', or other applicable modes)
    - Potentially `isAnimating` or other UI-relevant status flags.
- **REQ-CAM-R-002:** Actions must be provided in the store to update these state variables (e.g., `setZoom`, `setTarget`, `setRotation`, `setViewMode`).

### 3.2. `GameCameraController` Class
- **REQ-CAM-R-003:** A single `GameCameraController` class shall be implemented to manage camera logic.
- **REQ-CAM-R-004:** The `GameCameraController` must create, own, and manage the main `THREE.PerspectiveCamera` instance.
- **REQ-CAM-R-005:** The `GameCameraController` must create, own, and manage the main `THREE.OrbitControls` instance, configured appropriately for user interaction.
- **REQ-CAM-R-006 (Store-to-Game Sync):** The `GameCameraController` must subscribe to relevant changes in `cameraStore`.
    - When `cameraStore` state (e.g., `zoom`, `target`) changes, the `GameCameraController` must update the actual `THREE.OrbitControls` and `THREE.PerspectiveCamera` to match the new store state, typically followed by `orbitControls.update()`.
- **REQ-CAM-R-007 (Game-to-Store Sync):** The `GameCameraController` must listen to the `'change'` event from its `THREE.OrbitControls` instance.
    - Upon this event, it must read the current state from `THREE.OrbitControls` (distance, target, orientation).
    - It must then call the appropriate actions on `cameraStore` to update the store with these actual values. This update should be throttled for performance.
- **REQ-CAM-R-008 (Programmatic Animations):** The `GameCameraController` must provide methods for programmatic camera animations (e.g., `flyToTile(tile)`, `animateToGlobeView()`).
    - These methods will calculate target camera parameters.
    - They will animate the `THREE.OrbitControls` (and/or camera directly) over time.
    - The existing `'change'` listener on `OrbitControls` (REQ-CAM-R-007) should ensure the `cameraStore` is continuously updated during these animations.

### 3.3. UI Layer (React Components)
- **REQ-CAM-R-009:** UI components (e.g., `CameraTab.jsx`) must subscribe to `cameraStore` to display camera information.
- **REQ-CAM-R-010:** UI controls (e.g., zoom slider) must call actions on `cameraStore` to update the desired camera state.

### 3.4. System Initialization & Integration
- **REQ-CAM-R-011:** The `GameCameraController` instance shall be created during the main game initialization sequence.
- **REQ-CAM-R-012:** Existing camera control logic (e.g., in `Camera.js`, `CameraOrbitController.js` within `eventHandlers.js`, `GlobeCameraController.js`, `TileCameraController.js`) must be refactored and integrated into or replaced by the new `GameCameraController` and `cameraStore` architecture.
- **REQ-CAM-R-013:** A clear `dispose` method should be implemented in `GameCameraController` to clean up subscriptions and event listeners when the game ends or the controller is no longer needed.

## 4. Non-Goals
- Introduction of new camera features beyond what's needed for this refactor.
- Changes to the underlying 3D rendering engine (Three.js) beyond camera controls.

## 5. Key Principles (Reiteration from General Rules)
- Unidirectional Data Flow: Strive for UI/Controls → Store → Game Logic → Rendering.
- Single Source of Truth: `cameraStore` for camera state.
- Clear Separation of Concerns: UI, Store, Game Logic (GameCameraController).
