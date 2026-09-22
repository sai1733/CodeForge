import axiosClient from './axiosClient';

const userApi = {
  getUsers: async (params = {}) => {
    const response = await axiosClient.get('/api/users', { params });
    return response.data;
  },
};

export default userApi;
