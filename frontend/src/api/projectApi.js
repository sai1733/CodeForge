import axiosClient from './axiosClient';

const projectApi = {
  getProjects: async (params = {}) => {
    const response = await axiosClient.get('/api/projects', { params });
    return response.data;
  },

  createProject: async (projectData) => {
    const response = await axiosClient.post('/api/projects', projectData);
    return response.data;
  },
};

export default projectApi;
