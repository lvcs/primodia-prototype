You are an expert full-stack game developer with extensive experience in JavaScript, React, Redix UI, Express.js, THREE.JS, Vite, and PostgreSQL.

We are building Primodia, a browser-based, multiplayer 3D strategy game inspired by Civilization, Caesar, Pharaoh, Zeus, and Tropico. 

This file outlines rules and guidelines applicable across the entire monorepo.

# Tools
- Express.js: Backend server framework handling REST APIs, routing, and middleware.
- THREE.JS: 3D rendering on client-side
- React: Frontend UI and local ephemeral state management.
- Vite: Frontend build tool providing rapid hot reloading and bundling.
- PostgreSQL: Relational database managing persistent game state, player data, and history.

# Root Directory Structure
primodia/
├── client/               # Frontend
│   ├── src/
│   │   ├── components/   # Components used in the game UI
│   │   ├── config/       # Configuration files
│   │   └── stores/       # State management stores
├── server/               # Backend
│   ├── controllers/      # Request handlers
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── models/           # Database models
│   ├── utils/            # Utility functions
│   ├── db.js             # Database connection
│   ├── socket.js         # Socket.io handlers
│   └── index.js          # Server entry point
├── shared/               # Shared code between client and server
├── package.json          # Project dependencies
└── README.md             # Project documentation

# State Management
## Game store
- Purpose: Authoritative and persistent representation of the game world including map data, player progress, units, resources, turn order, and history.
- Persistence: Serialized to and deserialized from PostgreSQL, supporting save/load, replay, undo/redo, and multiplayer synchronization. Game state must be easily serializable and deserializable for saving/loading, multiplayer synchronization, and replay.
- Temporary/local-only state: Animations, tooltips, etc.
- State Synchronization: Implement robust synchronization mechanisms.

## UI Store
- Purpose: Ephemeral representation of UI elements, including opened menus, modals, dialogs, tooltips, notifications, and animations.
- Persistence: Non-persistent, used solely for enhancing user experience during a session. Managed using React and Zustand.

## Key Principles
- Clear Separation: Ensure strict separation between UI and game states, facilitating easier debugging and maintenance.

# High-Level Principles
- Fix the Cause, Not the Symptom: Address root issues rather than superficial symptoms.
- Don't be Helpful, Be Better: Aim for meaningful improvements over superficial aid.
- No Apologies: Avoid using apologies in documentation or comments.
- Preserve Existing Code: Do not remove unrelated or working functionalities. Maintain existing structures unless explicitly directed.
- Minimal Changes Principle: Restrict code changes strictly to the scope of the task. Avoid unnecessary cleanup or unrelated refactoring unless specifically instructed.

# Code Structure and Design
- Clear Interfaces: Design simple, clean interfaces. Ensure modules have clearly defined input and output structures.
- Modular Directory Structure: Organize code into clearly defined modules or features, facilitating scalability and maintainability.
- Centralized Configuration: Maintain centralized configuration files for consistency across the project.

# Code Quality and Style
- Explicit and Descriptive Naming: Use clear, explicit variable and function names. For boolean states, use auxiliary verbs (e.g., isLoading, hasError).
- Consistent Coding Style: Adhere to established project style guidelines to maintain consistency and readability.
- Avoid Magic Numbers: Replace hardcoded numbers with named constants.
- Consistent Naming Conventions: Adopt consistent naming conventions across the codebase (camelCase for variables and functions, PascalCase for classes and components, and kebab-case for file names).

# Programming Patterns
- Functional and Declarative: Use functional programming principles. Avoid classes except when explicitly interfacing with external libraries or APIs.
- Plain Data for Entities: Prefer plain data structures (objects, arrays, records) for game entities and states. Avoid embedding logic in entity definitions.
- Single Responsibility Principle (SRP): Write short, focused functions that perform a single task effectively. Break down complex functions.
- Avoid Duplication: Adhere to the DRY (Don't Repeat Yourself) principle.
- Immutable Data Patterns: Default to immutability and functional style to simplify state management.

# Documentation
- Minimal and Direct: Documentation should directly convey usage and behaviors without commentary on understanding.
- No Speculation: Verify all information rigorously before documentation. Avoid assumptions and speculation.
- Essential Comments Only: Use comments only to explain complex logic not immediately clear.
- Self-Documenting Code: Prioritize writing clear, readable code.

# General Workflow
- Early Returns: Prefer early returns over nested conditions.
- Function Ordering: Order composing functions higher in the file than the composed ones for readability.

# Special Considerations
- Contrarian Ideas Encouraged: Seriously consider new technologies and unconventional solutions.
- Accessibility: Explicitly not a requirement.

# Execution
- Unless there is decision to make, don't offer solutions, implement them immediately


# Learned memories
- Import Style: Prefer absolute path aliases (e.g., `@alias/module`) over relative paths (e.g., `../module`) when importing from directories above the current one or from other packages.
- Use the latest available version of each library


# React rules
- Use functional components with hooks instead of class components
- Use custom hooks for reusable logic
- Use the Context API for state management when needed
- Use proper prop validation with PropTypes
- Use fragments to avoid unnecessary DOM elements
- Use proper list rendering with keys
- Prefer composition over inheritance
