const { errorResponse } = require('../utils/apiResponse');

/**
 * Restrict route access to specific roles
 * @param {...string} roles - List of allowed roles (intern, manager, superadmin)
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Forbidden: You do not have permission to perform this action. Required role: ${roles.join(' or ')}`,
        403
      );
    }

    next();
  };
};

module.exports = {
  restrictTo,
};
