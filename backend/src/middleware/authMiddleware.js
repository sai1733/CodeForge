const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Protect routes by verifying JWT tokens
 */
const protect = async (req, res, next) => {
  let token;

  // Check Authorization header for Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, env.JWT_SECRET);

      // Find user and attach to request (excluding password)
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return errorResponse(res, 'The user belonging to this token no longer exists.', 401);
      }

      if (!user.isActive) {
        return errorResponse(res, 'Your account has been deactivated. Please contact an administrator.', 401);
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return errorResponse(res, 'Not authorized, token failed', 401);
    }
  }

  if (!token) {
    return errorResponse(res, 'Not authorized, no token provided', 401);
  }
};

module.exports = {
  protect,
};
