import axiosClient from './axiosClient';

const authApi = {
  login: async (email, password) => {
    const response = await axiosClient.post('/api/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await axiosClient.post('/api/auth/register', userData);
    return response.data;
  },
  
  forgotPassword: async (email) => {
    const response = await axiosClient.post('/api/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (token, password) => {
    const response = await axiosClient.post('/api/auth/reset-password', { token, password });
    return response.data;
  },
};

export default authApi;
