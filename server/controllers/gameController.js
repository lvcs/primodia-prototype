import { query } from '../db';

/**
 * Create a new game
 */
async function createGame(req, res) {
  const { name, maxPlayers, worldConfig } = req.body;
  const userId = req.user.id;
  
  // Validate input
  if (!name || !worldConfig) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Game name and world configuration are required'
    });
  }
  
  try {
    // Generate a random seed for the world
    const worldSeed = Math.random().toString(36).substring(2, 15);
    
    // Insert the new game
    const result = await query(
      `INSERT INTO games 
       (name, created_by, max_players, world_seed, world_config, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, userId, maxPlayers || 8, worldSeed, worldConfig, 'lobby']
    );
    
    const newGame = result.rows[0];
    
    // Add the creator as the first player
    const playerData = {
      civilization: 'Pioneers', // Default civilization
      color: '#ff0000',         // Default color
      ready: false,
      resources: {
        food: 100,
        production: 100,
        science: 0,
        culture: 0,
        gold: 100
      }
    };
    
    await query(
      `INSERT INTO game_players
       (game_id, user_id, player_data)
       VALUES ($1, $2, $3)`,
      [newGame.id, userId, playerData]
    );
    
    return res.status(201).json({
      message: 'Game created successfully',
      game: newGame
    });
  } catch (error) {
    console.error('Create game error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create game'
    });
  }
}

/**
 * Get all available games (in lobby status)
 */
async function getGames(req, res) {
  try {
    const result = await query(
      `SELECT g.*, 
       COUNT(gp.id) as player_count,
       (SELECT username FROM users WHERE id = g.created_by) as creator_name
       FROM games g
       LEFT JOIN game_players gp ON g.id = gp.game_id
       WHERE g.status = 'lobby'
       GROUP BY g.id
       ORDER BY g.created_at DESC`
    );
    
    return res.status(200).json({
      games: result.rows
    });
  } catch (error) {
    console.error('Get games error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve games'
    });
  }
}

/**
 * Get a specific game by ID
 */
async function getGame(req, res) {
  const gameId = req.params.id;
  
  try {
    // Get game data
    const gameResult = await query(
      'SELECT * FROM games WHERE id = $1',
      [gameId]
    );
    
    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Game not found'
      });
    }
    
    const game = gameResult.rows[0];
    
    // Get players in the game
    const playersResult = await query(
      `SELECT gp.*, u.username 
       FROM game_players gp
       JOIN users u ON gp.user_id = u.id
       WHERE gp.game_id = $1`,
      [gameId]
    );
    
    // Get current turn data if game is in progress
    let currentTurn = null;
    if (game.status === 'in_progress') {
      const turnResult = await query(
        `SELECT * FROM game_turns 
         WHERE game_id = $1
         ORDER BY turn_number DESC
         LIMIT 1`,
        [gameId]
      );
      
      if (turnResult.rows.length > 0) {
        currentTurn = turnResult.rows[0];
      }
    }
    
    return res.status(200).json({
      game,
      players: playersResult.rows,
      currentTurn
    });
  } catch (error) {
    console.error('Get game error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve game'
    });
  }
}

/**
 * Join an existing game
 */
async function joinGame(req, res) {
  const gameId = req.params.id;
  const userId = req.user.id;
  
  try {
    // Check if game exists and is in lobby status
    const gameResult = await query(
      'SELECT * FROM games WHERE id = $1',
      [gameId]
    );
    
    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Game not found'
      });
    }
    
    const game = gameResult.rows[0];
    
    if (game.status !== 'lobby') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot join a game that has already started'
      });
    }
    
    // Check if the player is already in the game
    const existingPlayerResult = await query(
      'SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, userId]
    );
    
    if (existingPlayerResult.rows.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You are already in this game'
      });
    }
    
    // Check if the game is full
    const playerCountResult = await query(
      'SELECT COUNT(*) as count FROM game_players WHERE game_id = $1',
      [gameId]
    );
    
    if (parseInt(playerCountResult.rows[0].count) >= game.max_players) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Game is full'
      });
    }
    
    // Add the player to the game
    const playerData = {
      civilization: 'Nomads', // Default civilization
      color: '#00ff00',       // Default color
      ready: false,
      resources: {
        food: 100,
        production: 100,
        science: 0,
        culture: 0,
        gold: 100
      }
    };
    
    await query(
      `INSERT INTO game_players
       (game_id, user_id, player_data)
       VALUES ($1, $2, $3)`,
      [gameId, userId, playerData]
    );
    
    return res.status(200).json({
      message: 'Joined game successfully',
      gameId
    });
  } catch (error) {
    console.error('Join game error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to join game'
    });
  }
}

/**
 * Start a game (change status from lobby to in_progress)
 */
async function startGame(req, res) {
  const gameId = req.params.id;
  const userId = req.user.id;
  
  try {
    // Check if game exists and is in lobby status
    const gameResult = await query(
      'SELECT * FROM games WHERE id = $1',
      [gameId]
    );
    
    if (gameResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Game not found'
      });
    }
    
    const game = gameResult.rows[0];
    
    // Check if the user is the creator of the game
    if (game.created_by !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the game creator can start the game'
      });
    }
    
    if (game.status !== 'lobby') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Game has already started'
      });
    }
    
    // Check if there are at least 2 players
    const playerCountResult = await query(
      'SELECT COUNT(*) as count FROM game_players WHERE game_id = $1',
      [gameId]
    );
    
    if (parseInt(playerCountResult.rows[0].count) < 2) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Need at least 2 players to start the game'
      });
    }
    
    // Start the game
    await query(
      'UPDATE games SET status = $1 WHERE id = $2',
      ['in_progress', gameId]
    );
    
    // Create the first turn
    const turnData = {
      actions: {}
    };
    
    await query(
      `INSERT INTO game_turns
       (game_id, turn_number, turn_data)
       VALUES ($1, $2, $3)`,
      [gameId, 1, turnData]
    );
    
    return res.status(200).json({
      message: 'Game started successfully',
      gameId
    });
  } catch (error) {
    console.error('Start game error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to start game'
    });
  }
}

export default {
  createGame,
  getGames,
  getGame,
  joinGame,
  startGame
}; 