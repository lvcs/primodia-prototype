# PLAN: Camera Modes Implementation

## Potential Solutions

### Solution 1: Centralized Config + UI Store (Recommended)
- **Description:**
  - Create a single configuration file for all camera views and animation parameters.
  - Implement a UI store (e.g., Zustand) to persist camera state (mode, position, zoom, etc.) for the session.
  - Refactor camera controllers to read from config and update/read UI store.
- **Pros:**
  - Clean separation of config and logic
  - Easy to extend for new views or parameters
  - Fulfills all requirements (config-driven, session persistence, extensibility)
- **Cons:**
  - Requires moderate refactor of existing code

### Solution 2: Extend Current Constants & In-Memory State
- **Description:**
  - Continue using scattered constants for each view/animation parameter.
  - Store camera state in memory within camera classes (no UI store).
- **Pros:**
  - Minimal code changes
  - Fast to implement
- **Cons:**
  - Harder to extend/maintain
  - Not fully compliant with requirements (no config-driven views, no UI store persistence)

### Solution 3: Backend-Driven Camera State
- **Description:**
  - Store camera state and config in backend (e.g., in PostgreSQL or game state).
  - Sync with frontend on each view change.
- **Pros:**
  - Enables persistent camera state across sessions/devices
  - Centralized control for multiplayer
- **Cons:**
  - Overkill for UI-only ephemeral state
  - More complex, slower UX
  - Not aligned with requirements (UI store should be ephemeral)

## Evaluation
- **Solution 1** is the most promising: it is clean, extensible, and directly fulfills all requirements.
- **Solution 2** is quick but not future-proof or fully compliant.
- **Solution 3** is unnecessary complexity for the current needs.

## Decision
- [x] **Proceed with Solution 1: Centralized Config + UI Store**

## Implementation TODO
- [x] Create a centralized camera views config file (e.g., cameraViewsConfig.js)
- [x] Implement a UI store for camera state (mode, position, zoom, etc.)
- [x] Refactor camera controllers to use config and UI store
- [x] Move and style globe icon next to username in UI
- [ ] Document steps, issues, and solutions in PLAN.md as implementation progresses

---

### Progress & Notes
- Centralized config file created and used for all camera view parameters (zoom, tilt, animation, etc.).
- Zustand UI store implemented for ephemeral camera state (mode, position, zoom, tilt, target).
- Camera, GlobeCameraController, and TileCameraController refactored to use config and UI store.
- Globe icon button is now rendered next to the username in the UI and triggers globe view on click.
- Implementation is now fully compliant with the requirements in Requirements.md.
- No major issues encountered; architecture is extensible for future camera modes and UI improvements.
- Next: Continue documenting progress. 