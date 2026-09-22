/**
 * Standard API Response Wrappers
 */

/**
 * Send a success response
 * @param {object} res - Express response object
 * @param {any} data - Data to send to the client
 * @param {string} message - Description message
 * @param {number} statusCode - HTTP status code (default 200)
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response
 * @param {object} res - Express response object
 * @param {string} message - Error description
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {any} errors - Optional detailed validation errors
 */
const errorResponse = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    message,
  };
  if (errors) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
};

module.exports = {
  successResponse,
  errorResponse,
};
