const express = require('express');
const { createTask, getTasks, updateTaskStatus } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { validateBody } = require('../middleware/validateMiddleware');

const router = express.Router();

// Get tasks list (all roles, role-specific content filtered in controller)
router.get('/', protect, getTasks);

// Create task (manager or superadmin only)
router.post(
  '/',
  protect,
  restrictTo('manager', 'superadmin'),
  validateBody(['title', 'description', 'assignedTo', 'dueDate', 'projectId']),
  createTask
);

// Update task status (intern or manager)
router.patch(
  '/:id/status',
  protect,
  validateBody(['status']),
  updateTaskStatus
);

module.exports = router;
