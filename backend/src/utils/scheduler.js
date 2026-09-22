const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { emitToUser } = require('../config/socket');

/**
 * Check for tasks that are due within the next 24 hours
 * and create warning notifications for the assigned interns if not already created.
 */
const checkDueTasks = async () => {
  try {
    const now = new Date();
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + 1); // 24 hours from now

    // Find active tasks (assigned or in-progress) with due dates approaching
    const tasks = await Task.find({
      status: { $in: ['assigned', 'in-progress'] },
      dueDate: { $lte: targetDate, $gte: now },
    });

    for (const task of tasks) {
      // Check if a due soon warning already exists for this task
      const existing = await Notification.findOne({
        recipient: task.assignedTo,
        type: 'task',
        title: 'Task Due Soon',
        'data.taskId': task._id.toString(),
      });

      if (!existing) {
        const notification = await Notification.create({
          recipient: task.assignedTo,
          type: 'task',
          title: 'Task Due Soon',
          message: `Reminder: Task "${task.title}" is due soon.`,
          data: { taskId: task._id.toString() },
        });

        emitToUser(task.assignedTo, 'task:due_soon', {
          id: notification._id,
          type: 'task',
          title: notification.title,
          message: notification.message,
          timestamp: notification.createdAt,
          read: notification.read,
          taskId: task._id,
        });
      }
    }
  } catch (error) {
    console.error('Error running checkDueTasks scheduler:', error);
  }
};

/**
 * Check for active tasks that have passed their due date
 * and generate overdue warnings for both the assigned intern and the manager.
 */
const checkOverdueTasks = async () => {
  try {
    const now = new Date();

    // Find active tasks (assigned, in-progress, or in-review) with due dates in the past
    const tasks = await Task.find({
      status: { $in: ['assigned', 'in-progress', 'in-review'] },
      dueDate: { $lt: now },
    });

    for (const task of tasks) {
      // 1. Notify the assigned intern
      const existingInternNotif = await Notification.findOne({
        recipient: task.assignedTo,
        type: 'task',
        title: 'Task Overdue',
        'data.taskId': task._id.toString(),
      });

      if (!existingInternNotif) {
        const notification = await Notification.create({
          recipient: task.assignedTo,
          type: 'task',
          title: 'Task Overdue',
          message: `The due date for task "${task.title}" has passed. Please complete and submit it as soon as possible.`,
          data: { taskId: task._id.toString(), isOverdue: true },
        });

        emitToUser(task.assignedTo, 'task:overdue', {
          id: notification._id,
          type: 'task',
          title: notification.title,
          message: notification.message,
          timestamp: notification.createdAt,
          read: notification.read,
          taskId: task._id,
        });
      }

      // 2. Notify the manager (creator/assigner)
      const Project = require('../models/Project');
      const project = await Project.findById(task.projectId);
      const managerId = project ? project.managerId : task.assignedBy;

      if (managerId) {
        const existingManagerNotif = await Notification.findOne({
          recipient: managerId,
          type: 'task',
          title: 'Task Overdue (Intern)',
          'data.taskId': task._id.toString(),
        });

        if (!existingManagerNotif) {
          const User = require('../models/User');
          const intern = await User.findById(task.assignedTo);
          const internName = intern ? intern.name : 'An intern';

          const notification = await Notification.create({
            recipient: managerId,
            type: 'task',
            title: 'Task Overdue (Intern)',
            message: `The task "${task.title}" assigned to ${internName} is overdue.`,
            data: { taskId: task._id.toString(), isOverdue: true },
          });

          emitToUser(managerId, 'task:overdue', {
            id: notification._id,
            type: 'task',
            title: notification.title,
            message: notification.message,
            timestamp: notification.createdAt,
            read: notification.read,
            taskId: task._id,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error running checkOverdueTasks scheduler:', error);
  }
};

/**
 * Start periodic tasks due warnings check
 */
const startNotificationScheduler = () => {
  // Run once shortly after startup
  setTimeout(() => {
    checkDueTasks();
    checkOverdueTasks();
  }, 5000);

  // Run every 1 hour
  setInterval(() => {
    checkDueTasks();
    checkOverdueTasks();
  }, 60 * 60 * 1000);
  console.log('[SCHEDULER] Notification scheduler started (running every 1 hour).');
};

module.exports = { startNotificationScheduler };
