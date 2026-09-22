const Project = require('../models/Project');

/**
 * Resolves all unique intern IDs assigned to projects directed by a specific manager.
 * @param {string} managerId - The ID of the manager
 * @returns {Promise<Array<string>>} List of unique intern user IDs (as strings)
 */
const getManagerInterns = async (managerId) => {
  const projects = await Project.find({ managerId, status: 'active' });
  const internIdSet = new Set();
  
  projects.forEach((project) => {
    if (project.internIds) {
      project.internIds.forEach((id) => {
        internIdSet.add(id.toString());
      });
    }
  });

  return Array.from(internIdSet);
};

module.exports = getManagerInterns;
