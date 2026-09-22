const User = require('../models/User');
const Project = require('../models/Project');
const { hashPassword } = require('../utils/hashPassword');
const env = require('../config/env');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Get users optionally filtered by role
 * Route: GET /api/users
 */
const getUsersByRole = async (req, res, next) => {
  try {
    const { role, includeInactive, page, limit, search } = req.query;
    
    const query = {};
    if (role) {
      query.role = role;
    }
    
    // Filter active users by default
    if (includeInactive !== 'true') {
      query.isActive = true;
    }

    // Search by name or email
    if (search && typeof search === 'string') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Check if pagination parameters are provided
    if (page || limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skip = (pageNum - 1) * limitNum;

      const totalUsers = await User.countDocuments(query);
      const totalPages = Math.ceil(totalUsers / limitNum);

      const users = await User.find(query)
        .select('name email role isActive createdAt')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 });

      return successResponse(res, {
        users,
        pagination: {
          totalUsers,
          totalPages,
          currentPage: pageNum,
          limit: limitNum
        }
      }, 'Users retrieved successfully');
    } else {
      // Non-paginated (fallback for dropdowns/other callers)
      const users = await User.find(query)
        .select('name email role isActive createdAt')
        .sort({ createdAt: -1 });
      
      return successResponse(res, users, 'Users retrieved successfully');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user account directly (Super Admin only)
 * Route: POST /api/users
 */
const createUserByAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'intern',
      isActive: true,
    });

    const userProfile = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    return successResponse(res, userProfile, 'User account created successfully by administrator', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate a user account (Super Admin only)
 * Route: DELETE /api/users/:id
 */
const deleteUserByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User account not found', 404);
    }

    // Protect primary admin from deactivation
    if (user.email === env.PRIMARY_ADMIN_EMAIL) {
      return errorResponse(res, 'The primary system administrator account cannot be deactivated.', 400);
    }

    // Only allow primary admin to deactivate other superadmins
    if (user.role === 'superadmin' && req.user.email !== env.PRIMARY_ADMIN_EMAIL) {
      return errorResponse(res, 'Only the primary system administrator can deactivate other administrator accounts.', 403);
    }

    // Don't let admin deactivate themselves
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 'Administrators cannot deactivate their own accounts', 400);
    }

    // If manager, check active project assignment
    if (user.role === 'manager') {
      const activeProject = await Project.findOne({ managerId: user._id, status: 'active' });
      if (activeProject) {
        return errorResponse(res, "Reassign this manager's active projects before deactivating their account.", 400);
      }
    }

    // Soft-deactivate user
    user.isActive = false;
    await user.save();

    // If intern, pull them from any projects
    if (user.role === 'intern') {
      await Project.updateMany(
        { internIds: user._id },
        { $pull: { internIds: user._id } }
      );
    }

    return successResponse(res, null, 'User account deactivated successfully by administrator');
  } catch (error) {
    next(error);
  }
};

/**
 * Reactivate a user account (Super Admin only)
 * Route: PATCH /api/users/:id/reactivate
 */
const reactivateUserByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User account not found', 404);
    }

    user.isActive = true;
    await user.save();

    return successResponse(res, null, 'User account reactivated successfully by administrator');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsersByRole,
  createUserByAdmin,
  deleteUserByAdmin,
  reactivateUserByAdmin,
};
