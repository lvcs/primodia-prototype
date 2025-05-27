import { hash, compare } from 'bcrypt';
import { query } from '../db';
import { generateToken } from '../utils/jwt';

/**
 * User registration handler
 */
async function register(req, res) {
  const { username, email, password } = req.body;
  
  // Validate input
  if (!username || !email || !password) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Username, email and password are required'
    });
  }
  
  try {
    // Check if username or email already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Username or email already in use'
      });
    }
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await hash(password, saltRounds);
    
    // Insert the new user
    const result = await query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );
    
    const newUser = result.rows[0];
    
    // Return the new user (excluding password)
    return res.status(201).json({
      message: 'User registered successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register user'
    });
  }
}

/**
 * User login handler
 */
async function login(req, res) {
  const { username, password } = req.body;
  
  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Username and password are required'
    });
  }
  
  try {
    // Find the user by username
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    const user = result.rows[0];
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password'
      });
    }
    
    // Compare the provided password with the stored hash
    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password'
      });
    }
    
    // Generate a JWT token
    const token = generateToken(user);
    
    // Return the token and user data (excluding password)
    const { password: _, ...userData } = user;
    
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to login'
    });
  }
}

export default {
  register,
  login
}; 