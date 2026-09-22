const { errorResponse } = require('../utils/apiResponse');
const env = require('../config/env');

/**
 * Centralized Error Handler Middleware
 */
const errorMiddleware = (err, req, res, next) => {
  console.error('Error Details:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((el) => el.message);
  }

  // Handle Mongoose duplicate key error (e.g. duplicate email)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered: ${field}. Please use another value.`;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again.';
  }

  // Include stack trace in development
  const responseData = env.NODE_ENV === 'development' ? err.stack : null;

  return errorResponse(res, message, statusCode, errors || responseData);
};

module.exports = errorMiddleware;
