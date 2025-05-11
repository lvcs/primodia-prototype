import { io } from 'socket.io-client';

let socket;

export function setupSocketConnection() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('No authentication token found');
    return;
  }
  
  // Connect to the socket server with authentication
  socket = io('http://localhost:3000', {
    auth: {
      token
    }
  });
  
  // Connection events
  socket.on('connect', () => {
    console.log('Connected to server');
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  // Game events
  socket.on('game:update', (gameData) => {
    handleGameUpdate(gameData);
  });
  
  socket.on('player:joined', (player) => {
    console.log(`Player joined: ${player.username}`);
    // TODO: Update player list in UI
  });
  
  socket.on('player:left', (player) => {
    console.log(`Player left: ${player.username}`);
    // TODO: Update player list in UI
  });
  
  socket.on('chat:message', (message) => {
    console.log(`Chat: ${message.username}: ${message.text}`);
    // TODO: Add message to chat UI
  });
}

function handleGameUpdate(gameData) {
  // Update game state based on server data
  console.log('Game update received:', gameData);
  
  // TODO: Update game world, player data, resources, etc.
}

export function sendAction(action) {
  if (!socket || !socket.connected) {
    console.error('Socket not connected');
    return;
  }
  
  socket.emit('player:action', action);
}

export function sendChatMessage(text) {
  if (!socket || !socket.connected) {
    console.error('Socket not connected');
    return;
  }
  
  socket.emit('chat:message', { text });
}

export function disconnect() {
  if (socket) {
    socket.disconnect();
  }
} 