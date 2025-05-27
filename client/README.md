# Primodia Client

The frontend client for Primodia, a 3D 4X strategy game built with React, Three.js, and Vite.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The client will be available at `http://localhost:5173` (or the next available port).

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Testing

Run unit tests:
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run end-to-end tests:
```bash
npm run test:e2e
```

Run e2e tests with UI:
```bash
npm run test:e2e:ui
```

### Linting

```bash
npm run lint
```

## Project Structure

- `src/components/` - React components
- `src/game/` - Game engine and Three.js related code
- `src/stores/` - Zustand state management
- `src/pages/` - Page components
- `src/styles/` - CSS and styling
- `test/` - Test files

## Environment Variables

Create a `.env` file in the client directory if needed for environment-specific configuration.

## Technologies Used

- **React 18** - UI framework
- **Three.js** - 3D graphics
- **Vite** - Build tool and dev server
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Vitest** - Testing framework
- **Playwright** - E2E testing
- **Socket.io Client** - Real-time communication with server 