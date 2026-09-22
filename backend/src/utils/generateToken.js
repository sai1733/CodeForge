const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Generate a JWT token for a user
 * @param {string} userId - User identifier
 * @param {string} role - User role (intern, manager, superadmin)
 * @returns {string} Signed JWT
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    env.JWT_SECRET,
    { expiresIn: '30d' } // Token is valid for 30 days
  );
};

module.exports = generateToken;
