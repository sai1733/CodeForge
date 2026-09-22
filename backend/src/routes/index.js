const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const taskRoutes = require('./taskRoutes');
const reportRoutes = require('./reportRoutes');
const githubRoutes = require('./githubRoutes');
const projectRoutes = require('./projectRoutes');
const fileRoutes = require('./fileRoutes');
const inviteRoutes = require('./inviteRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = express.Router();

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/reports', reportRoutes);
router.use('/github', githubRoutes);
router.use('/projects', projectRoutes);
router.use('/files', fileRoutes);
router.use('/invites', inviteRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);

// General api route check
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the CodeForge API'
  });
});

module.exports = router;
