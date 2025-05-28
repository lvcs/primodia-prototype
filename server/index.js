require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const db = require('./db');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const { authenticate } = require('./middleware/auth');
const { setupSocketHandlers } = require('./socket');

// Create Express app
const app = express();
const server = http.createServer(app);

// Set up Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/game', authenticate, gameRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }
  
  try {
    const user = require('./utils/jwt').verifyToken(token);
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Set up socket handlers
setupSocketHandlers(io);

// Initialize database and start server
const PORT = process.env.PORT || 3000;

db.connect()
  .then(() => {
    console.log('Database connected');
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }); 