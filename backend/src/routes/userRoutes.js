const express = require('express');
const { getUsersByRole, createUserByAdmin, deleteUserByAdmin, reactivateUserByAdmin } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { validateBody } = require('../middleware/validateMiddleware');

const router = express.Router();

// Get users list (All authenticated users, e.g. for selection dropdowns)
router.get('/', protect, getUsersByRole);

// Create user directly (Super Admin only)
router.post(
  '/',
  protect,
  restrictTo('superadmin'),
  validateBody(['name', 'email', 'password', 'role']),
  createUserByAdmin
);

// Delete user account (Super Admin only)
router.delete('/:id', protect, restrictTo('superadmin'), deleteUserByAdmin);

// Reactivate user account (Super Admin only)
router.patch('/:id/reactivate', protect, restrictTo('superadmin'), reactivateUserByAdmin);

module.exports = router;
