const db = require('./db');

// Store active socket connections
const activeUsers = new Map();
const activeGames = new Map();

/**
 * Set up socket.io handlers
 * @param {Object} io - Socket.io server instance
 */
function setupSocketHandlers(io) {
  // Handle socket connections
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const username = socket.user.username;
    
    console.log(`User connected: ${username} (${userId})`);
    
    // Store the user's socket
    activeUsers.set(userId, socket);
    
    // Handle player joining a game room
    socket.on('game:join', async (gameId) => {
      try {
        // Get the game data
        const gameResult = await db.query('SELECT * FROM games WHERE id = $1', [gameId]);
        
        if (gameResult.rows.length === 0) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        const game = gameResult.rows[0];
        
        // Check if player is actually in this game
        const playerResult = await db.query(
          'SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2',
          [gameId, userId]
        );
        
        if (playerResult.rows.length === 0) {
          socket.emit('error', { message: 'You are not a player in this game' });
          return;
        }
        
        // Join the game room
        socket.join(`game:${gameId}`);
        
        // Add to active games tracking
        if (!activeGames.has(gameId)) {
          activeGames.set(gameId, new Set());
        }
        activeGames.get(gameId).add(userId);
        
        // Notify other players
        socket.to(`game:${gameId}`).emit('player:joined', {
          userId,
          username
        });
        
        // Send the current game state
        const playersResult = await db.query(
          `SELECT gp.*, u.username 
           FROM game_players gp
           JOIN users u ON gp.user_id = u.id
           WHERE gp.game_id = $1`,
          [gameId]
        );
        
        socket.emit('game:state', {
          game,
          players: playersResult.rows,
          activePlayerIds: Array.from(activeGames.get(gameId))
        });
        
        console.log(`Player ${username} joined game ${gameId}`);
      } catch (error) {
        console.error('Error joining game room:', error);
        socket.emit('error', { message: 'Server error joining game' });
      }
    });
    
    // Handle player leaving a game
    socket.on('game:leave', (gameId) => {
      socket.leave(`game:${gameId}`);
      
      // Remove from active games tracking
      if (activeGames.has(gameId)) {
        activeGames.get(gameId).delete(userId);
        
        // Notify other players
        io.to(`game:${gameId}`).emit('player:left', {
          userId,
          username
        });
        
        console.log(`Player ${username} left game ${gameId}`);
      }
    });
    
    // Handle player actions
    socket.on('player:action', async (data) => {
      const { gameId, action } = data;
      
      try {
        // Verify the game exists and is in progress
        const gameResult = await db.query(
          'SELECT * FROM games WHERE id = $1 AND status = $2',
          [gameId, 'in_progress']
        );
        
        if (gameResult.rows.length === 0) {
          socket.emit('error', { message: 'Game not found or not in progress' });
          return;
        }
        
        // Verify the player is in this game
        const playerResult = await db.query(
          'SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2',
          [gameId, userId]
        );
        
        if (playerResult.rows.length === 0) {
          socket.emit('error', { message: 'You are not a player in this game' });
          return;
        }
        
        // Get the current turn
        const turnResult = await db.query(
          `SELECT * FROM game_turns 
           WHERE game_id = $1
           ORDER BY turn_number DESC
           LIMIT 1`,
          [gameId]
        );
        
        if (turnResult.rows.length === 0) {
          socket.emit('error', { message: 'No active turn found' });
          return;
        }
        
        const currentTurn = turnResult.rows[0];
        
        // Update the turn data with this player's action
        const turnData = currentTurn.turn_data;
        
        if (!turnData.actions) {
          turnData.actions = {};
        }
        
        turnData.actions[userId] = action;
        
        // Save the updated turn data
        await db.query(
          'UPDATE game_turns SET turn_data = $1 WHERE id = $2',
          [turnData, currentTurn.id]
        );
        
        // Broadcast the action to other players
        socket.to(`game:${gameId}`).emit('player:action', {
          userId,
          username,
          action
        });
        
        console.log(`Player ${username} performed action in game ${gameId}:`, action);
      } catch (error) {
        console.error('Error processing player action:', error);
        socket.emit('error', { message: 'Server error processing action' });
      }
    });
    
    // Handle chat messages
    socket.on('chat:message', (data) => {
      const { gameId, text } = data;
      
      if (!gameId || !text) {
        return;
      }
      
      // Broadcast to all players in the game
      io.to(`game:${gameId}`).emit('chat:message', {
        userId,
        username,
        text,
        timestamp: new Date()
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      // Remove from active users
      activeUsers.delete(userId);
      
      // Remove from all active games
      for (const [gameId, players] of activeGames.entries()) {
        if (players.has(userId)) {
          players.delete(userId);
          
          // Notify other players
          io.to(`game:${gameId}`).emit('player:left', {
            userId,
            username
          });
        }
      }
      
      console.log(`User disconnected: ${username} (${userId})`);
    });
  });
}

module.exports = {
  setupSocketHandlers
}; 