import axiosClient from './axiosClient';

const notificationApi = {
  getNotifications: async () => {
    const response = await axiosClient.get('/api/notifications');
    return response.data;
  },
  markAllRead: async () => {
    const response = await axiosClient.patch('/api/notifications/read-all');
    return response.data;
  },
  clearNotification: async (id) => {
    const response = await axiosClient.delete(`/api/notifications/${id}`);
    return response.data;
  },
};

export default notificationApi;
