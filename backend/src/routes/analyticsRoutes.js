const express = require('express');
const {
  getInternAnalytics,
  getManagerCohortAnalytics,
  getSystemAnalytics,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/intern', protect, getInternAnalytics);
router.get('/manager', protect, restrictTo('manager', 'superadmin'), getManagerCohortAnalytics);
router.get('/system', protect, restrictTo('superadmin'), getSystemAnalytics);

module.exports = router;
