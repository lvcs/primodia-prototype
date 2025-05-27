import { verifyToken } from '../utils/jwt';

/**
 * Authentication middleware to protect routes
 * Extracts JWT token from Authorization header and verifies it
 * If valid, attaches user data to the request object
 */
function authenticate(req, res, next) {
  // Get the authorization header
  const authHeader = req.headers.authorization;
  
  // Check if auth header exists and has the Bearer format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is missing or invalid'
    });
  }
  
  // Extract the token from the header
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify the token
    const user = verifyToken(token);
    
    // Attach the user data to the request
    req.user = user;
    
    // Continue to the protected route
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is invalid or expired'
    });
  }
}

export default {
  authenticate
}; 