# Requirements for Simplified Camera API

This document outlines the specifications and constraints for refactoring the existing camera implementation in `client/src/game/camera` into a clean, functional API. All changes must adhere to the project's general coding guidelines and make use of existing configuration constants.

## Objectives

- Eliminate all class-based and inheritance-based camera controllers.
- Provide a minimal, functional interface for all camera operations, exposed via `client/src/game/camera/camera.js`.
- The camera system within `client/src/game/camera/` will be responsible for creating and managing the `THREE.PerspectiveCamera` and `OrbitControls` instances.
- All camera state (target, position, zoom, viewMode, isAnimating, ) will be managed within `client/src/stores/cameraStore.js` (Zustand store).
- `OrbitControls` state (camera position, target) will be two-way synchronized with `cameraStore` by the camera system.
- The Three.js `PerspectiveCamera` instance will be configured by the camera system, driven by `cameraStore` and `OrbitControls`.
- Leverage configuration constants from:
  - `@config/cameraConfig` (e.g. `DEFAULT_ANIMATION_DURATION_MS`, `CAMERA_EASINGS`, `CAMERA_VIEWS`)
  - `@config/gameConfig` (e.g. `GLOBE_RADIUS`, zoom factors)
  - `@config/keyboardConfig` (for any keyboard-driven controls)
- Use the `GLOBE_RADIUS` constant from `@config/gameConfig`.

## Camera System (`client/src/game/camera/`)

This directory will house the new functional camera logic.

### `camera.js` (Public Interface)
Exports functions to interact with the camera system.

- `initializeCameraSystem(canvasElement: HTMLCanvasElement, initialWorldConfig: object): { camera: THREE.PerspectiveCamera, controls: OrbitControls }`
  - Creates and configures `THREE.PerspectiveCamera` and `OrbitControls`.
  - Sets up two-way synchronization between these instances and `cameraStore`.
  - Returns the camera and controls instances for the main game loop/renderer.
- `lookAt(x: number, y: number, z: number, animate: boolean = true, durationMs?: number, easing?: Function, onComplete?: () => void): Promise<void>`
- `getLookAt(): { x: number; y: number; z: number }`
- `getCameraPosition(): { x: number; y: number; z: number }`
- `setDistance(distance: number, animate: boolean = true, durationMs?: number, easing?: Function, onComplete?: () => void): Promise<void>`
- `getDistance(): number`
- `isAnimating(): boolean`
- `latitudeLongitudeToXYZ(latitude: number, longitude: number, radius: number = GLOBE_RADIUS): { x: number; y: number; z: number }`
- `setViewMode(mode: string, animate: boolean = true, durationMs?: number, easing?: Function, onComplete?: () => void): Promise<void>`
- `getViewMode(): string`
- `focusOnLatLong(latitude: number, longitude: number, distance: number, animate: boolean = true, durationMs?: number, easing?: Function, onComplete?: () => void): Promise<void>`
- `getCameraInstance(): THREE.PerspectiveCamera | null` // Getter for the managed camera
- `getControlsInstance(): OrbitControls | null` // Getter for the managed controls

### Animation Behavior

- Animations should always start from the current `OrbitControls` state (position, target) as reflected in `cameraStore`.
- Use `DEFAULT_ANIMATION_DURATION_MS` and `DEFAULT_EASING_CURVE` from `cameraConfig` if `durationMs` and `easing` are not provided.
- Animation functions will manage `isAnimating` state in `cameraStore`.
- Animations will progressively update `orbitControls.object.position` and `orbitControls.target` (and thereby the `cameraStore` via synchronization), calling `orbitControls.update()` at each step.

## Zustand Store (`cameraStore.js`)

### State:
- `target: { x: number; y: number; z: number }` (Reflects `orbitControls.target`)
- `position: { x: number; y: number; z: number }` (Reflects `orbitControls.object.position`)
- `up: { x: number; y: number; z: number }` (Default: `{ x: 0, y: 1, z: 0 }`, reflects `orbitControls.object.up`)
// `distance` is derived from position and target, or via orbitControls.getDistance(). Explicit storage might be redundant if always synced.
- `viewMode: string`
- `isAnimating: boolean`
- `fov: number` (Initialized from `gameConfig.CAMERA_FOV`, for `PerspectiveCamera`)
- `near: number` (Initialized from `gameConfig.CAMERA_NEAR_PLANE`)
- `far: number` (Initialized from `gameConfig.CAMERA_FAR_PLANE`)

### Actions:
- `setTarget: (target: { x: number; y: number; z: number }) => void` (Updates store, triggers update to `orbitControls.target`)
- `setPosition: (position: { x: number; y: number; z: number }) => void` (Updates store, triggers update to `orbitControls.object.position`)
- `setUpVector: (up: { x: number; y: number; z: number }) => void` (Updates store, triggers update to `orbitControls.object.up`)
// setDistance action might not directly set a 'distance' field, but rather calculate and call setPosition.
- `setViewMode: (mode: string) => void`
- `setAnimating: (isAnimating: boolean) => void`
- `setFov: (fov: number) => void` (Updates store, triggers update to `camera.fov` and `camera.updateProjectionMatrix()`)
- `setNearFarPlanes: (near: number, far: number) => void` (Updates store, triggers update to camera planes and matrix)
- `syncFromOrbitControls: (position: THREE.Vector3, target: THREE.Vector3, up: THREE.Vector3) => void` // New: Action to update store from OrbitControls' state.
- `resetCamera: (defaultState: Partial<CameraState>) => void` // To reset to a defined state, updating OrbitControls accordingly.
// `applyCameraStateToThreeInstance` might be less direct; OrbitControls becomes the intermediary.

## Integration Points

- `client/src/game/core/setup.js` will:
  - Import `initializeCameraSystem` from `client/src/game/camera/camera.js`.
  - Call `initializeCameraSystem` to get the camera and controls instances.
  - Pass the camera instance to the renderer and use controls as needed.
- The two-way synchronization logic between `OrbitControls` and `cameraStore` will be encapsulated within the camera system initialized by `camera.js` (likely within an internal module or `initializeCameraSystem` itself).
- Remove or replace existing references to:
  - `BaseCameraController.js`
  - `TileCameraController.js`
  - `CameraOrbitController.js`
  - The old `Camera.js` class

- Update `client/src/game/core/eventHandlers.js` to import and use the new functional API instead of the class-based `Camera` and `OrbitController`.

## Directory Context

- `client/src/game/camera`: existing class-based controllers to be replaced.
- `client/src/config`: source of all camera, game, and keyboard constants.
- `client/src/game/core/eventHandlers.js`: entry point wiring camera into user events.
- `client/src/stores/cameraStore.js`: authoritative state for camera – must be the single source of truth.

---

_Adhere strictly to the project's general coding rules: functional programming style, explicit naming, single-responsibility functions, and minimal, targeted changes._ 