import axiosClient from './axiosClient';

const githubApi = {
  getRepo: async (userId = null, projectId = null) => {
    const params = {};
    if (userId) params.userId = userId;
    if (projectId) params.projectId = projectId;
    const response = await axiosClient.get('/api/github', { params });
    return response.data;
  },

  saveRepo: async (repoUrl) => {
    const response = await axiosClient.post('/api/github', { repoUrl });
    return response.data;
  },

  getCommits: async (userId = null, projectId = null) => {
    const params = {};
    if (userId) params.userId = userId;
    if (projectId) params.projectId = projectId;
    const response = await axiosClient.get('/api/github/commits', { params });
    return response.data;
  },

  getBranches: async (userId = null, projectId = null) => {
    const params = {};
    if (userId) params.userId = userId;
    if (projectId) params.projectId = projectId;
    const response = await axiosClient.get('/api/github/branches', { params });
    return response.data;
  },

  getPullRequests: async (userId = null, projectId = null) => {
    const params = {};
    if (userId) params.userId = userId;
    if (projectId) params.projectId = projectId;
    const response = await axiosClient.get('/api/github/pull-requests', { params });
    return response.data;
  },

  getUserRepos: async () => {
    const response = await axiosClient.get('/api/github/user-repos');
    return response.data;
  },

  selectRepo: async (repoName, repoUrl, projectId) => {
    const response = await axiosClient.put('/api/github/select-repo', { repoName, repoUrl, projectId });
    return response.data;
  },

  pushToGitHub: async (projectId, commitMessage, files) => {
    const response = await axiosClient.post('/api/github/push', { projectId, commitMessage, files });
    return response.data;
  },

  createPullRequest: async (projectId, title, body = '') => {
    const response = await axiosClient.post('/api/github/pull-request', { projectId, title, body });
    return response.data;
  },

  mergePullRequest: async (projectId, pullNumber) => {
    const response = await axiosClient.post('/api/github/pull-request/merge', { projectId, pullNumber });
    return response.data;
  },

  syncFromMain: async (projectId) => {
    const response = await axiosClient.post('/api/github/sync', { projectId });
    return response.data;
  },
};

export default githubApi;
