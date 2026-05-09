import axios from 'axios';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'dev-reports-studio.navacle.com') return 'https://dev-reports-api.navacle.com';
    if (host === 'sit-reports-studio.navacle.com') return 'https://sit-reports-api.navacle.com';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('navacle_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
      originalRequest._retry = true;
      try {
        const res = await axios.get(`${getApiBaseUrl()}/v1/auth/refresh`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('navacle_token')}`
          }
        });
        
        const { token } = res.data;
        localStorage.setItem('navacle_token', token);
        
        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear storage and redirect
        localStorage.removeItem('navacle_token');
        localStorage.removeItem('navacle_user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;