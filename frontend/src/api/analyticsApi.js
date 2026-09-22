import axiosClient from './axiosClient';

const analyticsApi = {
  getInternAnalytics: async (userId = null, projectId = null) => {
    const params = {};
    if (userId) params.userId = userId;
    if (projectId) params.projectId = projectId;
    const response = await axiosClient.get('/api/analytics/intern', { params });
    return response.data;
  },

  getManagerCohortAnalytics: async () => {
    const response = await axiosClient.get('/api/analytics/manager');
    return response.data;
  },

  getSystemAnalytics: async () => {
    const response = await axiosClient.get('/api/analytics/system');
    return response.data;
  },

};

export default analyticsApi;
