const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware factory to validate required body fields
 * @param {string[]} fields - Array of field names that must be present in req.body
 */
const validateBody = (fields) => {
  return (req, res, next) => {
    const missing = [];
    
    fields.forEach((field) => {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      return errorResponse(
        res,
        `Validation Error: Missing required fields`,
        400,
        missing.map((field) => `${field} is required`)
      );
    }

    // Basic email validation if email is present
    if (req.body.email) {
      if (typeof req.body.email !== 'string') {
        return errorResponse(res, 'Please provide a valid email address', 400);
      }
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(req.body.email)) {
        return errorResponse(res, 'Please provide a valid email address', 400);
      }
    }

    // Basic password length validation if password is present in register
    if (req.body.password) {
      if (typeof req.body.password !== 'string') {
        return errorResponse(res, 'Password must be a string', 400);
      }
      if (req.body.password.length < 6) {
        return errorResponse(res, 'Password must be at least 6 characters long', 400);
      }
    }

    next();
  };
};

module.exports = {
  validateBody,
};
