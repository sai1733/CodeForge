const express = require('express');
const { createInvite, verifyInvite, completeInvite } = require('../controllers/inviteController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// Create Invite (Superadmin only)
router.post('/', protect, restrictTo('superadmin'), createInvite);

// Verify Invite (Public)
router.get('/verify/:token', verifyInvite);

// Complete Invite (Public)
router.post('/complete', completeInvite);

module.exports = router;
