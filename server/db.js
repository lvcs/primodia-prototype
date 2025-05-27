import { Pool } from 'pg';

// Create a PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'primodia',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Test and establish the connection
async function connect() {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');
    client.release();
    await initializeTables();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Initialize database tables if they don't exist
async function initializeTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_by INTEGER REFERENCES users(id),
        max_players INTEGER NOT NULL DEFAULT 8,
        world_seed VARCHAR(100) NOT NULL,
        world_config JSONB NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'lobby',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS game_players (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        player_data JSONB NOT NULL,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS game_turns (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
        turn_number INTEGER NOT NULL,
        turn_data JSONB NOT NULL,
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database tables initialized');
    return true;
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  }
}

// Query helper function
async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export default {
  connect,
  query,
  pool
}; 