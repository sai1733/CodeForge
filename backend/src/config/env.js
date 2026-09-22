const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codeforge',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PRIMARY_ADMIN_EMAIL: process.env.PRIMARY_ADMIN_EMAIL,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

// Simple validation
if (!process.env.JWT_SECRET && env.NODE_ENV === 'production') {
  console.warn('WARNING: JWT_SECRET is not set in production!');
}

module.exports = env;
