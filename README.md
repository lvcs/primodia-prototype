# Primodia - 3D 4X Strategy Game

Primodia is a browser-based, multiplayer 3D strategy game inspired by classics like Civilization, Caesar, Pharaoh, Zeus, and Tropico.

## Technologies Used

- pnmp build manager

- **Frontend:**
  - Three.js for 3D rendering
  - JavaScript (ES6+)
  - Vite for fast development and hot reloading
  - Zustand for state management
  - Radix UI for component UI library

- **Backend:**
  - Express.js server
  - PostgreSQL database
  - Socket.io for real-time multiplayer communication
  - JWT for authentication

## Project Structure

```
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
```

## Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)

## Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/primodia.git
cd primodia
```

2. **Set up environment variables**

Create a `.env` file in the root directory with the following content:

```
PORT=3000
JWT_SECRET=your_random_secret_key
JWT_EXPIRES_IN=24h

# Database configuration
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=primodia
```

3. **Install dependencies**

```bash
npm run install:all
```

4. **Set up the database**

Create a PostgreSQL database named `primodia`. The server will automatically create the required tables on startup.

5. **Start the development server**

```bash
npm run dev
```

This will start both the client (Vite) and server (Express) with hot reloading enabled.

6. **Access the application**

Open your browser and navigate to:

```
http://localhost:5173
```

## Game Features

- **3D Hexagonal World**: A globe consisting of hexagon tiles with various terrain types
- **Resource Management**: Gather and manage resources like food, production, science, and gold
- **Civilization Building**: Build cities, infrastructure, and wonders
- **Technology Tree**: Research new technologies to unlock new units and buildings
- **Multiplayer**: Play with friends in a persistent online world
- **Authentication**: Register and log in to save your progress

## License

MIT 