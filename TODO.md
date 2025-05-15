# Project Primodia - TODO List

## I. Game Features & Systems (Derived from GAME.MD)

### Core World & Map
- [x] Implement Procedurally Generated 3D Globe (Base structure and Voronoi generation)
- [x] Implement Diverse Terrains, Climates, Elevation (Mountains, Cliffs) (Initial elevation and plate generation logic, FBM noise issue addressed)
- [ ] Implement Rivers & Water Bodies
- [ ] Implement Strategic Resources System
- [ ] Implement Natural Wonders System
- [ ] Implement World Events & Disasters (incl. Moon-phase Flooding)
- [ ] Randomize number of tectonic plates based on globe points.

### UI/UX & Core Systems
- [x] Implement 3D Globe Rendering & Interaction (Base rendering and event handling)
- [ ] Implement Manual Save & Load (Multiple Slots)
- [ ] Implement Autosave per Turn
- [ ] Implement Tile Highlighting & Context Menus
- [ ] Implement Customizable Keyboard Shortcuts
- [ ] Implement Turn Counting & Game Time Progression
- [ ] Implement Event Log Panel
- [ ] Implement In-Game Tutorial & Help System (Seed input and debug display components)
- [ ] Implement Zoom to Tile with smooth animation (earth panning/rotation)
- [ ] Implement Undo / Redo Actions (Player Convenience)

### City Management & Economy
- [ ] Implement Specialized City Districts & Buildings (Core for city functionality)
- [ ] Implement Detailed Production Chains
- [ ] Implement Resource Distribution & Logistics (Roads, Trains, Planes)
- [ ] Implement Citizen Needs & Happiness System
- [ ] Implement Taxation & Treasury System
- [ ] Implement Inter-City & International Trade System
- [ ] Implement Labor Management & Labour Pooling
- [ ] Implement Population Migration System
- [ ] Implement City Services (Entertainment, Education, Health, etc.)
- [ ] Implement Villages & Rural Development
- [ ] Implement Monuments and Monument Construction System

### Combat
- [ ] Implement Turn-Based Tactical Combat on Hex Grid
- [ ] Implement Diverse Unit Types (Land, Sea, Air) (Start with a few core types)
- [ ] Implement Unit Experience & Promotion System
- [ ] Implement Combined Arms & Support Unit Mechanics
- [ ] Implement Siege Warfare Mechanics

### Technology & Culture
- [ ] Implement Tech Tree & Research System
- [ ] Implement Culture System & Civics Tree
- [ ] Implement "Eureka" Moments for Tech Boosts
- [ ] Implement Government Policies (Policy Cards) & Laws System
- [ ] Implement Cultural Influence System

### Civilizations & Progression
- [ ] Design & Implement Unique Civilizations
- [ ] Design & Implement Leader System
- [ ] Implement Eras of Play

### Multiplayer & AI
- [ ] Develop Challenging & Scalable AI Opponents (Start with basic AI logic)
- [ ] Implement Robust Multiplayer Support (Online, Simultaneous Turns)

### Diplomacy
- [ ] Implement Complex Diplomatic Interactions & AI Personalities
- [ ] Implement Alliances & Country Unions/Federations
- [ ] Implement World Congress / United Nations System

### Religion
- [ ] Implement Religion Founding & Spreading Mechanics
- [ ] Implement Customizable Religious Beliefs
- [ ] Implement Religious Competition & Theological Combat

### Victory Conditions
- [ ] Implement Score Victory (Simplest to start)
- [ ] Implement Domination Victory
- [ ] Implement Science Victory
- [ ] Implement Culture Victory
- [ ] Implement Religious Victory
- [ ] Implement Diplomatic Victory

## II. Architectural Goals (Derived from ROADMAP.MD)
- [ ] Separate Game Engine (Pure Logic) from UI Shell (Renderer)
- [ ] Define Engine API as "Contract First"
- [ ] Adopt Component-Driven UI Architecture (Atomic Design)
- [ ] Enforce Strict TypeScript & Well-Defined Domain Types
- [ ] Implement Hybrid State Management: XState for Core Logic, Redux/Flux for UI
- [ ] Model Core Game Logic with XState Statecharts
- [ ] Embrace Functional Programming Principles (Pure Functions, Immutability)
- [ ] Refactor UI into Reusable Atomic Design Components
- [ ] Implement Lazy-Loading for Heavy UI Components
- [ ] Utilize Web Workers for XState Interpreters (Performance)
- [ ] Manage UI-Specific State with Redux Toolkit/Zustand (or similar)
- [ ] Define Clear Bridging Mechanisms between XState and UI State
- [ ] Evaluate & Utilize RxJS for Complex Async Event Streams (Optional)

## III. Libraries & Technologies (Adoption Plan from ROADMAP.MD)
- [ ] Fully Adopt TypeScript Across the Codebase
- [ ] Adopt XState for Core Game Logic State Machines
- [ ] Evaluate & Potentially Adopt a UI Framework (Svelte, Vue, Preact/React)
- [ ] Evaluate & Potentially Adopt Redux Toolkit/Zustand/Jotai for UI State

## IV. Phased Tooling, Quality, and Lifecycle Roadmap (from ROADMAP.MD)

### Phase 1: Foundations
- [ ] Setup Monorepo (Nx, Turborepo, or Workspaces)
- [ ] Define Clear Package Boundaries (e.g., `packages/engine`, `packages/ui`)
- [ ] Enforce TypeScript "Strict" Compiler Options Everywhere
- [ ] Optimize Vite Configuration (Path Aliases, Shared Libs, Env-Specific Builds)

### Phase 2: Code Quality & Developer Experience (DX)
- [ ] Setup ESLint + Prettier (Shared Config, Husky Pre-commit Hooks, Lint-Staged)
- [ ] Setup Commit Lint & Enforce Conventional Commits (e.g., using Commitizen)
- [ ] Setup EditorConfig & Recommended VSCode Workspace Settings

### Phase 3: Testing Matrix
- [ ] Implement Unit Testing for Engine (Vitest, High Coverage for Pure Logic)
- [ ] Implement Unit Testing for UI (Jest/Vitest + React Testing Library or similar)
- [ ] Implement Integration / End-to-End (E2E) Testing (Cypress or Playwright)
- [ ] Implement Visual Regression Testing (Storybook + Chromatic or Loki)
- [ ] Implement Test Coverage Reporting (Codecov or similar, PR Gating)

### Phase 4: Continuous Integration / Continuous Deployment (CI/CD)
- [ ] Setup CI Pipeline (GitHub Actions/GitLab CI: Install, Lint, Type-check, Test, Build)
- [ ] Configure CI Artifact Generation (Engine Package, UI Build, Storybook Static Site)
- [ ] Setup CD for Staging Environment (Auto-deploy UI & Storybook on `develop` merge)
- [ ] Setup CD for Production Environment (Gated Release, Semantic-Release on `main`)

### Phase 5: Observability & Metrics
- [ ] Implement Error Tracking (Sentry/Bugsnag for UI & Engine)
- [ ] Implement Performance Monitoring (Lighthouse CI, Web Vitals, Custom RUM)
- [ ] Implement Analytics/Telemetry for Feature Usage (Optional, User Consent)

### Phase 6: Performance Budgets & Optimizations
- [ ] Implement Bundle Analysis (e.g., `rollup-plugin-visualizer`)
- [ ] Implement Code-Splitting & Lazy-Loading (Dynamic Imports, Three.js Assets)
- [ ] Utilize Web Workers for Heavy Tasks (Path-finding, AI, Map Gen via Comlink)
- [ ] Optimize Asset Pipeline (Draco Compression, Texture Atlases, On-demand Streaming)

### Phase 7: Documentation & Onboarding
- [x] Maintain Comprehensive & Living Project Documentation (Architecture, API, Onboarding) (ROADMAP.MD and GAME.MD creation and extensive updates)
- [ ] Generate Typedoc API Documentation for Engine Package
- [ ] Maintain Storybook as a Living UI Component Library & Usage Guide
- [ ] Create & Maintain Architecture Documents (Markdown/MkDocs: Data-Flow, State Strategy)
- [ ] Create Developer Onboarding Guide ("First PR" Instructions)

### Phase 8: Security & Maintenance
- [ ] Setup Dependabot/Renovate for Automated Dependency Updates
- [ ] Enable GitHub Secret Scanning (or similar tools)
- [ ] Implement License Compliance Checking (e.g., `license-checker`)

### Phase 9: Continuous Improvement
- [ ] Create & Monitor CI Health Dashboard (Build/Test Times, Flake Rate)
- [ ] Conduct Quarterly Toolchain Retrospectives & Refinements
- [ ] Establish Developer Feedback Loop for Toolchain & Process Improvement

## V. Key Development Refactors (from ROADMAP.MD)
- [ ] Implement Comprehensive Save/Load Game State System (Covered in UI/UX & Core Systems)
- [ ] Complete Full UI Componentization according to Atomic Design
- [ ] Develop Advanced AI Behavior and Decision Making
- [ ] Implement Robust Multiplayer Functionality
- [ ] Detail and Implement Expanded Game Mechanics (Units, Research, Diplomacy)
- [ ] Implement Proactive Performance Optimization Strategies

## VI. Coding Practices & Conventions (from ROADMAP.MD)
- [x] Ensure All Game-State Randomness uses Seeded `RandomService` (SeedableRandom.js, RandomService.js, integration into worldgen, plates, voronoi, terrain)
- [ ] Maintain LLM-Friendly Code (Clear, Well-Commented, Descriptive Names) (Extensive refactoring of constants and comments in platesGenerator.js)
- [ ] Enforce Single Responsibility Principle (SRP) across Codebase
- [ ] Adopt Composition over Inheritance (Consider ECS for Game Entities)
- [ ] Promote Modularity & Decoupling via Clear API Boundaries
- [ ] Implement Robust Error Handling & Logging Mechanisms
- [ ] Follow Good Git Version Control Practices (Conventional Commits)
- [ ] Conduct Regular Code Reviews

## VII. Future-Proofing & Maintainability (from ROADMAP.MD)
- [ ] Adhere to Domain-Driven Design (DDD) Principles for Game Engine
- [ ] Architect Engine for Extensibility & Moddability (Plugin System Consideration)