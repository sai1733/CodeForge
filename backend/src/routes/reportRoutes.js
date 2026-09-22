const express = require('express');
const { submitReport, getReports, markReviewed } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { validateBody } = require('../middleware/validateMiddleware');

const router = express.Router();

// Get reports list (All authenticated roles)
router.get('/', protect, getReports);

// Submit report (Intern only)
router.post(
  '/',
  protect,
  restrictTo('intern'),
  validateBody(['workDone', 'hoursWorked', 'tomorrowPlan', 'projectId']),
  submitReport
);

// Review report (Manager or Super Admin only)
router.patch(
  '/:id/review',
  protect,
  restrictTo('manager', 'superadmin'),
  markReviewed
);

module.exports = router;
