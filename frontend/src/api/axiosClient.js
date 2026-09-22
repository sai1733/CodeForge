import axios from 'axios';

// Get API base URL from env variables
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token if it exists in localStorage
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('codeforge_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors (e.g. token expired, account deactivated)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('codeforge_token');
      localStorage.removeItem('codeforge_user');
      
      const msg = error.response.data?.message || '';
      if (msg.toLowerCase().includes('deactivated')) {
        window.location.href = '/login?error=deactivated';
      } else {
        window.location.href = '/login?error=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
