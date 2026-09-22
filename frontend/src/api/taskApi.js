import axiosClient from './axiosClient';

const taskApi = {
  getTasks: async (params) => {
    const response = await axiosClient.get('/api/tasks', { params });
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await axiosClient.post('/api/tasks', taskData);
    return response.data;
  },

  updateStatus: async (taskId, statusData) => {
    const payload = typeof statusData === 'string' ? { status: statusData } : statusData;
    const response = await axiosClient.patch(`/api/tasks/${taskId}/status`, payload);
    return response.data;
  },
};

export default taskApi;
