const express = require('express');
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');
const { validateBody } = require('../middleware/validateMiddleware');

const router = express.Router();

// Register Route (Disabled: Invite-only)
router.post('/register', (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Public registration is disabled. Accounts can only be created via invitations sent by managers or admins.'
  });
});

// Login Route
router.post('/login', validateBody(['email', 'password']), login);

// Forgot Password Route
router.post('/forgot-password', validateBody(['email']), forgotPassword);

// Reset Password Route
router.post('/reset-password', validateBody(['token', 'password']), resetPassword);

module.exports = router;
