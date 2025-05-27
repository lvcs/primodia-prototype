# Primodia Server

The backend server for Primodia, a 3D 4X strategy game. Built with Node.js, Express, Socket.io, and PostgreSQL.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

## Getting Started

### Install Dependencies

```bash
npm install
```

### Environment Setup

Create a `.env` file in the server directory with the following variables:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=primodia
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### Database Setup

Make sure PostgreSQL is running and create the database:

```sql
CREATE DATABASE primodia;
```

### Development

Start the development server with auto-reload:

```bash
npm run dev
```

The server will be available at `http://localhost:3001` (or the port specified in your .env file).

### Production

Start the production server:

```bash
npm start
```

### Testing

```bash
npm test
```

## Project Structure

- `controllers/` - Route controllers and business logic
- `middleware/` - Express middleware functions
- `models/` - Database models and schemas
- `routes/` - API route definitions
- `utils/` - Utility functions and helpers
- `index.js` - Main server entry point
- `db.js` - Database connection and configuration
- `socket.js` - Socket.io event handlers

## API Endpoints

The server provides RESTful API endpoints and real-time Socket.io communication for:

- User authentication and management
- Game state management
- Real-time multiplayer functionality
- Game data persistence

## Technologies Used

- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.io** - Real-time communication
- **PostgreSQL** - Database
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## Development Tools

- **nodemon** - Auto-restart during development 