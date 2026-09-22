const express = require('express');
const { createFile, getFilesForProject, getFileContent, updateFileContent, deleteFile, movePath, syncFiles } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validateMiddleware');

const router = express.Router();

// Get list of project files metadata & Create a new file
router.get('/', protect, getFilesForProject);
router.post('/', protect, validateBody(['fileName', 'path', 'projectId']), createFile);
router.post('/move', protect, validateBody(['projectId', 'sourcePath', 'targetPath']), movePath);
router.post('/sync', protect, validateBody(['projectId', 'files']), syncFiles);

// Get specific file content, Update file content, & Delete file
router.get('/:id', protect, getFileContent);
router.put('/:id', protect, validateBody(['content']), updateFileContent);
router.delete('/:id', protect, deleteFile);

module.exports = router;
