import axiosClient from './axiosClient';

const fileApi = {
  getFiles: async (projectId, includeContent = false) => {
    const response = await axiosClient.get('/api/files', { 
      params: { 
        projectId, 
        includeContent: includeContent ? 'true' : 'false' 
      } 
    });
    return response.data;
  },

  getFile: async (fileId) => {
    const response = await axiosClient.get(`/api/files/${fileId}`);
    return response.data;
  },

  createFile: async (fileData) => {
    const response = await axiosClient.post('/api/files', fileData);
    return response.data;
  },

  updateFile: async (fileId, content) => {
    const response = await axiosClient.put(`/api/files/${fileId}`, { content });
    return response.data;
  },

  deleteFile: async (fileId) => {
    const response = await axiosClient.delete(`/api/files/${fileId}`);
    return response.data;
  },

  movePath: async (projectId, sourcePath, targetPath) => {
    const response = await axiosClient.post('/api/files/move', { projectId, sourcePath, targetPath });
    return response.data;
  },

  syncFiles: async (projectId, files) => {
    const response = await axiosClient.post('/api/files/sync', { projectId, files });
    return response.data;
  },
};

export default fileApi;
