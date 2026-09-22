const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SALT = 'codeforge_crypto_salt_987';

// Derive a 32-byte key from the environment variable (or a fallback)
const getSecretKey = () => {
  const secret = process.env.GITHUB_TOKEN_ENCRYPTION_KEY || 'default_super_secret_encryption_key_codeforge';
  return crypto.scryptSync(secret, SALT, 32);
};

/**
 * Encrypt a text
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text in format iv:encryptedData (hex)
 */
const encrypt = (text) => {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt a text
 * @param {string} encryptedText - Encrypted text in format iv:encryptedData (hex)
 * @returns {string} Decrypted plain text
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return '';
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedData = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = {
  encrypt,
  decrypt,
};
