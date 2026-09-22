const File = require('../models/File');
const Project = require('../models/Project');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Create a new file in a project workspace
 * Route: POST /api/files
 */
const createFile = async (req, res, next) => {
  try {
    const { fileName, path, content, projectId } = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return errorResponse(res, 'Project workspace not found', 404);
    }

    // Check if path is unique in this project for this user
    const existingFile = await File.findOne({ projectId, userId: req.user._id, path });
    if (existingFile) {
      return errorResponse(res, 'A file already exists at this path in this project for your draft', 400);
    }

    const file = await File.create({
      fileName,
      path,
      content: content || '',
      projectId,
      userId: req.user._id,
    });

    return successResponse(res, file, 'File created successfully in workspace', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all files in a project workspace (metadata only, excluding content)
 * Route: GET /api/files
 */
const getFilesForProject = async (req, res, next) => {
  try {
    const { projectId, includeContent } = req.query;

    if (!projectId) {
      return errorResponse(res, 'Project ID query parameter is required', 400);
    }

    // Determine the userId. Managers/Admins can request a specific intern's files.
    let userId = req.user._id;
    if ((req.user.role === 'manager' || req.user.role === 'superadmin') && req.query.userId) {
      userId = req.query.userId;
    }

    // Retrieve file headers only unless includeContent is requested
    let fileQuery = File.find({ projectId, userId });
    if (includeContent !== 'true') {
      fileQuery = fileQuery.select('-content');
    }
    const files = await fileQuery.sort({ path: 1 });

    return successResponse(res, files, 'Project files list retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch a specific file's content
 * Route: GET /api/files/:id
 */
const getFileContent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);
    if (!file) {
      return errorResponse(res, 'File not found', 404);
    }

    return successResponse(res, file, 'File details and content retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Save modifications to a file's content
 * Route: PUT /api/files/:id
 */
const updateFileContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const file = await File.findById(id);
    if (!file) {
      return errorResponse(res, 'File not found', 404);
    }

    file.content = content !== undefined ? content : '';
    await file.save();

    return successResponse(res, file, 'File content saved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a file from a workspace
 * Route: DELETE /api/files/:id
 */
const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);
    if (!file) {
      return errorResponse(res, 'File not found', 404);
    }

    await File.findByIdAndDelete(id);

    return successResponse(res, null, 'File deleted successfully from workspace');
  } catch (error) {
    next(error);
  }
};

/**
 * Move or rename a file/folder path recursively
 * Route: POST /api/files/move
 */
const movePath = async (req, res, next) => {
  try {
    const { projectId, sourcePath, targetPath } = req.body;

    if (!projectId || !sourcePath || targetPath === undefined) {
      return errorResponse(res, 'Project ID, source path, and target path are required', 400);
    }

    // Determine the userId. Managers/Admins can specify a user ID, default to authenticated user.
    let userId = req.user._id;
    if ((req.user.role === 'manager' || req.user.role === 'superadmin') && req.body.userId) {
      userId = req.body.userId;
    }

    // Find all files matching the source path (either exact match or starting with sourcePath + '/')
    const filesToMove = await File.find({
      projectId,
      userId,
      $or: [
        { path: sourcePath },
        { path: new RegExp('^' + sourcePath + '/') }
      ]
    });

    for (let file of filesToMove) {
      let newPath;
      if (file.path === sourcePath) {
        newPath = targetPath;
      } else {
        newPath = file.path.replace(new RegExp('^' + sourcePath + '/'), targetPath + '/');
      }

      file.path = newPath;
      const parts = newPath.split('/');
      file.fileName = parts[parts.length - 1];

      await file.save();
    }

    return successResponse(res, null, 'Files moved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Sync all project files from the frontend snapshot (creates, updates, and deletes in bulk)
 * Route: POST /api/files/sync
 */
const syncFiles = async (req, res, next) => {
  try {
    const { projectId, files } = req.body;

    if (!projectId || !Array.isArray(files)) {
      return errorResponse(res, 'Project ID and files array are required', 400);
    }

    const userId = req.user._id;

    // 1. Get all current files in the database for this project and user
    const existingFiles = await File.find({ projectId, userId });
    const existingPathsMap = {};
    existingFiles.forEach(f => {
      existingPathsMap[f.path] = f;
    });

    const incomingPaths = new Set();
    const updatedFilesList = [];

    // 2. Iterate through incoming files to create or update
    for (const incomingFile of files) {
      const { path, content } = incomingFile;
      if (!path) continue;

      incomingPaths.add(path);
      const parts = path.split('/');
      const fileName = parts[parts.length - 1];

      if (existingPathsMap[path]) {
        // File exists: update content
        const fileToUpdate = existingPathsMap[path];
        fileToUpdate.content = content || '';
        await fileToUpdate.save();
        updatedFilesList.push(fileToUpdate);
      } else {
        // File is new: create it
        const newFile = await File.create({
          fileName,
          path,
          content: content || '',
          projectId,
          userId
        });
        updatedFilesList.push(newFile);
      }
    }

    // 3. Find files in MongoDB that were deleted in the editor
    for (const existingFile of existingFiles) {
      if (!incomingPaths.has(existingFile.path)) {
        await File.findByIdAndDelete(existingFile._id);
      }
    }

    return successResponse(res, updatedFilesList, 'Workspace files synchronized successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFile,
  getFilesForProject,
  getFileContent,
  updateFileContent,
  deleteFile,
  movePath,
  syncFiles,
};
