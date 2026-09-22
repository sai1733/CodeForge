const Project = require('../models/Project');
const User = require('../models/User');
const getManagerInterns = require('../utils/getManagerInterns');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const parseRepoUrl = (url) => {
  if (!url) return null;
  const match = url.match(/github\.com[\/:][^\/]+\/[^\/]+/i);
  if (match) {
    const parts = match[0].replace('github.com/', '').replace('github.com:', '').split('/');
    const owner = parts[0].trim();
    const repo = parts[1].replace(/\.git$/, '').trim();
    if (/^[a-zA-Z0-9-]{1,39}$/.test(owner) && /^[a-zA-Z0-9._-]{1,100}$/.test(repo)) {
      return { owner, repo };
    }
  }
  return null;
};

/**
 * Create a new project workspace (Super Admin only)
 * Route: POST /api/projects
 */
const createProject = async (req, res, next) => {
  try {
    const { name, description, githubRepoName, githubRepoUrl } = req.body;
    const managerId = req.body.managerId || req.body.manager;
    const internIds = req.body.internIds || req.body.interns;

    if (!githubRepoUrl || !githubRepoUrl.trim()) {
      return errorResponse(res, 'GitHub repository URL is compulsory for initializing project workspaces.', 400);
    }

    const parsedRepo = parseRepoUrl(githubRepoUrl);
    if (!parsedRepo) {
      return errorResponse(res, 'Invalid GitHub repository URL. Please enter a valid GitHub repository link (e.g. https://github.com/owner/repository).', 400);
    }

    const formattedRepoName = `${parsedRepo.owner}/${parsedRepo.repo}`;
    const formattedRepoUrl = `https://github.com/${parsedRepo.owner}/${parsedRepo.repo}`;

    // Check if project name already exists
    const existingProject = await Project.findOne({ name });
    if (existingProject) {
      return errorResponse(res, 'A project workspace with this name already exists', 400);
    }

    // Verify manager exists and holds manager role
    const managerUser = await User.findById(managerId);
    if (!managerUser || managerUser.role !== 'manager') {
      return errorResponse(res, 'Invalid manager assigned. Specified user must hold the manager role.', 400);
    }

    // Verify all specified interns exist and hold intern role
    if (internIds && internIds.length > 0) {
      const verifiedInterns = await User.find({ _id: { $in: internIds }, role: 'intern' });
      if (verifiedInterns.length !== internIds.length) {
        return errorResponse(res, 'One or more assigned interns are invalid or do not exist', 400);
      }
    }

    // Create project
    const project = await Project.create({
      name,
      description,
      managerId,
      internIds: internIds || [],
      status: 'active',
      githubRepoName: formattedRepoName,
      githubRepoUrl: formattedRepoUrl,
    });

    // Trigger project assignment notifications
    try {
      const Notification = require('../models/Notification');
      const { emitToUser } = require('../config/socket');

      // 1. Notify Manager
      const managerNotification = await Notification.create({
        recipient: managerId,
        type: 'project',
        title: 'New Project Assigned',
        message: `You have been assigned as the manager for a new project: ${project.name}.`,
        data: { projectId: project._id.toString() },
      });

      emitToUser(managerId, 'project:assigned', {
        id: managerNotification._id,
        type: 'project',
        title: managerNotification.title,
        message: managerNotification.message,
        timestamp: managerNotification.createdAt,
        read: managerNotification.read,
        projectId: project._id,
      });

      // 2. Notify Interns
      if (internIds && internIds.length > 0) {
        for (const internId of internIds) {
          const internNotification = await Notification.create({
            recipient: internId,
            type: 'project',
            title: 'New Project Assigned',
            message: `You have been added to the project workspace: ${project.name}.`,
            data: { projectId: project._id.toString() },
          });

          emitToUser(internId, 'project:assigned', {
            id: internNotification._id,
            type: 'project',
            title: internNotification.title,
            message: internNotification.message,
            timestamp: internNotification.createdAt,
            read: internNotification.read,
            projectId: project._id,
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to trigger project creation notifications:', notifErr);
    }

    const populatedProject = await Project.findById(project._id)
      .populate('managerId', 'name email')
      .populate('internIds', 'name email');

    return successResponse(res, populatedProject, 'Project workspace created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get projects list based on user role
 * Route: GET /api/projects
 */
const getProjects = async (req, res, next) => {
  try {
    const role = req.user.role;
    const { includeArchived, status, search, page, limit } = req.query;
    let query = {};

    if (role === 'manager') {
      query.managerId = req.user._id;
    } else if (role === 'intern') {
      query.internIds = req.user._id;
    }

    // Filter active projects by default
    if (status) {
      query.status = status;
    } else if (includeArchived !== 'true') {
      query.status = 'active';
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Paginated response if page and limit are specified
    if (page && limit) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      const totalProjects = await Project.countDocuments(query);
      const totalPages = Math.ceil(totalProjects / limitNum);

      const projects = await Project.find(query)
        .populate('managerId', 'name email')
        .populate('internIds', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      return successResponse(res, {
        projects,
        pagination: {
          totalProjects,
          totalPages,
          currentPage: pageNum,
          limit: limitNum
        }
      }, 'Projects retrieved successfully');
    } else {
      // Default non-paginated array response for compatibility
      const projects = await Project.find(query)
        .populate('managerId', 'name email')
        .populate('internIds', 'name email')
        .sort({ createdAt: -1 });

      return successResponse(res, projects, 'Projects retrieved successfully');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update Project allocations (managerId and internIds) (Super Admin only)
 * Route: PATCH /api/projects/:id/assign
 */
const assignProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const managerId = req.body.managerId || req.body.manager;
    const internIds = req.body.internIds || req.body.interns;
    const { githubRepoName, githubRepoUrl } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 'Project workspace not found', 404);
    }

    const oldManagerId = project.managerId ? project.managerId.toString() : null;
    const oldInternIds = project.internIds ? project.internIds.map(id => id.toString()) : [];

    if (managerId) {
      const managerUser = await User.findById(managerId);
      if (!managerUser || managerUser.role !== 'manager') {
        return errorResponse(res, 'Invalid manager assigned. Specified user must hold the manager role.', 400);
      }
      project.managerId = managerId;
    }

    if (internIds) {
      const verifiedInterns = await User.find({ _id: { $in: internIds }, role: 'intern' });
      if (verifiedInterns.length !== internIds.length) {
        return errorResponse(res, 'One or more assigned interns are invalid or do not exist', 400);
      }
      project.internIds = internIds;
    }

    if (githubRepoUrl !== undefined) {
      if (!githubRepoUrl || !githubRepoUrl.trim()) {
        return errorResponse(res, 'GitHub repository URL cannot be empty.', 400);
      }
      const parsed = parseRepoUrl(githubRepoUrl);
      if (!parsed) {
        return errorResponse(res, 'Invalid GitHub repository URL. Please enter a valid GitHub repository link (e.g. https://github.com/owner/repository).', 400);
      }
      project.githubRepoName = `${parsed.owner}/${parsed.repo}`;
      project.githubRepoUrl = `https://github.com/${parsed.owner}/${parsed.repo}`;
    }

    await project.save();

    // Trigger reassignment notifications
    try {
      const Notification = require('../models/Notification');
      const { emitToUser } = require('../config/socket');

      // 1. Notify new Manager if changed
      if (managerId && managerId.toString() !== oldManagerId) {
        const managerNotification = await Notification.create({
          recipient: managerId,
          type: 'project',
          title: 'New Project Assigned',
          message: `You have been assigned as the manager for the project: ${project.name}.`,
          data: { projectId: project._id.toString() },
        });

        emitToUser(managerId, 'project:assigned', {
          id: managerNotification._id,
          type: 'project',
          title: managerNotification.title,
          message: managerNotification.message,
          timestamp: managerNotification.createdAt,
          read: managerNotification.read,
          projectId: project._id,
        });
      }

      // 2. Notify newly added Interns
      if (internIds) {
        const newlyAddedInterns = internIds.filter(id => !oldInternIds.includes(id.toString()));
        for (const internId of newlyAddedInterns) {
          const internNotification = await Notification.create({
            recipient: internId,
            type: 'project',
            title: 'New Project Assigned',
            message: `You have been added to the project workspace: ${project.name}.`,
            data: { projectId: project._id.toString() },
          });

          emitToUser(internId, 'project:assigned', {
            id: internNotification._id,
            type: 'project',
            title: internNotification.title,
            message: internNotification.message,
            timestamp: internNotification.createdAt,
            read: internNotification.read,
            projectId: project._id,
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to trigger project reassignment notifications:', notifErr);
    }

    const populatedProject = await Project.findById(project._id)
      .populate('managerId', 'name email')
      .populate('internIds', 'name email');

    return successResponse(res, populatedProject, 'Project allocations updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get manager's assigned interns
 * Route: GET /api/projects/my-interns
 */
const getMyInterns = async (req, res, next) => {
  try {
    if (req.user.role !== 'manager') {
      return errorResponse(res, 'Access denied. Managers only.', 403);
    }

    const internIds = await getManagerInterns(req.user._id);
    
    const interns = await User.find({ _id: { $in: internIds } })
      .select('name email role createdAt');

    return successResponse(res, interns, 'Assigned interns retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Archive a project workspace (Super Admin only)
 * Route: DELETE /api/projects/:id
 */
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 'Project workspace not found', 404);
    }

    project.status = 'archived';
    await project.save();

    return successResponse(res, null, 'Project workspace archived successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  assignProject,
  getMyInterns,
  deleteProject,
};
