const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Retrieve notifications for current user
 * Route: GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    return successResponse(res, notifications, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read for current user
 * Route: PATCH /api/notifications/read-all
 */
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );
    return successResponse(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * Clear a notification by ID
 * Route: DELETE /api/notifications/:id
 */
const clearNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user._id,
    });
    if (!notification) {
      return errorResponse(res, 'Notification not found or access denied', 404);
    }
    return successResponse(res, null, 'Notification cleared successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAllRead,
  clearNotification,
};
