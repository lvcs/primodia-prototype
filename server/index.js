import 'dotenv/config';
import express, { json } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { connect } from './db';
import authRoutes from './routes/auth';
import gameRoutes from './routes/game';
import { authenticate } from './middleware/auth';
import { setupSocketHandlers } from './socket';

// Create Express app
const app = express();
const server = createServer(app);

// Set up Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(json());

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
    const user = require('./utils/jwt').default.verifyToken(token);
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

connect()
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