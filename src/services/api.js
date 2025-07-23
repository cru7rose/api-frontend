// src/services/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.danxils.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const { useAuthStore } = await import('@/stores/authStore');
      const authStore = useAuthStore();
      const token = authStore.accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error dynamically importing authStore in request interceptor:', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    try {
      const { useAuthStore } = await import('@/stores/authStore');
      const authStore = useAuthStore();

      if (error.response && error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newAccessToken = await authStore.refreshTokenAction();
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
    } catch (e) {
      console.error('Error dynamically importing authStore in response interceptor:', e);
    }
    return Promise.reject(error);
  }
);

export default apiClient;