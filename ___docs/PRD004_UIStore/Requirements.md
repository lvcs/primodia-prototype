# PRD004: UI Store and Component Refactor

## Overview
The current UI implementation under `client/src` relies heavily on imperative DOM manipulation and scattered state management. This makes features difficult to extend, results in duplicated logic, and leaves many `console.log` statements throughout the code. To streamline development and encourage a more declarative approach, we will refactor the UI to adopt the [Radix UI](https://www.radix-ui.com) component library, centralize UI state with a well-defined store, and clean up existing code.

## Objectives
- Migrate UI code to functional components with hooks.
- Introduce Radix UI components for consistent styling and accessibility.
- Consolidate all UI related stores under `client/src/stores` using **Zustand**.
- Expose the UI store via `console.log` for easier debugging.
- Remove stray `console.log` statements from production code.
- Ensure UI follows declarative patterns and prefers composition over inheritance.
- Provide reusable custom hooks and context based utilities.

## Specifications
### Architecture
- All state containers should reside in `client/src/stores`.
- Use **Zustand** for global UI state while leveraging React Context for scoped state when necessary.
- Components must be written as React functional components using hooks (no class components).
- Radix UI primitives should compose larger UI pieces; avoid monolithic components.
- Prop validation must use `PropTypes` for every public component.
- Use React fragments to avoid extraneous DOM nodes and keys for list rendering.

## Porting Existing UI
Focus on UnifiedContolPanel.
We want a Container with Tabs on top.
Match existing UI controls to Radix UI components

### Debugging
- The main UI store should be accessible from the browser console (e.g., `window.uiStore`) to aid debugging.
- All other debugging output should be gated behind a development flag.

### Migration Path
1. Create base store modules under `client/src/stores` and migrate the existing `cameraUIStore` accordingly.
2. Incrementally refactor current UI controls into Radix UI based React components.
3. Replace imperative manipulation (like direct DOM element creation) with declarative JSX and hooks.
4. Introduce custom hooks for repetitive logic (e.g., retrieving world config, camera data, etc.).
5. Remove obsolete code, especially the class-based `UIController` and the old control panel implementation once parity is achieved.

### Deliverables
- Updated folder structure with all UI stores in `client/src/stores`.
- Initial set of Radix UI components for the control panel.
- Documentation describing the UI store architecture and component guidelines.

## TODO
### Setup & Libraries
- [ ] Install React and Radix UI packages in the client project.
- [ ] Ensure Zustand is configured and exported from a central `store` directory.
- [ ] Configure PropTypes for validation and add ESLint rule if available.

### Refactor Existing Code
- [ ] Move `cameraUIStore.js` to `client/src/stores` and export as `useCameraUIStore`.
- [ ] Remove legacy class components (`UIController`, `UnifiedControlPanel`) after porting functionality.
- [ ] Replace manual DOM creation with functional React components.
- [ ] Eliminate unused or stray `console.log` calls across the UI codebase.
- [ ] Attach the main UI store to `window.uiStore` in development mode.

### Component Development
- [ ] Build small reusable components with Radix UI primitives (buttons, sliders, inputs).
- [ ] Use fragments and keys appropriately when rendering lists.
- [ ] Implement custom hooks for shared logic (e.g., camera controls, world config access).

### Documentation & Testing
- [ ] Document UI store architecture and usage patterns in `docs`.
- [ ] Provide examples of components utilizing the new store and hooks.
- [ ] Plan for unit tests using React Testing Library (to be implemented later).


