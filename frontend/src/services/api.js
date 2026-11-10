import axios from 'axios';

// Get base URL from environment or default to local development backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stockflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid (except when attempting to log in)
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/signup')) {
        localStorage.removeItem('stockflow_token');
        localStorage.removeItem('stockflow_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
