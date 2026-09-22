import axiosClient from './axiosClient';

const reportApi = {
  getReports: async (params) => {
    const response = await axiosClient.get('/api/reports', { params });
    return response.data;
  },

  submitReport: async (reportData) => {
    const response = await axiosClient.post('/api/reports', reportData);
    return response.data;
  },

  reviewReport: async (reportId, reviewData) => {
    const response = await axiosClient.patch(`/api/reports/${reportId}/review`, reviewData);
    return response.data;
  },
};

export default reportApi;
