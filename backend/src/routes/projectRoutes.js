const express = require('express');
const { createProject, getProjects, assignProject, getMyInterns, deleteProject } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { validateBody } = require('../middleware/validateMiddleware');

const router = express.Router();

// Get projects list
router.get('/', protect, getProjects);

// Get manager's assigned interns (put before parameterized routes)
router.get('/my-interns', protect, restrictTo('manager'), getMyInterns);

// Create project (Super Admin only)
router.post(
  '/',
  protect,
  restrictTo('superadmin'),
  validateBody(['name', 'description']),
  createProject
);

// Assign manager/interns to project (Super Admin only)
router.patch(
  '/:id/assign',
  protect,
  restrictTo('superadmin'),
  assignProject
);

// Archive project (Super Admin only)
router.delete(
  '/:id',
  protect,
  restrictTo('superadmin'),
  deleteProject
);

module.exports = router;
