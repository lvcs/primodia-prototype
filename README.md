# Primodia - 3D 4X Strategy Game

Primodia is a browser-based, multiplayer 3D strategy game inspired by classics like Civilization, Caesar, Pharaoh, Zeus, and Tropico.

## Project Structure

This project is divided into two main components:

- **`client/`** - React frontend with Three.js for 3D graphics
- **`server/`** - Node.js backend with Express and Socket.io

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database (for server)

### Option 1: Run Everything Together

From the root directory:

```bash
# Install all dependencies
npm run install:all

# Run both client and server in development mode
npm run dev
```

This will start:
- Client at `http://localhost:5173`
- Server at `http://localhost:3001`

### Option 2: Run Client Only

```bash
cd client
npm install
npm run dev
```

### Option 3: Run Server Only

```bash
cd server
npm install
npm run dev
```

Make sure to set up your `.env` file in the server directory (see `server/README.md` for details).

## Available Scripts (Root Level)

- `npm run dev` - Run both client and server in development mode
- `npm run start` - Run both client and server in production mode
- `npm run build` - Build the client for production
- `npm run test` - Run tests for both client and server
- `npm run install:all` - Install dependencies for root, client, and server
- `npm run clean` - Remove all node_modules and build artifacts
- `npm run reset` - Clean and reinstall everything

## Individual Project Documentation

- [Client Documentation](./client/README.md) - Frontend setup and development
- [Server Documentation](./server/README.md) - Backend setup and development