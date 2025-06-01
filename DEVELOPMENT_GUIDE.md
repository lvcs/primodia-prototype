# Primodia Development Guide

This guide explains how to work with the separated client/server architecture.

## Project Structure Overview

```
primodia-prototype/
├── client/                 # React frontend
│   ├── src/               # Source code
│   ├── package.json       # Client dependencies
│   └── README.md          # Client-specific docs
├── server/                # Node.js backend
│   ├── controllers/       # API controllers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── package.json      # Server dependencies
│   └── README.md         # Server-specific docs
├── package.json          # Root workspace manager
└── README.md             # Main project docs
```

## Development Workflows

### 1. Full-Stack Development (Recommended for most work)

```bash
# From root directory
npm run install:all  # First time setup
npm run dev          # Starts both client and server
```

This runs:
- Client on `http://localhost:5173`
- Server on `http://localhost:3000`

### 2. Frontend-Only Development

```bash
cd client
npm install          # First time only
npm run dev
```

Use this when:
- Working on UI/UX
- Testing components in isolation
- Working on game graphics/Three.js

### 3. Backend-Only Development

```bash
cd server
npm install          # First time only
npm run dev
```

Use this when:
- Working on API endpoints
- Database schema changes
- Server-side game logic

### 4. Testing Individual Components

```bash
# Test client only
cd client && npm test

# Test server only
cd server && npm test

# Test both from root
npm run test
```

## Common Commands

### Root Level Commands
- `npm run dev` - Start both client and server
- `npm run start` - Production mode for both
- `npm run build` - Build client for production
- `npm run test` - Run all tests
- `npm run clean` - Remove all node_modules
- `npm run reset` - Clean and reinstall everything

### Client Commands (from client/ directory)
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm test` - Unit tests
- `npm run test:e2e` - End-to-end tests
- `npm run lint` - Code linting

### Server Commands (from server/ directory)
- `npm run dev` - Development server with auto-reload
- `npm start` - Production server
- `npm test` - Server tests

## Environment Setup

### Client Environment
The client typically doesn't need environment variables, but if needed, create `client/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### Server Environment
Create `server/.env`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=primodia
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

## Port Configuration

- **Client**: `http://localhost:5173` (Vite default)
- **Server**: `http://localhost:3000` (Express default)

These ports are configured to avoid conflicts.

## Troubleshooting

### Port Conflicts
If you get port conflicts:
1. Check what's running on the ports: `lsof -i :3000` or `lsof -i :5173`
2. Kill conflicting processes or change ports in config files

### Dependency Issues
```bash
# Reset everything
npm run reset

# Or manually:
npm run clean
npm run install:all
```

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check your `server/.env` file
3. Verify database exists: `psql -d primodia`

## Best Practices

1. **Always run `npm run install:all` after pulling changes** - Dependencies might have changed
2. **Use the root-level scripts for full-stack work** - They handle coordination between client/server
3. **Use individual project scripts for focused development** - Faster startup and clearer logs
4. **Keep environment files separate** - Client and server have different needs
5. **Test both independently and together** - Ensures proper separation of concerns

## IDE Setup

### VS Code Workspace
You can create a VS Code workspace file to work with both projects:

```json
{
  "folders": [
    { "name": "Root", "path": "." },
    { "name": "Client", "path": "./client" },
    { "name": "Server", "path": "./server" }
  ]
}
```

### Terminal Setup
Open multiple terminals:
1. Root terminal for workspace commands
2. Client terminal for frontend work
3. Server terminal for backend work 