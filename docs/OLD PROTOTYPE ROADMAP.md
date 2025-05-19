# Project Primodia - Development Roadmap

This document outlines the planned architectural improvements, libraries, features, and coding practices for Project Primodia. Its goal is to guide development towards a robust, maintainable, and scalable game.

## I. Architectural Goals

1.  **Separate "Game Engine" from "UI Shell"**
    *   **Engine as pure data + rules:**
        *   Isolate your simulation logic (map gen, turn resolution, AI) into a library or Web Worker.
        *   Expose a clean API (commands/events) so the UI just "subscribes" and "renders."
    *   **UI Shell as dumb renderer:**
        *   Your React/Vue/Svelte components only care about drawing tiles, stats, menus—never mutating game state directly.
    *   **Why?** You'll swap in a fancy 3D view or even a native client later without rewriting your core algorithms.

2.  **Adopt a Component-Driven Architecture**
    *   Refactor the entire UI (`client/src/ui/`) into a component-based structure.
    *   **Atomic Design:**
        *   Break UI into Atoms (Buttons, Icons), Molecules (TileCard, ResourceBar), Organisms (Sidebar, MapGrid), Templates (page-level structures), and Pages (specific instances of templates).
    *   **Single Responsibility & Conciseness:**
        *   One component = one job. Each component should adhere to the Single Responsibility Principle.
        *   If a component file grows significantly (e.g., over 200 lines), split it to maintain clarity and focus.
    *   **Lazy-load heavy pieces:**
        *   Code-split non-critical UI components, such as civilization info panels or diplomacy screens, so the initial application load remains snappy.

3.  **Lean on TypeScript & Strict Types**
    *   **Domain Types:**
        *   Define `Tile`, `Unit`, `Player`, `GameEvent` etc., potentially as discriminated unions for clarity and type safety.
        *   Eliminate `any` types; strive for full type coverage.
    *   **Contract First:**
        *   Your engine's API signature is the "law." Type errors should be caught by the compiler, not during human review or at runtime.

4.  **State Management Strategy: XState for Core Logic, Redux/Flux for UI State**
    *   A hybrid approach leveraging the strengths of different state management paradigms is recommended.

    *   **Core Game Logic (XState / Statecharts):**
        *   Model complex game logic (e.g., turn phases like Movement → Combat → EndTurn, AI decision trees, player action workflows, game setup sequences) as explicit states using XState or similar statechart libraries.
        *   **When to Reach for Statecharts (XState):**
            *   **Complex, multi-phase flows:** Ideal for game turns (Move → Attack → Production), dialogue trees, setup wizards, drag-and-drop lifecycles, and other sequences with distinct stages.
            *   **Hierarchical/parallel states:** When you need to manage states that can exist in parallel (e.g., "UI: Loading vs. Idle" AND "GamePhase: Combat vs. Peace") or have nested sub-states.
            *   **Built-in guarantees & explicitness:** Ensures no "impossible transitions" occur, as every state and event is explicitly modeled. The machine defines what can happen and when.
            *   **Visualization & testing:** XState offers out-of-the-box state machine visualization, step-by-step simulation capabilities, and facilitates deterministic testing of logic flows.
        *   **Pros (XState):**
            *   Self-documenting: The state machine itself serves as a clear specification of behavior.
            *   Excellent for managing collision-free asynchronous flows, timeouts, and spawned/invoked services.
            *   Encourages thinking in terms of explicit states and transitions, leading to more robust and understandable logic.
        *   **Cons (XState):**
            *   Upfront modeling cost: Every state, event, and transition must be declared, which can feel verbose for very simple state.
            *   Smaller community than Redux (though rapidly growing and very active).
            *   Can feel over-engineered for trivial, localized state.
        *   Consider running XState interpreters in Web Workers for computationally intensive logic (e.g., AI lookahead, complex simulations) to keep the main UI thread responsive.

    *   **UI & Peripheral Application State (Redux / Flux / MVI-ish):**
        *   For UI-specific state and other application-level "data" state, adopt a pattern like Flux (e.g., using Redux Toolkit, Zustand, or even React Context with hooks for simpler cases).
        *   **When to Reach for Redux (or similar):**
            *   **Global UI state management:** Managing the state of forms, dropdowns, panel visibility (e.g., "is the sidebar open?"), user preferences, and caching client-side API results.
            *   **CRUD-style data operations:** When you need to fetch, store, update, and delete data entities in a centralized manner. Reducers can often mirror REST API endpoints or database operations.
            *   **Tooling familiarity and ecosystem:** The Redux ecosystem is vast and mature, offering tools like Redux Toolkit (for boilerplate reduction and best practices), Immer (for immutable updates), React-Redux hooks, and powerful DevTools with time-travel debugging.
        *   **Pros (Redux):**
            *   Very predictable: State changes are driven by pure functions (reducers) taking the current state and an action to produce the next state.
            *   Relatively low mental overhead for simple, well-defined data flows.
            *   Mature and extensive ecosystem with strong community support and many established patterns.
        *   **Cons (Redux):**
            *   Can lead to significant boilerplate for actions, action creators, and reducers, especially as the application grows (though Redux Toolkit mitigates this significantly).
            *   Visualizing complex, multi-step business logic flows that span multiple actions and reducers can be challenging.
            *   Side-effects (async operations, API calls) are typically handled by middleware like sagas or thunks, which can sometimes feel detached from the reducers they ultimately affect.

    *   **Mixing, Matching, and Recommendation for this 4X SPA:**
        *   You don't need to pick one state management solution "for everything." A proven and effective pattern is to combine their strengths:
        *   **1. Core Game Engine Logic with XState:**
            *   Model your game's core mechanics—turn phases (e.g., Movement → Combat → Production → Diplomacy), AI decision trees, complex user action workflows (e.g., city building sequence)—as XState machines.
            *   Run computationally heavy XState interpreters in Web Workers to offload the main thread, ensuring a responsive UI.
        *   **2. Peripheral UI State with Redux (or similar):**
            *   Use Redux Toolkit (or a lighter alternative like Zustand, or React Context + hooks for very simple needs) to manage UI-specific state. This includes:
                *   Currently selected unit, tile, or city.
                *   Map viewport settings (zoom level, pan position).
                *   Visibility of UI elements like modals, sidebars, tooltips.
                *   User interface preferences and settings.
                *   Cached asset manifests or other non-critical global data.
        *   **3. Bridging XState and Redux/UI State:**
            *   **XState to UI:** Have XState machines emit domain events or update their context. The UI layer (subscribing via Redux or directly) can listen for these changes/events (`onTransition` in XState) to update its view or corresponding Redux state slices.
            *   **UI to XState:** User interactions in the UI (e.g., clicking a button to end a turn) should dispatch events/actions that are sent to the relevant XState machine.
            *   A common pattern is to maintain a slice of Redux state that holds a "snapshot" or relevant parts of an XState machine's context, allowing other parts of the UI to react to it. User-driven events from the UI would then be dispatched as events back into the XState machine.
        *   **Specific Recommendation for this 4X SPA:**
            *   **Core "Engine":** Model it in XState. Each game turn can be a parent state, with substates for movement, combat, production, diplomacy, etc. This provides clear, testable transitions and allows visualization of the entire game flow.
            *   **UI Layer:** Use Redux Toolkit (or Zustand for a potentially simpler API if preferred) to hold UI-centric state like "currently selected unit," "map zoom level," "is settings modal open?" and so on. This keeps your UI rendering logic decoupled from the core engine mechanics.
            *   **Integration:** Consider wrapping your XState game machine interpreter in a custom React hook (e.g., `useGameMachine`) if using React. This hook can provide the machine's context and a `send` function to the UI components. UI components subscribe to this context for rendering and use `send` to dispatch "UI → game" commands/events into the XState machine. Relevant snapshots of the machine's context can be pushed into Redux if needed for broader UI access or for DevTools integration.

5.  **Embrace Functional Programming Patterns & Reactive Streams**
    *   **Pure Functions:**
        *   Prioritize pure functions for core game logic (e.g., map generation, combat resolution, AI decisions). These functions take input data and return new data without side effects, enhancing testability and predictability (input/data in, new data out).
    *   **Immutability:**
        *   Favor immutable data structures where practical. This aids in creating snapshots (e.g., for "undo" functionality, time-travel debugging) and simplifies change detection and state management.
    *   **Reactive Streams (RxJS / Observables - optional but recommended for complex async):**
        *   Utilize RxJS or similar observable libraries for managing complex asynchronous event streams if you stream user input (drag, clicks) or game-tick events. This is particularly useful for:
            *   User input (e.g., drag-and-drop, complex click sequences, keyboard combinations).
            *   High-frequency game events (e.g., game ticks).
            *   Network events in a multiplayer context.

## II. Libraries & Technologies to Introduce/Expand

*   **XState:** For core game logic state machines/statecharts.
*   **TypeScript:** For strong typing throughout the codebase.
*   **RxJS:** (Optional, as per I.5) For managing complex asynchronous event streams.
*   **(Potentially) UI Framework:** If the complexity of the VanillaJS component system grows significantly, evaluate adopting a lightweight UI framework (e.g., Svelte, Vue, or Preact/React) to leverage its component model, lifecycle management, and ecosystem.
*   **(Potentially) Redux Toolkit / Zustand / Jotai:** For UI state management, especially if a UI framework is adopted or a Flux-like pattern is desired.

## III. Key Features & Refactors (Examples - To Be Expanded)

*   **Full UI Componentization:** Complete the refactor of `client/src/ui/` based on Atomic Design and the principles in Section I.2.
*   **Advanced AI:** Implement more sophisticated AI for opponent behavior.
*   **Multiplayer Functionality:** Robust real-time or turn-based multiplayer.
*   **Save/Load Game State:** Implement a system for saving and loading game progress.
*   **Expanded Game Mechanics:** (e.g., Unit production, research, diplomacy - to be detailed).
*   **Performance Optimization:**
    *   Proactively monitor and optimize rendering, game logic, and memory usage.
    *   Utilize Web Workers for heavy computations like path-finding, AI lookahead, or large-scale simulations.
    *   Implement memoization techniques (e.g., React.memo/useMemo if using React, or custom memoization) to prevent unnecessary re-renders/re-computations, especially for large maps or complex UI components.
    *   Employ UI Virtualization to render only visible elements when dealing with large datasets (e.g., map tiles using libraries like react-window or equivalent, or custom solutions for canvas rendering).
    *   Continue emphasis on lazy-loading for UI components.

## IV. Coding Practices & Conventions

1.  **Single Responsibility Principle (SRP):** Beyond UI components (covered in I.2), ensure functions, classes, and modules in all parts of the system have one primary responsibility.
2.  **Composition over Inheritance (OO-Light)**
    *   **Entity-Component System (ECS) (Consider for game entities):**
        *   Game units could be modeled as IDs with attached "components" (e.g., `Position`, `Health`, `AIBehavior`).
    *   **Favor small value objects and pure functions:**
        *   Instead of deep class hierarchies like `class Unit extends GameObject`, prefer plain objects for data and pure functions for behavior.
    *   **Use classes sparingly:**
        *   Appropriate for services (e.g., `AudioManager`, `SaveLoadService`) where a lightweight class with methods encapsulates a clear responsibility.
3.  **LLM-Friendly Code:**
    *   Write clear, well-commented code, especially for complex logic or non-obvious decisions.
    *   Use descriptive variable and function names.
    *   Structure code logically.
4.  **Seeded Randomness:**
    *   All game-state affecting procedural generation and random choices MUST use the global `RandomService` to ensure reproducibility via map seeds. Avoid direct use of `Math.random()` for such purposes.
5.  **Modularity & Decoupling:**
    *   Strive for loosely coupled modules to facilitate independent development, testing, and refactoring. This is supported by clear API boundaries (see I.1).
6.  **Error Handling:**
    *   Implement robust error handling and logging.
7.  **Testing:**
    *   Introduce unit and integration tests for critical game logic (especially pure functions and state machine transitions) and UI components.
    *   Utilize testing frameworks like Vitest or Jest for unit-testing the engine and critical UI logic.
    *   Employ Storybook or similar tools for documenting and visually testing UI components in isolation.
8.  **Tooling for Code Quality & Consistency:**
    *   Enforce code style and catch common errors using ESLint and Prettier.
9.  **Continuous Integration/Continuous Deployment (CI/CD):**
    *   Set up a CI/CD pipeline (e.g., using GitHub Actions) to automatically run linters, tests, and potentially builds on every pull request or push to main branches.
10. **Version Control:**
    *   Follow good Git practices (clear commit messages, feature branches, etc.).
11. **Code Reviews:** (If applicable)
    *   Conduct code reviews to maintain quality and share knowledge.

## V. Future-Proofing & Maintainability

1.  **Domain-Driven Design (DDD) Principles:**
    *   Adhere to the principle of keeping core game rules, logic, and domain models clearly defined and isolated within the "Game Engine" (as per I.1).
    *   This allows game designers or developers to understand and tweak game mechanics with minimal impact on the UI or other systems, preventing UI-specific hacks for game logic.
2.  **Extensibility & Moddability (Plugin System):**
    *   Architect the game engine with future extensibility in mind.
    *   Consider designing systems that could support a plugin architecture or loading external "modules" (e.g., scripted behaviors, new unit types) or data-driven configurations (e.g., JSON rule-packs). This can facilitate community mod support or easier official content expansion.
3.  **Comprehensive Documentation & Onboarding:**
    *   **Living Architecture Document:** Maintain and regularly update a high-level architecture document (like this roadmap) to reflect the current state and future direction.
    *   **API Documentation:** Generate and maintain API documentation, especially for the Game Engine's public interface. Tools that leverage TypeScript types can automate parts of this.
    *   **Code Comments & Clarity:** Continue to emphasize clear, well-commented code (as per IV.3) to explain complex sections, algorithms, or design decisions.
    *   The goal is to reduce the onboarding time for new developers and ensure the project remains understandable and maintainable as it grows.

## VI. Phased Tooling, Quality, and Lifecycle Roadmap

This section outlines a phased approach to implementing tooling, quality assurance practices, and development lifecycle improvements for the Vite + Three.js 4X SPA.

### Phase 1: Foundations

*   **Monorepo & Package Boundaries:**
    *   Adopt Nx or Turborepo (or Yarn/npm/pnpm Workspaces) to structure the project.
    *   Define clear package boundaries, for example:
        *   `packages/engine`: Pure TypeScript simulation logic (game rules, AI, procedural generation).
        *   `packages/ui`: Frontend application (e.g., React/Vue/Svelte) including the Three.js rendering layer.
*   **TypeScript "Strict" Everywhere:**
    *   Configure `tsconfig.json` with `strict: true`, `noImplicitAny: true`, `forceConsistentCasingInFileNames: true`, and other strictness flags across all packages.
*   **Module Bundling & Configuration (Vite):**
    *   Optimize Vite configuration for the monorepo structure.
    *   Implement aliased paths (e.g., `@engine/*`, `@ui/*`) for cleaner imports.
    *   Manage shared libraries and dependencies effectively.
    *   Set up environment-specific builds (development, staging, production).

### Phase 2: Code Quality & Developer Experience (DX)

*   **ESLint + Prettier:**
    *   Establish a shared ESLint and Prettier configuration at the monorepo root.
    *   Integrate with Husky pre-commit hooks and lint-staged to automatically lint and format staged files (`.ts`, `.tsx`, `.vue`, etc.).
*   **Commit Lint & Conventional Commits:**
    *   Enforce Conventional Commits (e.g., using `commitlint` and `commitizen`).
    *   This enables automatic changelog generation and better semantic versioning.
*   **EditorConfig & VSCode Workspace Settings:**
    *   Include an `.editorconfig` file at the root to ensure consistent coding styles across different editors.
    *   Provide recommended VSCode workspace settings (`.vscode/settings.json`) to sync formatting preferences, import sorting, and suggest relevant editor extensions.

### Phase 3: Testing Matrix

*   **Unit Testing:**
    *   **Engine:** Utilize Vitest. Aim for a high coverage threshold (e.g., near 100%) for pure-function modules (map generation, combat resolution, core game logic).
    *   **UI:** Use Jest (or Vitest) with React Testing Library (or equivalent for your chosen UI framework) for critical UI rendering logic (HUD elements, menus, info panels).
*   **Integration / End-to-End (E2E) Testing:**
    *   Employ Cypress or Playwright to test key user "playthrough" flows (e.g., start new game → move units → construct building → end turn → check game state).
*   **Visual Regression Testing:**
    *   Integrate Storybook with a visual regression tool like Chromatic or Loki to automatically detect unintended style or markup changes in UI components.
*   **Test Coverage Reporting:**
    *   Set up Codecov (or a similar service integrated with GitHub/GitLab) to track test coverage over time and potentially gate Pull Requests based on minimum coverage thresholds or drops in coverage.

### Phase 4: Continuous Integration / Continuous Deployment (CI/CD) Pipelines

*   **Continuous Integration (CI) - e.g., GitHub Actions, GitLab CI:**
    1.  **Workflow Steps:** On every push/PR:
        *   Install dependencies (respecting monorepo structure).
        *   Run Linters (ESLint).
        *   Perform Type-checking (TypeScript compiler).
        *   Execute Unit Tests (Vitest/Jest).
        *   Build all relevant packages/applications.
        *   (Optional) Build Storybook for visual regression snapshots.
    2.  **Artifacts:** Produce and store build artifacts:
        *   `engine` package (if published separately).
        *   `ui` application build (static assets).
        *   Storybook static site.
*   **Continuous Deployment (CD):**
    *   **Staging Environment:** Automatically deploy the UI build and Storybook to a hosting service (e.g., Netlify, Vercel, GitHub Pages) upon merge to a `develop` or `staging` branch.
    *   **Production Environment:** Implement a gated release process for the `main` branch. Use `semantic-release` (or similar) to automate version bumping, changelog generation (from Conventional Commits), and creating GitHub/GitLab Releases.

### Phase 5: Observability & Metrics

*   **Error Tracking:**
    *   Integrate Sentry, Bugsnag, or a similar service into both the UI and the engine (potentially via a custom wrapper for the engine if it runs in a non-browser environment like a Web Worker without direct SDK support).
*   **Performance Monitoring:**
    *   **Automated Lighthouse CI:** Include Lighthouse audits in the CI pipeline to check performance budgets and fail builds if budgets are exceeded.
    *   **Real User Monitoring (RUM):** Track Web Vitals (LCP, FID, CLS) and custom metrics (e.g., FPS, frame drops during gameplay, critical asset load times) from actual user sessions.
*   **Analytics / Telemetry (Optional, with user consent):**
    *   Track high-level game interaction metrics like average session length, turn counts per game, feature usage (e.g., how often diplomacy panel is opened, which victory conditions are pursued).

### Phase 6: Performance Budgets & Optimizations

*   **Bundle Analysis:**
    *   Regularly use tools like `rollup-plugin-visualizer` or `vite-plugin-bundle-analyzer` to inspect the JavaScript bundle composition and identify areas for optimization.
*   **Code-Splitting & Lazy-Loading:**
    *   Implement dynamic `import()` for heavy UI screens/views (e.g., detailed tech tree, diplomacy interface, full-screen map overlays).
    *   Apply lazy-loading strategies for Three.js scene assets or components that are not immediately visible.
*   **Web Workers:**
    *   Offload computationally intensive tasks from the main thread to Web Workers. Examples:
        *   Path-finding algorithms.
        *   AI decision-making (lookahead, simulations).
        *   Procedural map generation steps.
    *   Use libraries like Comlink to simplify communication with Web Workers.
*   **Asset Pipeline Optimization:**
    *   **3D Assets:** Use Draco compression (or similar) for 3D models.
    *   **Textures:** Employ texture atlases, compression (e.g., Basis Universal, WebP), and mipmapping.
    *   **Streaming:** Investigate on-demand streaming for large assets or parts of the game world if applicable.

### Phase 7: Documentation & Onboarding

*   **API Documentation (Engine):**
    *   Use Typedoc or a similar tool to generate HTML documentation from TypeScript JSDoc comments in the `@engine` package.
*   **Component Library (UI):**
    *   Maintain Storybook as a living document for UI components, showcasing their variations, props, and usage examples.
*   **Architecture Documentation:**
    *   Keep key architecture decisions and data-flow diagrams documented in Markdown files within the repository (or a dedicated MkDocs/Docusaurus site).
    *   Ensure the state-management strategy (XState, Redux) is clearly documented.
*   **Onboarding Guide:**
    *   Create a "First PR" or "Developer Setup" guide that walks new contributors through cloning the repository, installing dependencies, running codegen (if any), executing tests, and deploying a local Storybook instance.

### Phase 8: Security & Maintenance

*   **Dependency Management:**
    *   Use Dependabot (GitHub) or Renovate Bot to automatically create Pull Requests for updating outdated dependencies.
*   **Secret Scanning:**
    *   Enable GitHub Secret Scanning (or similar tools) to detect accidentally committed secrets.
*   **License Compliance:**
    *   Periodically run `license-checker` or a similar tool to review and ensure compliance with the licenses of third-party dependencies.

### Phase 9: Continuous Improvement

*   **CI Health Dashboard:**
    *   Monitor CI build times, test execution times, and test flake rates. Aim to keep these metrics healthy.
*   **Toolchain Retrospectives:**
    *   Conduct periodic (e.g., quarterly) reviews of the development toolchain.
    *   Identify and remove unused tools, refine scripts, and evaluate new tools that could improve DX or efficiency.
*   **Developer Community & Feedback:**
    *   Establish channels for developers working on the project to provide feedback on the toolchain and development processes.
    *   Actively solicit pain points and suggestions for improvement.

This roadmap is a living document and should be updated as the project evolves. 