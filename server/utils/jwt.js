const jwt = require('jsonwebtoken');

// Secret key used for JWT signing (from environment variables or fallback)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
// Token expiration time (default: 24 hours)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate a JWT token for a user
 * @param {Object} user - User data to include in the token
 * @returns {String} JWT token
 */
function generateToken(user) {
  // Create a payload with user data (excluding password)
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email
  };
  
  // Generate and return the token
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

module.exports = {
  generateToken,
  verifyToken
}; 