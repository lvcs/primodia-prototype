# PRD004: UI Store and Component Refactor - Plan

## 1. Objectives
- Migrate UI code to functional React components with hooks.
- Previous client code is moved to `client(to_refactor)`
- Functional React code is created in `client`
- Introduce Radix UI components for consistent styling and accessibility.
- Consolidate all UI related stores under `client/src/stores` using Zustand.
- Expose the main UI store via `window.uiStore` for debugging.
- Remove stray `console.log` statements from production code.
- Ensure UI follows declarative patterns and prefers composition over inheritance.
- Provide reusable custom hooks and context-based utilities.
- [ ] Ensure full functional parity between the new `client` implementation and the original `client(to_refactor)` functionality.

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

### Phase 1: Setup & Libraries
- [x] Install React and Radix UI packages in the client project (`client/package.json`).
- [x] Install Zustand in the client project.
- [x] Create `client/src/stores/index.js` to export Zustand stores.
- [x] Configure PropTypes for validation.
- [x] Add ESLint rule for PropTypes if available and configure ESLint for React.

### Phase 2: Store Migration & Creation
- [x] Create `client/src/stores/uiStore.js` for the main UI state.
    - [x] Define initial state structure (e.g., open menus, modals, notifications).
    - [x] Implement actions to modify the state.
- [x] Expose the main UI store to `window.uiStore` in development mode.
- [x] Move existing `cameraUIStore.js` to `client/src/stores/cameraUIStore.js`.
    - [x] Refactor it to use Zustand (already using).
    - [x] Export as `useCameraUIStore`.
    - [x] Update imports where `cameraUIStore` was used (handled by new relative path).
- [x] Create `client/src/stores/worldSettingsStore.js` for `planetSettings` management.
    - [x] Define initial state based on `planetSettings` from `planetVoronoi.js` and `gameConfig.js`.
    - [x] Implement actions for each setting (e.g., `setNumPoints`, `setJitter`, `setMapType`).
    - [x] Actions should call `requestPlanetRegeneration()` or `triggerPlanetColorUpdate()` as appropriate (mocked for now).
- [x] Export `useWorldSettingsStore` from `client/src/stores/index.js`.
- [ ] **Migrate Remaining Stores from `client(to_refactor)`:**
    - [ ] Based on the audit, identify and migrate or recreate any other Zustand stores or state management logic from `client(to_refactor)/src/stores` (or other locations) to `client/src/stores`.
    - [ ] Ensure they follow the new patterns (functional, Zustand-based) and are exported via `client/src/stores/index.js`.

### Phase 3: Component Refactor & Development
- [x] Identify initial set of UI controls for the control panel to be refactored (Focus: `UnifiedControlPanel` with a tabbed interface. Source: `client(to_refactor)/src/ui/components/UnifiedControlPanel.js`).
- [x] Create a directory `client/src/components/ui/` for common Radix-based UI components (e.g., Button, Slider, Input, Tabs).
- [x] Develop base Radix UI components:
    - [x] `Button.jsx`
    - [x] `Slider.jsx`
    - [x] `Input.jsx`
    - [x] `Tabs.jsx` (using `@radix-ui/react-tabs`)
    - [x] `Select.jsx` (using `@radix-ui/react-select`)
    - [x] `Switch.jsx` (using `@radix-ui/react-switch`)
    - [x] `ControlSectionWrapper.jsx` (simple layout component)
    - [ ] (Add more as needed)
- [x] Create `client/src/components/control-panel/UnifiedControlPanel.jsx`.
    - [x] Implement a container structure.
    - [x] Implement a tabbed interface using the `Tabs.jsx` component (Tabs: Planet, Camera, Tile Debug, Camera Debug, Planet Debug).
    - [x] Identify and list the specific controls within the existing `UnifiedControlPanel` that need to be ported to Radix UI components (Done, see analysis above. Key controls: Buttons, Sliders, Selects, Toggles/Switches, TextInputs).
- [x] Incrementally refactor existing UI controls from the old `UnifiedControlPanel` into the new `UnifiedControlPanel.jsx` using the new Radix components and functional component patterns.
    - [x] Planet Tab Controls:
        - [x] Draw Mode (Buttons/RadioGroup) - Initial implementation done
        - [x] Algorithm Selection (Buttons/RadioGroup) - Initial implementation done
        - [x] Number of Points (Slider) - Initial implementation done
        - [x] Jitter (Slider) - Initial implementation done
        - [x] Map Type (Select) - Initial implementation done
        - [x] Show Outlines (Switch/Checkbox) - Initial implementation done
        - [x] Number of Plates (Slider) - Initial implementation done
        - [x] Elevation Bias (Slider) - Initial implementation done
        - [x] World Seed (Input + Button) - Initial implementation done
        - [x] View (Planet View Mode) (Select) - Initial implementation done
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
    - [x] Planet Debug Tab Content (Sliders, Text display)
        - [x] Initial placeholder tab created (`PlanetDebugTab.jsx`)
        - [ ] TODO: Refactor `window.updatePlanetDebugInfo` to use Zustand store.
        - [ ] TODO: Add relevant sliders and info display, connected to debug store/logic.
- [x] Replace imperative DOM manipulation with declarative JSX and hooks.
- [x] Remove stray `console.log` statements (gated by a development flag or removed entirely for production).
- [x] Refactor `PlanetTab.jsx` to use `useWorldSettingsStore`.
- [ ] **Broader UI Refactor from `client(to_refactor)`:**
    - [ ] Systematically refactor all remaining UI components identified in the audit from `client(to_refactor)/src/ui/` (and other relevant subdirectories like `client(to_refactor)/src/core_modules/`, `client(to_refactor)/src/game_specific_ui/`) into functional React components within `client/src/components/`.
    - [ ] For each component/module from `client(to_refactor)`:
        - [ ] Analyze its functionality and dependencies based on the audit.
        - [ ] Rebuild as a React functional component using hooks, adhering to functional and declarative principles.
        - [ ] Utilize Radix UI primitives from `client/src/components/ui/` where appropriate, or create new shared Radix-based components if needed.
        - [ ] Connect components to relevant Zustand stores for state management.
        - [ ] Ensure all public components have `PropTypes`.
    - [ ] **Recreate Core Game UI Layout:**
        - [ ] Ensure the main game interface layout (e.g., full-screen canvas, positioning of primary UI elements) is replicated from `client(to_refactor)` into the new `client` structure, using appropriate React components and styling.
    - [ ] **Refactor Authentication UI & Flows:**
        - [ ] Recreate or refactor UI components and logic for user sign-in, sign-up, and sign-out functionalities from `client(to_refactor)`.
        - [ ] Ensure these flows integrate correctly with any backend services and new state management.
    - [ ] Address and refactor any imperative DOM manipulations found during the audit (e.g., direct element creation/manipulation in utility functions or old component logic) to use declarative JSX and React state/hooks.
    - [ ] Migrate any UI-specific utility functions from `client(to_refactor)` to `client/src/utils/` or integrate them into relevant components/hooks.

### Phase 4: Custom Hooks & Utilities
- [ ] Identify repetitive logic that can be extracted into custom hooks from the broader refactoring effort.
- [ ] Create `client/src/hooks/` directory.
- [ ] Implement custom hooks (e.g., `useWorldConfig`, `useCameraData`).
- [ ] After stores are set up (like `useWorldSettingsStore`), identify if more specific custom hooks are needed (e.g., `useFormattedWorldSetting`, `useGameActions`).
- [ ] Create `client/src/hooks/` directory (if not already created by store setup).
- [ ] Implement identified custom hooks.
- [ ] **Migrate Non-UI Utilities from `client(to_refactor)`:**
    - [ ] Review `client(to_refactor)` (e.g., `client(to_refactor)/src/utils/`, `client(to_refactor)/src/helpers/`, or other non-UI specific modules identified in the audit).
    - [ ] Determine if these utilities are still needed.
    - [ ] If so, refactor them for modern JavaScript, functional style, and adherence to project guidelines, then move them to `client/src/utils/` or `shared/` if applicable.


### Phase 5: Cleanup & Finalization
- [ ] **Refactor Main Application Entry Point & Global Styles:**
    - [ ] Review and refactor the main application entry point(s) used by `client(to_refactor)` (e.g., `index.html`, main JavaScript file that initializes the old UI).
    - [ ] Ensure the new main entry point for `client` (e.g., `client/index.html`, `client/src/main.jsx`) correctly initializes the React application, providers, global stores, and any other necessary setup.
    - [ ] Migrate or recreate global styles from `client(to_refactor)`, ensuring they are compatible with Tailwind CSS and the new component structure. Remove styles related to the old implementation.
    - [ ] Remove any setup or initialization code related to the old `client(to_refactor)` system.
- [ ] **Remove Obsolete Code (Full `client(to_refactor)` Directory):**
    - [ ] Once all functionality from `client(to_refactor)` has been successfully ported to `client`, thoroughly verified through testing, and all dependencies are updated.
    - [ ] Delete the entire `client(to_refactor)` directory.
    - [ ] Remove any remaining references to `client(to_refactor)` in build configurations, scripts, or documentation.
- [ ] Ensure all public components have `PropTypes`.

### Phase 6: Documentation & Testing
- [ ] Document UI store architecture and usage patterns in `docs/UI_Store_And_Components.md`.
- [ ] Provide examples of components utilizing the new store and hooks in the documentation.
- [ ] Plan for unit tests using React Testing Library (implementation for later).
- [ ] **Comprehensive End-to-End Testing for Functional Parity:**
    - [ ] Develop and execute a test plan covering all features and user interactions previously handled by `client(to_refactor)`.
    - [ ] Verify that the new `client` implementation provides full functional parity and behaves as expected.
    - [ ] Test across different browsers and devices if applicable.
- [ ] **Update Project Documentation:**
    - [ ] Update the main project `README.md` and any other relevant architectural or developer documentation.
    - [ ] Reflect the new `client` directory structure, the removal of `client(to_refactor)`, and any significant changes to the development setup or build process.

---
*This plan will be updated as tasks are completed and new issues arise.* 