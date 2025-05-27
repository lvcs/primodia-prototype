# PRD006: Camera Control Enhancements

## 1. Overview
This document outlines the requirements for improving camera control, focusing on zoom functionality and its integration with the `cameraStore`.

## 2. Goals
- Ensure accurate and consistent zoom representation between the game camera and the `cameraStore`.
- Eliminate hardcoded camera distance values by using defined constants.
- Improve maintainability and clarity of camera control logic.

## 3. Requirements

### 3.1. Camera Zoom Initialization
- **REQ-CAM-001:** The `cameraStore.zoom` state must be initialized with a default value (e.g., `PLANET_VIEW_CAMERA_DISTANCE`) when the game starts. The game camera must visually reflect this initial zoom value. _(Partially Implemented: Store initializes, but visual camera does not consistently reflect it at load)._

### 3.2. Camera Store Synchronization
- **REQ-CAM-002:** The `cameraStore.zoom` value must be updated dynamically to reflect any changes in the actual game camera's zoom level. _(Issue Detected: Store does not consistently update, e.g., shows `1` after tile click)._
- **REQ-CAM-003:** Conversely, if `cameraStore.zoom` is changed programmatically (e.g., by UI controls), the game camera's zoom should update accordingly. _(Issue Detected: UI controls do not update the store, and initial store value is not reflected by the game camera)._

### 3.3. Constant Usage for Camera Distances
- **REQ-CAM-004:** All instances of hardcoded numerical values representing the planet view camera distance (e.g., `16000`) must be replaced with the `PLANET_VIEW_CAMERA_DISTANCE` constant. _(Implemented)._
- **REQ-CAM-005:** The `TILE_VIEW_CAMERA_DISTANCE` constant must be utilized for camera positioning when in a tile-focused view. _(Partially Implemented: Used on tile click, but initial load behavior and store sync are problematic)._

### 3.4. Code Maintainability
- **REQ-CAM-006:** Camera zoom logic should be clear and easy to follow. _(Ongoing)._
- **REQ-CAM-007:** Ensure that constants for camera distances are defined in a central, accessible location. _(Implemented)._

### 3.5. Data Integrity
- **REQ-CAM-008:** Remove or refactor any mock data or configurations (e.g., `mockControls`, `mockWorldConfig`) related to camera control to prevent interference with actual game and store values.

## 4. Non-Goals
- Changes to other camera parameters (pan, tilt, rotation) unless directly related to zoom implementation.
- Major refactoring of the existing camera system beyond what is necessary to meet the above requirements.
