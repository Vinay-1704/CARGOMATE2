const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cargomate_super_secret_key_2024_transport_auth_system';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return null;
  }
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      message: 'Please provide an authentication token'
    });
  }

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
      message: 'Please login again'
    });
  }

  // Attach user info to request
  req.user = decoded;
  next();
}

// Role-based authorization middleware
function authorize(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    // roles can be a string or array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
}

// Optional: Refresh token middleware (for future implementation)
function refreshToken(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: 'Refresh token required'
    });
  }

  const decoded = verifyToken(refreshToken);

  if (!decoded) {
    return res.status(403).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }

  // Generate new access token
  const newToken = generateToken({
    id: decoded.id,
    email: decoded.email,
    role: decoded.role
  });

  res.json({
    success: true,
    token: newToken
  });
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  authorize,
  refreshToken
};
