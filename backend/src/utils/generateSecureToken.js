const crypto = require('crypto');

/**
 * Generates a cryptographically secure random token (hex string)
 * @returns {string} 64 character hex string
 */
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = generateSecureToken;
