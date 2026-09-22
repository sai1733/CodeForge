const Task = require('../models/Task');
const User = require('../models/User');
const getManagerInterns = require('../utils/getManagerInterns');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Create a new task (Manager only)
 * Route: POST /api/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, dueDate, projectId } = req.body;

    // Verify assignedTo exists and is an intern
    const intern = await User.findById(assignedTo);
    if (!intern) {
      return errorResponse(res, 'Assigned user does not exist', 404);
    }
    if (intern.role !== 'intern') {
      return errorResponse(res, 'Tasks can only be assigned to users with the intern role', 400);
    }

    // Verify project exists and is supervised by manager
    const Project = require('../models/Project');
    const project = await Project.findOne({ _id: projectId, managerId: req.user._id });
    if (!project) {
      return errorResponse(res, 'Specified project workspace not found or not supervised by you.', 404);
    }

    // Verify intern is assigned to this project
    const isAssigned = project.internIds.some(id => id.toString() === assignedTo.toString());
    if (!isAssigned) {
      return errorResponse(res, 'The specified intern is not assigned to this project workspace.', 400);
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      dueDate,
      projectId,
    });

    // Save notification to database
    const Notification = require('../models/Notification');
    const notification = await Notification.create({
      recipient: assignedTo,
      type: 'task',
      title: 'New Task Assigned',
      message: `New task assigned: ${task.title}`,
      data: { taskId: task._id.toString() },
    });

    // Emit live Socket.IO notification to the assigned intern
    const { emitToUser } = require('../config/socket');
    emitToUser(assignedTo, 'task:assigned', {
      id: notification._id,
      type: 'task',
      title: notification.title,
      message: notification.message,
      timestamp: notification.createdAt,
      read: notification.read,
      taskId: task._id,
    });

    return successResponse(res, task, 'Task created and assigned successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve tasks based on user role
 * Route: GET /api/tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const role = req.user.role;
    const { projectId, projectStatus } = req.query;
    const statusFilter = projectStatus || 'active';

    let query = {};

    if (role === 'intern' || role === 'manager') {
      const Project = require('../models/Project');
      let projectQuery = {};
      if (statusFilter !== 'all') {
        projectQuery.status = statusFilter;
      }
      if (role === 'manager') {
        projectQuery.managerId = req.user._id;
      } else if (role === 'intern') {
        projectQuery.internIds = req.user._id;
      }
      const myProjects = await Project.find(projectQuery);
      const myProjectIds = myProjects.map(p => p._id);
      query.projectId = { $in: myProjectIds };
    }

    if (role === 'intern') {
      query.assignedTo = req.user._id;
    }

    if (projectId) {
      query.projectId = projectId;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });

    return successResponse(res, tasks, 'Tasks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update task status
 * Route: PATCH /api/tasks/:id/status
 */
const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, submissionDetails, feedback } = req.body;

    const allowedStatuses = ['assigned', 'in-progress', 'in-review', 'completed'];
    if (!allowedStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status update value', 400);
    }

    const task = await Task.findById(id);
    if (!task) {
      return errorResponse(res, 'Task not found', 404);
    }

    const previousStatus = task.status;
    const role = req.user.role;

    // Role-based auth check
    if (role === 'intern' && task.assignedTo.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'You are not authorized to update this task', 403);
    }
    
    if (role === 'manager') {
      const myInterns = await getManagerInterns(req.user._id);
      if (!myInterns.includes(task.assignedTo.toString())) {
        return errorResponse(res, 'You are not authorized to update tasks for interns outside your project workspaces', 403);
      }
    }

    // Role-based status lifecycle validations
    if (role === 'intern') {
      const currentStatus = task.status;
      
      // If task is completed, interns cannot modify it anymore
      if (currentStatus === 'completed') {
        return errorResponse(res, 'Completed tasks are locked and cannot be modified by interns', 400);
      }

      // If task is in review, interns cannot modify status
      if (currentStatus === 'in-review') {
        return errorResponse(res, 'Tasks currently in review are locked for interns', 400);
      }

      // Allowed transitions for interns:
      // 1. assigned -> in-progress
      // 2. in-progress -> in-review (requires submissionDetails)
      if (currentStatus === 'assigned' && status !== 'in-progress') {
        return errorResponse(res, 'Assigned tasks can only be moved to In Progress', 400);
      }

      if (currentStatus === 'in-progress') {
        if (status === 'assigned') {
          return errorResponse(res, 'Interns cannot regress task status back to Assigned', 400);
        }
        if (status === 'completed') {
          return errorResponse(res, 'Interns cannot mark tasks completed directly. Please submit for review.', 400);
        }
        if (status === 'in-review') {
          if (!submissionDetails || !submissionDetails.trim()) {
            return errorResponse(res, 'Please provide submission details explaining your implementation before requesting review.', 400);
          }
          if (submissionDetails.length > 1000) {
            return errorResponse(res, 'Submission details cannot exceed 1000 characters.', 400);
          }
          task.submissionDetails = submissionDetails;
        }
      }
    } else if (role === 'manager' || role === 'superadmin') {
      const currentStatus = task.status;
      
      // Prevent reopening completed tasks
      if (currentStatus === 'completed') {
        return errorResponse(res, 'Completed tasks are permanently locked and cannot be reopened.', 400);
      }

      // If manager moves from in-review back to in-progress (requests changes)
      if (currentStatus === 'in-review' && status === 'in-progress') {
        if (!feedback || !feedback.trim()) {
          return errorResponse(res, 'Please provide revision feedback explaining why changes are requested.', 400);
        }
        if (feedback.length > 1000) {
          return errorResponse(res, 'Feedback cannot exceed 1000 characters.', 400);
        }
        task.feedback = feedback;
      }
      
      // If manager approves to completed, clear feedback
      if (status === 'completed') {
        task.feedback = '';
      }
    }

    task.status = status;
    await task.save();

    // Trigger status transition notifications
    try {
      const Notification = require('../models/Notification');
      const { emitToUser } = require('../config/socket');

      if (role === 'intern' && status === 'in-review') {
        const Project = require('../models/Project');
        const project = await Project.findById(task.projectId);
        const managerId = project ? project.managerId : task.assignedBy;

        if (managerId) {
          const isLate = task.dueDate && new Date(task.dueDate) < new Date();
          const title = isLate ? 'Late Task Submission' : 'Task Submitted for Review';
          const message = isLate 
            ? `${req.user.name} has submitted task '${task.title}' for review (LATE - past due date).`
            : `${req.user.name} has submitted task '${task.title}' for review.`;

          const notification = await Notification.create({
            recipient: managerId,
            type: 'task',
            title,
            message,
            data: { taskId: task._id.toString(), isLate },
          });

          emitToUser(managerId, 'task:submitted', {
            id: notification._id,
            type: 'task',
            title: notification.title,
            message: notification.message,
            timestamp: notification.createdAt,
            read: notification.read,
            taskId: task._id,
            isLate,
          });
        }
      } else if ((role === 'manager' || role === 'superadmin') && status === 'completed') {
        const notification = await Notification.create({
          recipient: task.assignedTo,
          type: 'task',
          title: 'Task Completed',
          message: `Your task '${task.title}' has been marked as Completed by ${req.user.name}.`,
          data: { taskId: task._id.toString() },
        });

        emitToUser(task.assignedTo, 'task:completed', {
          id: notification._id,
          type: 'task',
          title: notification.title,
          message: notification.message,
          timestamp: notification.createdAt,
          read: notification.read,
          taskId: task._id,
        });
      } else if ((role === 'manager' || role === 'superadmin') && previousStatus === 'in-review' && status === 'in-progress') {
        const notification = await Notification.create({
          recipient: task.assignedTo,
          type: 'task',
          title: 'Changes Requested',
          message: `Changes requested on task '${task.title}' by ${req.user.name}.`,
          data: { taskId: task._id.toString() },
        });

        emitToUser(task.assignedTo, 'task:changes_requested', {
          id: notification._id,
          type: 'task',
          title: notification.title,
          message: notification.message,
          timestamp: notification.createdAt,
          read: notification.read,
          taskId: task._id,
        });
      }
    } catch (notifErr) {
      console.error('Failed to trigger status change notification:', notifErr);
    }

    const updatedTask = await Task.findById(id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('projectId', 'name');

    return successResponse(res, updatedTask, 'Task status updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTaskStatus,
};
