# PRD004: UI Store and Component Refactor - Plan

## 1. Objectives
- Migrate UI code to functional React components with hooks.
- Introduce Radix UI components for consistent styling and accessibility.
- Consolidate all UI related stores under `client/src/stores` using Zustand.
- Expose the main UI store via `window.uiStore` for debugging.
- Remove stray `console.log` statements from production code.
- Ensure UI follows declarative patterns and prefers composition over inheritance.
- Provide reusable custom hooks and context-based utilities.

## 2. Potential Solutions & Evaluation

*(This section will be filled as we explore specific implementation choices for different parts of the refactor. For now, the overall approach is dictated by Requirements.md)*

**Overall Approach:** The `Requirements.md` mandates a specific set of technologies (React, Radix UI, Zustand) and architectural patterns. Therefore, "alternative solutions" at this high level are not applicable. We will focus on making sound design decisions within this framework.

**Key Technology Choices (as per Requirements.md):**
*   **UI Library:** React with Functional Components and Hooks.
    *   *Pros:* Modern, widely adopted, good ecosystem, aligns with declarative patterns.
    *   *Cons:* Can have a learning curve for complex state management if not handled well (hence Zustand).
*   **Component Library:** Radix UI.
    *   *Pros:* Unstyled, accessible primitives, allows for full styling control, promotes composition.
    *   *Cons:* Requires more manual styling effort compared to fully styled component libraries.
*   **State Management:** Zustand for global UI state, React Context for scoped state.
    *   *Pros:* Zustand is lightweight, simple API, good for global state. React Context is built-in, good for localized state.
    *   *Cons:* Need to be mindful of when to use global vs. scoped state to avoid performance issues or prop-drilling.

## 3. Decision
The chosen approach is to follow the specifications in `Requirements.md`, leveraging React, Radix UI, and Zustand to refactor the UI.

## 4. Implementation TODOs

### Phase 0: Initial Issues & Cleanup (New)
- [x] Investigate and fix 404/500 errors for `cameraViewsConfig.js` and `cameraUIStore.js` in `Camera.js` and `eventHandlers.js`. (Imports in `client/src/camera/Camera.js` corrected to relative paths. Alias `@/` in `client/vite.config.js` points to `client/src/`.)

### Phase 1: Setup & Libraries
- [x] Install React and Radix UI packages in the client project (`src/client/package.json`).
- [x] Install Zustand in the client project.
- [x] Create `src/client/src/stores/index.js` to export Zustand stores.
- [x] Configure PropTypes for validation.
- [x] Add ESLint rule for PropTypes if available and configure ESLint for React.

### Phase 2: Store Migration & Creation
- [x] Create `src/client/src/stores/uiStore.js` for the main UI state.
    - [x] Define initial state structure (e.g., open menus, modals, notifications).
    - [x] Implement actions to modify the state.
- [x] Expose the main UI store to `window.uiStore` in development mode.
- [x] Move existing `cameraUIStore.js` to `src/client/src/stores/cameraUIStore.js`.
    - [x] Refactor it to use Zustand (already using).
    - [x] Export as `useCameraUIStore`.
    - [x] Update imports where `cameraUIStore` was used (handled by new relative path).
- [x] Create `src/client/src/stores/worldSettingsStore.js` for `sphereSettings` management.
    - [x] Define initial state based on `sphereSettings` from `planetSphereVoronoi.js` and `gameConstants.js`.
    - [x] Implement actions for each setting (e.g., `setNumPoints`, `setJitter`, `setMapType`).
    - [x] Actions should call `requestPlanetRegeneration()` or `triggerPlanetColorUpdate()` as appropriate (mocked for now).
- [x] Export `useWorldSettingsStore` from `src/client/src/stores/index.js`.

### Phase 3: Component Refactor & Development
- [x] Identify initial set of UI controls for the control panel to be refactored (Focus: `UnifiedControlPanel` with a tabbed interface. Source: `client/src/ui/components/UnifiedControlPanel.js`).
- [x] Create a directory `src/client/src/components/ui/` for common Radix-based UI components (e.g., Button, Slider, Input, Tabs).
- [x] Develop base Radix UI components:
    - [x] `Button.jsx`
    - [x] `Slider.jsx`
    - [x] `Input.jsx`
    - [x] `Tabs.jsx` (using `@radix-ui/react-tabs`)
    - [x] `Select.jsx` (using `@radix-ui/react-select`)
    - [x] `Switch.jsx` (using `@radix-ui/react-switch`)
    - [x] `ControlSectionWrapper.jsx` (simple layout component)
    - [ ] (Add more as needed)
- [x] Create `src/client/src/components/control-panel/UnifiedControlPanel.jsx`.
    - [x] Implement a container structure.
    - [x] Implement a tabbed interface using the `Tabs.jsx` component (Tabs: Globe, Camera, Tile Debug, Camera Debug, Globe Debug).
    - [x] Identify and list the specific controls within the existing `UnifiedControlPanel` that need to be ported to Radix UI components (Done, see analysis above. Key controls: Buttons, Sliders, Selects, Toggles/Switches, TextInputs).
- [x] Incrementally refactor existing UI controls from the old `UnifiedControlPanel` into the new `UnifiedControlPanel.jsx` using the new Radix components and functional component patterns.
    - [x] Globe Tab Controls:
        - [x] Draw Mode (Buttons/RadioGroup) - Initial implementation done
        - [x] Algorithm Selection (Buttons/RadioGroup) - Initial implementation done
        - [x] Number of Points (Slider) - Initial implementation done
        - [x] Jitter (Slider) - Initial implementation done
        - [x] Map Type (Select) - Initial implementation done
        - [x] Show Outlines (Switch/Checkbox) - Initial implementation done
        - [x] Number of Plates (Slider) - Initial implementation done
        - [x] Elevation Bias (Slider) - Initial implementation done
        - [x] World Seed (Input + Button) - Initial implementation done
        - [x] View (Globe View Mode) (Select) - Initial implementation done
    - [x] Camera Tab Controls:
        - [x] Target X, Y, Z (Sliders) - Initial implementation done
        - [x] Zoom Distance (Slider) - Initial implementation done
        - [x] Yaw (Slider) - Initial implementation done
        - [x] Roll (Slider) - Initial implementation done
    - [x] Tile Debug Tab Content (Display HTML or structured data)
        - [x] Initial placeholder tab created (`TileDebugTab.jsx`)
        - [ ] TODO: Refactor `window.updateTileDebugInfo` to use Zustand store for reactive updates instead of direct DOM manipulation or `dangerouslySetInnerHTML`.
    - [x] Camera Debug Tab Content (Text display, Sliders)
        - [x] Initial placeholder tab created (`CameraDebugTab.jsx`)
        - [ ] TODO: Refactor `window.updateCameraDebugInfo` to use Zustand store.
        - [ ] TODO: Add relevant sliders if necessary, connected to debug store/logic.
    - [x] Globe Debug Tab Content (Sliders, Text display)
        - [x] Initial placeholder tab created (`GlobeDebugTab.jsx`)
        - [ ] TODO: Refactor `window.updateGlobeDebugInfo` to use Zustand store.
        - [ ] TODO: Add relevant sliders and info display, connected to debug store/logic.
- [x] Replace imperative DOM manipulation with declarative JSX and hooks.
- [x] Remove stray `console.log` statements (gated by a development flag or removed entirely for production).
- [x] Refactor `GlobeTab.jsx` to use `useWorldSettingsStore`.

### Phase 4: Custom Hooks & Utilities
- [ ] Identify repetitive logic that can be extracted into custom hooks.
- [ ] Create `src/client/src/hooks/` directory.
- [ ] Implement custom hooks (e.g., `useWorldConfig`, `useCameraData`).
- [ ] After stores are set up (like `useWorldSettingsStore`), identify if more specific custom hooks are needed (e.g., `useFormattedWorldSetting`, `useGameActions`).
- [ ] Create `src/client/src/hooks/` directory (if not already created by store setup).
- [ ] Implement identified custom hooks.

### Phase 5: Cleanup & Finalization
- [ ] Remove obsolete code (`UIController`, old control panel implementation) once parity is achieved.
- [ ] Ensure all public components have `PropTypes`.
- [ ] Verify React fragments and keys are used appropriately in list rendering.

### Phase 6: Documentation & Testing
- [ ] Document UI store architecture and usage patterns in `docs/UI_Store_And_Components.md`.
- [ ] Provide examples of components utilizing the new store and hooks in the documentation.
- [ ] Plan for unit tests using React Testing Library (implementation for later).

---
*This plan will be updated as tasks are completed and new issues arise.* 