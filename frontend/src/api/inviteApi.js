import axiosClient from './axiosClient';

const inviteApi = {
  createInvite: async (email, projectId = null, role = 'intern') => {
    const response = await axiosClient.post('/api/invites', { email, projectId, role });
    return response.data;
  },

  verifyInvite: async (token) => {
    const response = await axiosClient.get(`/api/invites/verify/${token}`);
    return response.data;
  },

  completeInvite: async (token, name, password) => {
    const response = await axiosClient.post('/api/invites/complete', { token, name, password });
    return response.data;
  },
};

export default inviteApi;
