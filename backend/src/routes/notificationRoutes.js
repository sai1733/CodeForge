const express = require('express');
const { getNotifications, markAllRead, clearNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.delete('/:id', clearNotification);

module.exports = router;
